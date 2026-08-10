import { useMemo } from 'react'
import { useData } from '../state/DataProvider'
import { dataLongaHoje, hojeISO, mesAtual, rotuloMes } from '../lib/dates'
import { CaixaIcone, TituloTela } from '../components/Ui'
import type { Tela } from '../lib/types'

export default function Dashboard({ navegar }: { navegar: (tela: Tela) => void }) {
  const { ppp, desigCelulas, desigCats } = useData()
  const mes = mesAtual()

  // ---- PPPs entregues por mês × responsável ----
  const entregues = useMemo(() => ppp.filter((r) => r.conclusao === 'ENTREGUE'), [ppp])
  const meses = useMemo(
    () => [...new Set(entregues.map((r) => r.mes))].sort((a, b) => b.localeCompare(a)).slice(0, 6),
    [entregues],
  )
  // Só os responsáveis que aparecem nesses meses, pra tabela não ficar quilométrica
  const responsaveis = useMemo(() => {
    const porResp = new Map<string, number>()
    for (const r of entregues.filter((x) => meses.includes(x.mes))) {
      if (r.responsavel) porResp.set(r.responsavel, (porResp.get(r.responsavel) ?? 0) + 1)
    }
    return [...porResp.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nome]) => nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [entregues, meses])

  const contagem = (m: string, resp: string) =>
    entregues.filter((r) => r.mes === m && r.responsavel === resp).length

  const atrasados = ppp.filter(
    (r) => (r.conclusao === 'PENDENTE' || r.conclusao === 'AUXILIO') && r.prazo_entrega < hojeISO(),
  ).length

  const tiles: { rotulo: string; valor: number; icone: string; cor: 'blue' | 'emerald' | 'amber' | 'slate'; tela: Tela }[] = [
    {
      rotulo: `PPPs entregues em ${rotuloMes(mes)}`,
      valor: entregues.filter((r) => r.mes === mes).length,
      icone: 'solar:check-circle-linear',
      cor: 'emerald',
      tela: 'ppp',
    },
    {
      rotulo: 'PPPs em aberto',
      valor: ppp.filter((r) => r.conclusao === 'PENDENTE' || r.conclusao === 'AUXILIO').length,
      icone: 'solar:hourglass-line-linear',
      cor: 'amber',
      tela: 'ppp',
    },
    {
      rotulo: `CATs em ${rotuloMes(mes)}`,
      valor: desigCats.filter((d) => d.data.startsWith(mes)).length,
      icone: 'solar:siren-rounded-linear',
      cor: 'blue',
      tela: 'cat',
    },
    {
      rotulo: `Empresas designadas em ${rotuloMes(mes)}`,
      valor: desigCelulas.filter((d) => d.data.startsWith(mes) && !d.pulada).length,
      icone: 'solar:buildings-2-linear',
      cor: 'slate',
      tela: 'celulas',
    },
  ]

  return (
    <div>
      <TituloTela eyebrow="Dashboard" titulo="Seu dia, já calculado." descricao={capitalizar(dataLongaHoje())} />

      {atrasados > 0 && (
        <button
          onClick={() => navegar('ppp')}
          className="mb-6 w-full text-left rounded-[2rem] bg-red-50/80 border border-red-100 shadow-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300"
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

      {/* Números do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {tiles.map((t) => (
          <button
            key={t.rotulo}
            onClick={() => navegar(t.tela)}
            className="glass-card p-5 text-left hover:-translate-y-1 hover:bg-white/[0.84] transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-3">
              <CaixaIcone nome={t.icone} cor={t.cor} />
              <span className="text-3xl font-light tracking-tight text-slate-950">{t.valor}</span>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 leading-4">{t.rotulo}</p>
          </button>
        ))}
      </div>

      {/* PPPs entregues por mês × responsável */}
      <button
        onClick={() => navegar('ppp')}
        className="glass-card p-6 text-left w-full hover:-translate-y-1 hover:bg-white/[0.84] transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <CaixaIcone nome="solar:document-text-linear" />
          <span className="badge-blue">{entregues.length} entregues no total</span>
        </div>
        <h3 className="text-xl font-normal tracking-tight text-slate-950">PPPs entregues por mês</h3>
        <p className="mt-1 text-sm text-slate-500 font-light mb-4">Quantos cada responsável entregou.</p>

        {meses.length === 0 ? (
          <p className="text-sm text-slate-400 font-light py-4">Nenhum PPP entregue ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="th-label pb-2 pr-4 text-left">Mês</th>
                  {responsaveis.map((r) => (
                    <th key={r} className="th-label pb-2 pr-4 text-left">
                      {r}
                    </th>
                  ))}
                  <th className="th-label pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => (
                  <tr key={m} className="border-t border-slate-100">
                    <td className="py-2 pr-4 text-slate-700 whitespace-nowrap">{rotuloMes(m)}</td>
                    {responsaveis.map((r) => (
                      <td key={r} className="py-2 pr-4 text-slate-500">
                        {contagem(m, r) || '—'}
                      </td>
                    ))}
                    <td className="py-2 text-slate-950">{entregues.filter((x) => x.mes === m).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </button>
    </div>
  )
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
