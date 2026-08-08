# Controle Staff — Design System

Fonte da verdade: `index.html` (template AURA). Este arquivo é a extração normalizada.
O `motion-sequence-asset-sync-DESIGN.md` **não** se aplica — descreve outro template.

## Base

- Fundo da página: `#f3f5f8`, texto `slate-900`
- Tailwind (via CDN no template; migrar para build no app)
- Ícones: Iconify, set `solar:*-linear`, sempre `stroke-width: 1.5`
- Fontes: Inter (300/400/500/600) + JetBrains Mono (400/500/600)

## Cores

| Papel | Valor |
|---|---|
| Fundo | `#f3f5f8` |
| Superfície (card) | `bg-white/68` → hover `bg-white/84` |
| Superfície (nav/footer) | `bg-white/84` + `backdrop-blur-2xl` |
| Borda | `border-white` (superfícies de vidro) / `border-slate-200` (controles) |
| Primária | `blue-500` → `blue-600` (gradiente `to-b`), borda `blue-700` |
| Texto forte | `slate-950` |
| Texto corpo | `slate-600` |
| Texto suave | `slate-500` / `slate-400` |
| Acento sucesso | `emerald-500` sobre `emerald-50` |

Ambiente: 3 blobs `blur-[7.5rem]`–`[8.75rem]` (`blue-200/35`, `sky-200/22`, `white/55`) em drift
de 26–32s + textura de pontos `radial-gradient` 2rem, opacidade `0.22`, drift 38s linear.
Tudo desativado sob `prefers-reduced-motion: reduce`.

## Tipografia

| Token | Estilo |
|---|---|
| Hero | `text-[4rem] md:text-[5.2rem] lg:text-[6.4rem] font-light tracking-[-0.075em] leading-[0.92]` |
| H2 seção | `text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05]` |
| H3 card | `text-xl font-normal tracking-tight text-slate-950` |
| Lead | `text-base md:text-lg leading-8 text-slate-600 font-light` |
| Corpo card | `text-sm leading-6 text-slate-500 font-light` |
| Eyebrow | `font-['JetBrains_Mono'] text-xs font-medium tracking-[-0.04em] text-blue-500`, MAIÚSCULAS |
| Badge | `font-['JetBrains_Mono'] text-[10px]` |

Mono é reservado a marca, eyebrows, badges e metadados técnicos. Nunca em texto corrido.

## Sombras (a assinatura do template)

Sempre duas camadas: difusa externa + linha branca interna.

```
card       0_10px_28px_-18px_rgba(15,23,42,0.24), inset_0_1px_0_white
nav        0_14px_38px_-22px_rgba(15,23,42,0.42), inset_0_1px_0_rgba(255,255,255,1)
elevado    0_18px_38px_-20px_rgba(15,23,42,0.45), inset_0_1px_0_white
mockup     0_30px_80px_-35px_rgba(15,23,42,0.35), inset_0_2px_0_rgba(255,255,255,1)
btn-azul   0_10px_24px_rgba(59,130,246,0.26),     inset_0_1px_0_rgba(255,255,255,0.35)
controle   0_1px_2px_rgba(15,23,42,0.04),         inset_0_1px_0_white
```

## Raios

- Nav, botões, badges, pills: `rounded-full`
- Cards: `rounded-[2rem]`
- Painéis/mockups: `rounded-[1.5rem]` interno, `rounded-[2rem]` externo
- Caixa de ícone: `rounded-2xl` (`w-11 h-11`)

## Layout

- Container: `max-w-7xl mx-auto px-6`
- Seção: `py-20` (hero: `pt-32 md:pt-40 pb-20`)
- Grid de cards: `grid md:grid-cols-2 lg:grid-cols-3 gap-4`
- Intro de seção: `text-center max-w-5xl mx-auto mb-14`
- `scroll-behavior: smooth` + `:target { scroll-margin-top: 7.5rem }`

## Componentes

**Botão primário** — `rounded-full px-6 py-3.5 bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-700 text-white text-sm font-normal` + sombra `btn-azul`; hover `from-blue-400 to-blue-500 -translate-y-0.5`; active `inset_0_2px_4px_rgba(0,0,0,0.18)`.

**Botão secundário** — `rounded-full px-6 py-3.5 bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-slate-700`; hover `from-slate-50 to-slate-100 -translate-y-0.5`.

**Card** — `rounded-[2rem] bg-white/68 border border-white p-6` + sombra `card`; hover `-translate-y-1 bg-white/84`.

**Badge** — `rounded-full px-2.5 py-1 text-[10px]` mono. Azul: `text-blue-500 bg-blue-50 border-blue-100`. Neutro: `text-slate-500 bg-white border-slate-200` + `inset_0_1px_0_white`.

**Link de nav** — sublinhado que cresce: `after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full`, com `hover:text-blue-600`.

## Movimento

- Padrão: `transition-all duration-300`
- Hover lift: `-translate-y-0.5` (controles) / `-translate-y-1` (cards)
- Ambiente: `ease-in-out infinite`, 26–38s, via `transform: translate3d()` + `will-change-transform`
- Contadores numéricos animam em ~260ms
- Easing suave e contido. Sem bounce, sem overshoot.

## Guardrails

- Não trocar para tema escuro.
- Sempre a linha `inset 0 1px 0 white` — é ela que dá o aspecto de vidro polido.
- Superfícies são translúcidas (`/68`, `/84`), nunca `bg-white` sólido.
- Tracking negativo forte em títulos; `font-light`/`font-normal`, nunca `bold`.
- Não achatar em grid genérico de cards; preservar densidade e ritmo do template.
