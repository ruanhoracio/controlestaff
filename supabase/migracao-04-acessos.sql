-- =============================================================
-- Migração 04 — acessos individuais, papéis e histórico
--
-- Antes: cada login era uma ilha (RLS por user_id), então um novo
-- cadastro entrava num app vazio. Agora todo mundo trabalha nos
-- MESMOS dados, com permissão diferente por papel:
--
--   gestor    → tudo, mais o histórico de atividade
--   tecnico   → só o Controle de PPP (lançar, editar e excluir)
--   bloqueado → não vê nada (pra barrar cadastro indevido)
--
-- Cole no SQL Editor do Supabase e execute. Roda quantas vezes quiser.
-- =============================================================

-- ---------- Quem é quem ----------
create table if not exists public.perfis (
  user_id    uuid primary key references auth.users on delete cascade,
  nome       text not null default '',
  email      text not null default '',
  papel      text not null default 'tecnico'
             check (papel in ('gestor', 'tecnico', 'bloqueado')),
  created_at timestamptz not null default now()
);

-- Papel de quem está logado. SECURITY DEFINER pra poder ser usado dentro
-- das próprias políticas de RLS sem cair em recursão.
create or replace function public.papel_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where user_id = auth.uid()
$$;

-- Perfil criado junto com a conta, a partir do que a pessoa escolheu no cadastro.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (user_id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'papel' = 'gestor' then 'gestor' else 'tecnico' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists perfil_ao_criar_usuario on auth.users;
create trigger perfil_ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Contas que já existiam são as donas do app: entram como gestor.
insert into public.perfis (user_id, nome, email, papel)
select id, coalesce(raw_user_meta_data ->> 'nome', ''), coalesce(email, ''), 'gestor'
from auth.users
on conflict (user_id) do nothing;

-- ---------- Histórico de atividade ----------
create table if not exists public.log_atividade (
  id          bigint generated always as identity primary key,
  user_id     uuid,
  quem        text not null default '',   -- nome/e-mail no momento da ação
  tabela      text not null,
  acao        text not null,              -- INSERT | UPDATE | DELETE
  registro_id uuid,
  resumo      text not null default '',   -- descrição legível da linha mexida
  antes       jsonb,
  depois      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists log_atividade_data on public.log_atividade (created_at desc);

create or replace function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes  jsonb;
  v_depois jsonb;
  v_linha  jsonb;
  v_resumo text;
begin
  if tg_op = 'DELETE' then
    v_antes := to_jsonb(old); v_depois := null;        v_linha := v_antes;
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old); v_depois := to_jsonb(new); v_linha := v_depois;
  else
    v_antes := null;          v_depois := to_jsonb(new); v_linha := v_depois;
  end if;

  v_resumo := case tg_table_name
    when 'ppp_records'        then concat_ws(' · ', v_linha ->> 'funcionario', v_linha ->> 'empresa')
    when 'designacoes_celula' then concat_ws(' · ', coalesce(nullif(v_linha ->> 'empresa', ''), 'vez pulada'),
                                                    v_linha ->> 'porte', v_linha ->> 'celula')
    when 'designacoes_cat'    then concat_ws(' · ', v_linha ->> 'tecnico', v_linha ->> 'celula')
    else 'configuração da equipe'
  end;

  insert into public.log_atividade (user_id, quem, tabela, acao, registro_id, resumo, antes, depois)
  values (
    auth.uid(),
    coalesce((select nullif(nome, '') from public.perfis where user_id = auth.uid()),
             (select email        from public.perfis where user_id = auth.uid()),
             'desconhecido'),
    tg_table_name,
    tg_op,
    (v_linha ->> 'id')::uuid,
    coalesce(v_resumo, ''),
    v_antes,
    v_depois
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists log_ppp      on public.ppp_records;
drop trigger if exists log_celulas  on public.designacoes_celula;
drop trigger if exists log_cats     on public.designacoes_cat;
drop trigger if exists log_config   on public.app_config;

create trigger log_ppp     after insert or update or delete on public.ppp_records
  for each row execute function public.registrar_atividade();
create trigger log_celulas after insert or update or delete on public.designacoes_celula
  for each row execute function public.registrar_atividade();
create trigger log_cats    after insert or update or delete on public.designacoes_cat
  for each row execute function public.registrar_atividade();
create trigger log_config  after insert or update or delete on public.app_config
  for each row execute function public.registrar_atividade();

-- ---------- Políticas: dados compartilhados, permissão por papel ----------
alter table public.perfis        enable row level security;
alter table public.log_atividade enable row level security;

drop policy if exists "dono" on public.ppp_records;
drop policy if exists "dono" on public.designacoes_celula;
drop policy if exists "dono" on public.designacoes_cat;
drop policy if exists "dono" on public.app_config;

-- PPP: gestor e técnico lançam, editam e excluem.
drop policy if exists "equipe" on public.ppp_records;
create policy "equipe" on public.ppp_records for all
  using (public.papel_atual() in ('gestor', 'tecnico'))
  with check (public.papel_atual() in ('gestor', 'tecnico'));

-- Rodízios: só gestor. Pro técnico o select simplesmente volta vazio.
drop policy if exists "gestor" on public.designacoes_celula;
create policy "gestor" on public.designacoes_celula for all
  using (public.papel_atual() = 'gestor') with check (public.papel_atual() = 'gestor');

drop policy if exists "gestor" on public.designacoes_cat;
create policy "gestor" on public.designacoes_cat for all
  using (public.papel_atual() = 'gestor') with check (public.papel_atual() = 'gestor');

-- Equipe: todo mundo lê (o formulário de PPP usa a lista de responsáveis),
-- só gestor altera.
drop policy if exists "ler equipe"    on public.app_config;
drop policy if exists "gestor grava"  on public.app_config;
create policy "ler equipe" on public.app_config for select
  using (public.papel_atual() in ('gestor', 'tecnico'));
create policy "gestor grava" on public.app_config for all
  using (public.papel_atual() = 'gestor') with check (public.papel_atual() = 'gestor');

-- Perfis: cada um vê o seu; gestor vê e ajusta o de todos.
drop policy if exists "ver o proprio" on public.perfis;
drop policy if exists "gestor ve"     on public.perfis;
drop policy if exists "gestor ajusta" on public.perfis;
create policy "ver o proprio" on public.perfis for select using (user_id = auth.uid());
create policy "gestor ve"     on public.perfis for select using (public.papel_atual() = 'gestor');
create policy "gestor ajusta" on public.perfis for update
  using (public.papel_atual() = 'gestor') with check (public.papel_atual() = 'gestor');

-- Histórico: leitura só de gestor. Ninguém escreve pela API — só o gatilho.
drop policy if exists "gestor le" on public.log_atividade;
create policy "gestor le" on public.log_atividade for select
  using (public.papel_atual() = 'gestor');
