import { useMemo } from 'react'
import { useData } from '../state/DataProvider'
import { RODIZIOS } from '../lib/config'
import { proximaCelula, proximoEsocial, proximoTecnico, responsavelDaVez } from '../lib/rodizio'
import { dataLongaHoje, hojeISO, mesAtual, rotuloMes } from '../lib/dates'
import { CaixaIcone, Eyebrow, Icone, TituloTela } from '../components/Ui'
import type { Tela } from '../lib/types'

export default function Dashboard({ navegar }: { navegar: (tela: Tela) => void }) {
  const { ppp, desigCelulas, desigCats, equipe } = useData()

  // ---- PPPs entregues por mês × responsável ----
  const entregues = useMemo(() => ppp.filter((r) => r.conclusao === 'ENTREGUE'), [ppp])
  const meses = useMemo(
    () => [...new Set(entregues.map((r) => r.mes))].sort((a, b) => b.localeCompare(a)).slice(0, 6),
    [entregues],
  )
  // Só os responsáveis que aparecem nesses meses, pra tabela não ficar quilométrica
  const responsaveis = useMemo(() => {
    const nosMeses = entregues.filter((r) => meses.includes(r.mes))
    const porResp = new Map<string, number>()
    for (const r of nosMeses) {
      if (r.responsavel) porResp.set(r.responsavel, (porResp.get(r.responsavel) ?? 0) + 1)
    }
    return [...porResp.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nome]) => nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [entregues, meses])

  const contagem = (mes: string, resp: string) =>
    entregues.filter((r) => r.mes === mes && r.responsavel === resp).length

  // ---- Próxima da vez por rodízio ----
  const esocialDaVez = proximoEsocial(desigCelulas, equipe)
  const proximas = RODIZIOS.map((rod) => {
    const posicao = proximaCelula(desigCelulas.filter((d) => d.porte === rod.id), rod.id, equipe)
    return {
      rodizio: rod.id,
      posicao,
      responsavel: posicao ? responsavelDaVez(posicao, rod.id, equipe) : '',
    }
  })

  // ---- Próximo técnico CAT por célula ----
  const catsDoMes = desigCats.filter((d) => d.data.startsWith(mesAtual()))
  const proximosCat = equipe.celulas.map((c) => ({
    celula: c.nome,
    tecnico: proximoTecnico(
      c.tecnicos,
      catsDoMes.filter((d) => d.celula === c.nome),
    ),
  }))

  const atrasados = ppp.filter(
    (r) => (r.conclusao === 'PENDENTE' || r.conclusao === 'AUXILIO') && r.prazo_entrega < hojeISO(),
  ).length

  return (
    <div>
      <TituloTela eyebrow="Visão geral" titulo="Seu dia, já calculado." descricao={capitalizar(dataLongaHoje())} />

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

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* PPPs entregues por mês */}
        <button
          onClick={() => navegar('ppp')}
          className="glass-card p-6 text-left hover:-translate-y-1 hover:bg-white/[0.84] transition-all duration-300"
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
                  {meses.map((mes) => (
                    <tr key={mes} className="border-t border-slate-100">
                      <td className="py-2 pr-4 text-slate-700 whitespace-nowrap">{rotuloMes(mes)}</td>
                      {responsaveis.map((r) => (
                        <td key={r} className="py-2 pr-4 text-slate-500">
                          {contagem(mes, r) || '—'}
                        </td>
                      ))}
                      <td className="py-2 text-slate-950">{entregues.filter((x) => x.mes === mes).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </button>

        {/* Próximo CAT por célula */}
        <button
          onClick={() => navegar('cat')}
          className="glass-card p-6 text-left hover:-translate-y-1 hover:bg-white/[0.84] transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-4 mb-5">
            <CaixaIcone nome="solar:siren-rounded-linear" cor="amber" />
            <span className="badge-neutral">ciclo de {rotuloMes(mesAtual())}</span>
          </div>
          <h3 className="text-xl font-normal tracking-tight text-slate-950">Próximo CAT por célula</h3>
          <p className="mt-1 text-sm text-slate-500 font-light mb-4">Quem atende o próximo acidente em cada célula.</p>
          <div className="space-y-3">
            {proximosCat.map(({ celula, tecnico }) => (
              <div
                key={celula}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.6] border border-white px-4 py-3"
              >
                <span className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 shrink-0">
                  {celula}
                </span>
                {tecnico ? (
                  <span className="text-sm text-slate-950 truncate">{tecnico}</span>
                ) : (
                  <span className="text-xs text-slate-400 font-light">cadastre os técnicos em Equipe</span>
                )}
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Próxima da vez por rodízio */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <Eyebrow>Rodízio de empresas novas</Eyebrow>
            <h3 className="text-xl font-normal tracking-tight text-slate-950">Próxima da vez, por rodízio</h3>
            {esocialDaVez && (
              <p className="text-xs text-slate-500 font-light mt-1">
                eSocial da vez: <span className="text-slate-950">{esocialDaVez}</span>
              </p>
            )}
          </div>
          <button onClick={() => navegar('celulas')} className="btn-secondary text-xs px-4 py-2">
            Designar
            <Icone nome="solar:arrow-right-linear" className="text-base" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {proximas.map((p) => (
            <button
              key={p.rodizio}
              onClick={() => navegar('celulas')}
              className="text-left rounded-2xl bg-white/[0.6] border border-white p-4 hover:-translate-y-0.5 hover:bg-white/[0.84] transition-all duration-300"
            >
              <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-2 leading-4">
                {p.rodizio}
              </p>
              {p.posicao ? (
                <>
                  <p className="text-lg text-slate-950 tracking-tight">{p.posicao}</p>
                  <p className="text-xs text-slate-500 font-light mt-1">{p.responsavel || '—'}</p>
                </>
              ) : (
                <p className="text-xs text-slate-400 font-light">sem fila configurada</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
