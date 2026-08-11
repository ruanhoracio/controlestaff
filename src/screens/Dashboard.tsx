import { useMemo } from 'react'
import { useData } from '../state/DataProvider'
import { RODIZIO_ORDEM } from '../lib/config'
import { hojeISO, mesAtual, rotuloMes } from '../lib/dates'
import { CaixaIcone, TituloTela } from '../components/Ui'
import type { Tela } from '../lib/types'

/** Últimos N meses a partir do mês corrente, do mais recente para o mais antigo. */
function ultimosMeses(n: number): string[] {
  const [ano, mes] = mesAtual().split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(ano, mes - 1 - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

export default function Dashboard({ navegar }: { navegar: (tela: Tela) => void }) {
  const { ppp, desigCelulas, desigCats } = useData()
  const mes = mesAtual()

  // ---- PPPs entregues por mês × responsável ----
  const entregues = useMemo(() => ppp.filter((r) => r.conclusao === 'ENTREGUE'), [ppp])
  const mesesPpp = useMemo(
    () => [...new Set(entregues.map((r) => r.mes))].sort((a, b) => b.localeCompare(a)).slice(0, 6),
    [entregues],
  )
  // Só os responsáveis que aparecem nesses meses, pra tabela não ficar quilométrica
  const responsaveis = useMemo(() => {
    const porResp = new Map<string, number>()
    for (const r of entregues.filter((x) => mesesPpp.includes(x.mes))) {
      if (r.responsavel) porResp.set(r.responsavel, (porResp.get(r.responsavel) ?? 0) + 1)
    }
    return [...porResp.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nome]) => nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [entregues, mesesPpp])

  const meses6 = ultimosMeses(6)

  const atrasados = ppp.filter(
    (r) => (r.conclusao === 'PENDENTE' || r.conclusao === 'AUXILIO') && r.prazo_entrega < hojeISO(),
  ).length

  const tiles = [
    {
      rotulo: `PPPs entregues em ${rotuloMes(mes)}`,
      valor: entregues.filter((r) => r.mes === mes).length,
      icone: 'solar:check-circle-linear',
      cor: 'emerald' as const,
    },
    {
      rotulo: 'PPPs em aberto',
      valor: ppp.filter((r) => r.conclusao === 'PENDENTE' || r.conclusao === 'AUXILIO').length,
      icone: 'solar:hourglass-line-linear',
      cor: 'amber' as const,
    },
  ]

  return (
    <div>
      <TituloTela eyebrow="Dashboard" titulo="" />

      {atrasados > 0 && (
        <button
          onClick={() => navegar('ppp')}
          className="mb-6 w-full text-left rounded-[2rem] bg-red-50/80 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 shadow-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300"
        >
          <CaixaIcone nome="solar:danger-triangle-linear" cor="red" />
          <div>
            <p className="text-sm text-slate-950">
              {atrasados} {atrasados === 1 ? 'PPP atrasado' : 'PPPs atrasados'}
            </p>
            <p className="text-xs text-slate-500 font-light">
              Passaram do prazo e ainda não foram entregues. Clique pra ver.
            </p>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4 max-w-2xl">
        {tiles.map((t) => (
          <button
            key={t.rotulo}
            onClick={() => navegar('ppp')}
            className="glass-card p-5 text-left hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-3">
              <CaixaIcone nome={t.icone} cor={t.cor} />
              <span className="text-3xl font-light tracking-tight text-slate-950">{t.valor}</span>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 leading-4">{t.rotulo}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* PPPs entregues por mês × responsável */}
        <TabelaResumo
          icone="solar:document-text-linear"
          titulo="PPPs entregues por mês"
          descricao="Quantos cada responsável entregou."
          badge={`${entregues.length} entregues no total`}
          colunas={responsaveis}
          linhas={mesesPpp}
          valor={(m, resp) => entregues.filter((r) => r.mes === m && r.responsavel === resp).length}
          total={(m) => entregues.filter((r) => r.mes === m).length}
          aoClicar={() => navegar('ppp')}
          vazio="Nenhum PPP entregue ainda."
        />

        {/* CATs por mês × célula */}
        <TabelaResumo
          icone="solar:siren-rounded-linear"
          cor="amber"
          titulo="CATs por mês"
          descricao="Quantos acidentes cada célula atendeu."
          badge={`${desigCats.length} no total`}
          colunas={[...RODIZIO_ORDEM]}
          linhas={meses6}
          valor={(m, cel) => desigCats.filter((d) => d.data.startsWith(m) && d.celula === cel).length}
          total={(m) => desigCats.filter((d) => d.data.startsWith(m)).length}
          aoClicar={() => navegar('cat')}
          vazio="Nenhum CAT designado ainda."
        />

        {/* Empresas designadas por mês × célula */}
        <TabelaResumo
          icone="solar:buildings-2-linear"
          cor="slate"
          titulo="Empresas designadas por mês"
          descricao="Quantas empresas novas cada célula recebeu."
          badge={`${desigCelulas.filter((d) => !d.pulada).length} no total`}
          colunas={[...RODIZIO_ORDEM]}
          linhas={meses6}
          valor={(m, cel) =>
            desigCelulas.filter((d) => d.data.startsWith(m) && d.celula === cel && !d.pulada).length
          }
          total={(m) => desigCelulas.filter((d) => d.data.startsWith(m) && !d.pulada).length}
          aoClicar={() => navegar('celulas')}
          vazio="Nenhuma designação ainda."
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function TabelaResumo({
  icone,
  cor = 'blue',
  titulo,
  descricao,
  badge,
  colunas,
  linhas,
  valor,
  total,
  aoClicar,
  vazio,
}: {
  icone: string
  cor?: 'blue' | 'amber' | 'slate'
  titulo: string
  descricao: string
  badge: string
  colunas: string[]
  linhas: string[]
  valor: (linha: string, coluna: string) => number
  total: (linha: string) => number
  aoClicar: () => void
  vazio: string
}) {
  const temDados = linhas.some((l) => total(l) > 0)
  return (
    <button
      onClick={aoClicar}
      className="glass-card p-6 text-left w-full hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <CaixaIcone nome={icone} cor={cor} />
        <span className="badge-blue">{badge}</span>
      </div>
      <h3 className="text-xl font-normal tracking-tight text-slate-950">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-500 font-light mb-4">{descricao}</p>

      {!temDados ? (
        <p className="text-sm text-slate-400 font-light py-4">{vazio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="th-label pb-2 pr-4 text-left">Mês</th>
                {colunas.map((c) => (
                  <th key={c} className="th-label pb-2 pr-4 text-left">
                    {c}
                  </th>
                ))}
                <th className="th-label pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-700 whitespace-nowrap">{rotuloMes(l)}</td>
                  {colunas.map((c) => (
                    <td key={c} className="py-2 pr-4 text-slate-500">
                      {valor(l, c) || '—'}
                    </td>
                  ))}
                  <td className="py-2 text-slate-950">{total(l) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </button>
  )
}
