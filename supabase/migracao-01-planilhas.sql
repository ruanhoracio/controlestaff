-- =============================================================
-- Migração 01 — ajusta o schema ao que as planilhas reais usam
--
-- Rode ANTES do arquivo de importação (importacao.sql).
-- Mudanças:
--   1. ppp_records ganha a coluna "observacao"
--   2. as conclusões passam a ser as 5 reais da planilha
--      (ELETRÔNICO era tipo, não conclusão)
-- =============================================================

alter table public.ppp_records
  add column if not exists observacao text not null default '';

alter table public.ppp_records
  drop constraint if exists ppp_records_conclusao_check;

-- Registros antigos que usavam ELETRONICO como conclusão viram PENDENTE,
-- e o valor passa para o campo tipo, que é onde ele pertence.
update public.ppp_records
   set tipo = case when coalesce(tipo, '') = '' then 'ELETRÔNICO' else tipo end,
       conclusao = 'PENDENTE'
 where conclusao = 'ELETRONICO';

alter table public.ppp_records
  add constraint ppp_records_conclusao_check
  check (conclusao in ('ENTREGUE', 'PENDENTE', 'AUXILIO', 'NAO_SE_APLICA', 'DESCONSIDERADO'));

-- Índices para as consultas que a tela de PPP faz (a base passa de 600 linhas)
create index if not exists ppp_records_user_mes_idx on public.ppp_records (user_id, mes);
create index if not exists ppp_records_user_conclusao_idx on public.ppp_records (user_id, conclusao);
create index if not exists designacoes_celula_user_porte_idx on public.designacoes_celula (user_id, porte);
create index if not exists designacoes_cat_user_data_idx on public.designacoes_cat (user_id, data);
