-- =============================================================
-- Migração 03 — funcionário ativo no Controle de PPP
--
-- Marca explícita de "ainda trabalha na empresa". Sem ela, demissão
-- em branco fica ambígua: pode ser que não saiu, pode ser que a data
-- não foi preenchida.
--
-- Cole no SQL Editor do Supabase e execute. Roda quantas vezes quiser.
-- =============================================================

alter table public.ppp_records
  add column if not exists ativo boolean not null default false;
