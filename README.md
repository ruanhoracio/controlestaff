# Controle Staff

App de organização para técnica de segurança do trabalho. Página única com menu
lateral: **Início** (dashboard), **Controle de PPP**, **Designar Célula**,
**Designar CAT** e **Equipe**. Dados salvos online (Supabase) — abre de qualquer
computador com o mesmo login e nada se perde ao fechar a página.

## Rodando localmente

```bash
npm install
npm run dev
```

Sem o `.env.local` preenchido o app abre numa tela de configuração explicando o
que falta.

## Configurar o banco (uma vez só)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No projeto: **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → Run.
3. Em **Settings → API**, copie a *Project URL* e a chave *anon public*.
4. Copie `.env.example` para `.env.local` e preencha os dois valores.
5. Rode `npm run dev` e crie a conta dela pela própria tela de login
   ("Primeira vez? Criar conta").
   - Se o Supabase pedir confirmação de e-mail e isso atrapalhar, desative em
     **Authentication → Providers → Email → Confirm email**.

## Publicar (pra usar de qualquer máquina)

Qualquer host estático serve. Com [Vercel](https://vercel.com) (grátis):
importe o repositório, defina as duas variáveis de ambiente
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) e publique. O comando de build
é `npm run build`, saída em `dist/`.

## Regras de negócio (onde ajustar)

| Regra | Arquivo |
| --- | --- |
| Ordem do rodízio de células (**a confirmar**: I → II → III fixa) | `src/lib/config.ts` → `RODIZIO_ORDEM` |
| Prazo do PPP (7 dias úteis) | `src/lib/config.ts` → `PRAZO_PPP_DIAS_UTEIS` |
| Portes de empresa | `src/lib/config.ts` → `PORTES` |
| Equipe padrão da primeira execução | `src/lib/config.ts` → `EQUIPE_PADRAO` |
| Cálculo de dias úteis | `src/lib/dates.ts` |
| Lógica dos rodízios (célula e CAT) | `src/lib/rodizio.ts` |

Nomes de técnicos, responsáveis de eSocial e gestores são editados na tela
**Equipe** dentro do app (ficam salvos online, não no código).

### Como o app decide "de quem é a vez"

- **Célula**: por porte, a vez é sempre a célula seguinte à da última designação
  registrada (puladas também avançam). Excluir uma linha do histórico volta a vez.
- **CAT**: fila alfabética por célula; o próximo é quem tem menos CATs no mês
  corrente (empate = ordem alfabética). Virou o mês, a fila reinicia sozinha.

## Design

Tokens e componentes visuais em `DESIGN-SYSTEM.md` (extraídos do template AURA,
em `design-reference/`).

## Estrutura online pronta pra crescer

Toda linha tem `user_id` com RLS "cada um vê o seu". Hoje é uma conta só; se um
dia virar equipe compartilhando os mesmos dados, basta trocar a política de RLS
por uma baseada em organização — o schema não muda.
