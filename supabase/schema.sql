-- =============================================================
-- Controle Staff — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do projeto e execute.
--
-- Cada tabela tem user_id + RLS: cada login só vê os próprios
-- dados. Isso já deixa a estrutura pronta pra virar equipe
-- (novos logins = novos espaços de dados isolados).
-- =============================================================

-- ---------- Módulo 1: Controle de PPP ----------
create table public.ppp_records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid(),
  empresa          text not null,
  funcionario      text not null,
  celula           text not null default '',
  tipo             text not null default '',
  admissao         date,
  demissao         date,
  data_solicitada  date not null,
  prazo_entrega    date not null,           -- calculado no app: 7 dias úteis
  data_entrega     date,
  responsavel      text not null default '',
  mes              text not null,           -- 'YYYY-MM', derivado do prazo
  conclusao        text not null default 'PENDENTE'
                   check (conclusao in ('ENTREGUE', 'PENDENTE', 'ELETRONICO')),
  created_at       timestamptz not null default now()
);

-- ---------- Módulo 2: rodízio de células ----------
create table public.designacoes_celula (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  data        date not null,
  porte       text not null,
  empresa     text,                          -- null quando a vez foi pulada
  celula      text not null,
  responsavel text not null default '',
  esocial     text not null default '',
  pulada      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Módulo 3: rodízio de CAT ----------
create table public.designacoes_cat (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  data       date not null,
  celula     text not null,
  tecnico    text not null,
  direta     boolean not null default false, -- designado fora do rodízio
  created_at timestamptz not null default now()
);

-- ---------- Configuração da equipe (tela Equipe) ----------
create table public.app_config (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  equipe     jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------- RLS: cada login só enxerga o que é dele ----------
alter table public.ppp_records        enable row level security;
alter table public.designacoes_celula enable row level security;
alter table public.designacoes_cat    enable row level security;
alter table public.app_config         enable row level security;

create policy "dono" on public.ppp_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dono" on public.designacoes_celula
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dono" on public.designacoes_cat
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dono" on public.app_config
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
