-- =============================================================
-- Migração 02 — ajustes pedidos pela técnica
--
--   1. Nomes de empresa, funcionário, responsável e tipo em MAIÚSCULAS
--   2. Equipe no formato novo:
--        - some o campo "gestor" (é o próprio responsável da célula)
--        - eSocial deixa de ser fila global e passa a ser fixo por célula,
--          com deslocamento próprio em cada rodízio
--   3. Corrige o eSocial das designações já importadas
--
-- Rode depois da migracao-01. É repetível.
-- =============================================================

-- ---------- 1. Padronização em maiúsculas ----------
update public.ppp_records
   set empresa     = upper(trim(empresa)),
       funcionario = upper(trim(funcionario)),
       responsavel = upper(trim(responsavel)),
       tipo        = upper(trim(tipo))
 where empresa     <> upper(trim(empresa))
    or funcionario <> upper(trim(funcionario))
    or responsavel <> upper(trim(responsavel))
    or tipo        <> upper(trim(tipo));

update public.designacoes_celula
   set empresa = upper(trim(empresa))
 where empresa is not null and empresa <> upper(trim(empresa));

-- ---------- 2. Equipe no formato novo ----------
update public.app_config
   set equipe = jsonb_build_object(
     'celulas', (
       select jsonb_agg(
                jsonb_build_object(
                  'nome',        c->>'nome',
                  -- o antigo "gestor" e o "responsável" eram a mesma pessoa
                  'responsavel', coalesce(nullif(c->>'responsavel', ''), c->>'gestor', ''),
                  'tecnicos',    coalesce(c->'tecnicos', '[]'::jsonb)
                )
                order by ord
              )
         from jsonb_array_elements(equipe->'celulas') with ordinality as t(c, ord)
     ),
     'esocial', jsonb_build_object(
       'fila', case
                 -- formato antigo: esocial era um array simples
                 when jsonb_typeof(equipe->'esocial') = 'array' then equipe->'esocial'
                 when jsonb_typeof(equipe#>'{esocial,fila}') = 'array' then equipe#>'{esocial,fila}'
                 else '["Poline", "Miriã", "Edvani"]'::jsonb
               end,
       -- Fixo por célula. A Pequena Empresa está uma posição adiante das demais.
       'porRodizio', jsonb_build_object(
         'Empreiteiras Regionais', jsonb_build_object(
           'Célula I', 'Poline', 'Célula II', 'Miriã', 'Célula III', 'Edvani'),
         'Pequena Empresa', jsonb_build_object(
           'Célula I', 'Miriã',  'Célula II', 'Edvani', 'Célula III', 'Poline'),
         'Média Empresa', jsonb_build_object(
           'Célula I', 'Poline', 'Célula II', 'Miriã', 'Célula III', 'Edvani'),
         'Grande Empresa', jsonb_build_object(
           'Célula I', 'Poline', 'Célula II', 'Miriã', 'Célula III', 'Edvani'),
         'Rede Corporativa', jsonb_build_object(
           'Célula I', 'Poline', 'Célula II', 'Miriã', 'Célula III', 'Edvani')
       )
     ),
     'ergonomistas', coalesce(equipe->'ergonomistas', '[]'::jsonb)
   );

-- ---------- 3. eSocial das designações já registradas ----------
-- "Exames" e "Ergonomistas" não têm eSocial; nos demais, vem da célula.
update public.designacoes_celula d
   set esocial = ''
 where d.porte in ('Exames, Pontual, PGSM e Licitações', 'Ergonomistas')
   and d.esocial <> '';

update public.designacoes_celula d
   set esocial = coalesce(c.equipe#>>array['esocial', 'porRodizio', d.porte, d.celula], '')
  from public.app_config c
 where c.user_id = d.user_id
   and d.porte in ('Empreiteiras Regionais', 'Pequena Empresa', 'Média Empresa',
                   'Grande Empresa', 'Rede Corporativa')
   and d.esocial is distinct from
       coalesce(c.equipe#>>array['esocial', 'porRodizio', d.porte, d.celula], '');
