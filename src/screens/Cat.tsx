import { useState } from 'react'
import { useData } from '../state/DataProvider'
import { contagemDoMes, filaAlfabetica, proximoTecnico } from '../lib/rodizio'
import { formatarData, hojeISO, mesAtual, rotuloMes } from '../lib/dates'
import { EstadoVazio, Eyebrow, Icone, TituloTela } from '../components/Ui'

export default function Cat({ irParaEquipe }: { irParaEquipe: () => void }) {
  const { desigCats, adicionarDesigCat, excluirDesigCat, equipe } = useData()
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const catsDoMes = desigCats.filter((d) => d.data.startsWith(mesAtual()))

  async function designar(celula: string, tecnico: string, direta: boolean) {
    setOcupado(true)
    setErro(null)
    try {
      await adicionarDesigCat({ data: hojeISO(), celula, tecnico, direta })
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function excluir(id: string, tecnico: string) {
    if (!confirm(`Excluir a designação de ${tecnico}? A fila volta pra ele.`)) return
    setErro(null)
    try {
      await excluirDesigCat(id)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <TituloTela
        eyebrow="Módulo 3"
        titulo="Designar CAT"
        descricao={`Fila alfabética por célula, reinicia todo mês. Ciclo atual: ${rotuloMes(mesAtual())}.`}
      />

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {equipe.celulas.map((c) => {
          const catsDaCelula = catsDoMes.filter((d) => d.celula === c.nome)
          const proximo = proximoTecnico(c.tecnicos, catsDaCelula)
          const fila = filaAlfabetica(c.tecnicos)
          const contagem = contagemDoMes(fila, catsDaCelula)
          return (
            <div key={c.nome} className="glass-card p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400">{c.nome}</p>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Gestor: {c.gestor || '—'}</p>
                </div>
                <span className="badge-neutral">{catsDaCelula.length} no mês</span>
              </div>

              {fila.length === 0 ? (
                <div className="flex-1">
                  <EstadoVazio icone="solar:users-group-rounded-linear" mensagem="Sem técnicos cadastrados." />
                  <button className="btn-secondary w-full text-xs" onClick={irParaEquipe}>
                    Cadastrar na Equipe
                  </button>
                </div>
              ) : (
                <>
                  {/* Próximo a atender, em destaque */}
                  <div className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-700 shadow-btn px-5 py-4 mb-3">
                    <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-blue-100 mb-1">próximo a atender</p>
                    <p className="text-lg text-white tracking-tight">{proximo}</p>
                  </div>
                  <button className="btn-primary w-full mb-4" disabled={ocupado} onClick={() => designar(c.nome, proximo!, false)}>
                    <Icone nome="solar:siren-rounded-linear" />
                    Designar CAT
                  </button>

                  <ul className="space-y-2 flex-1">
                    {fila.map((t) => {
                      const n = contagem.get(t)!
                      const ultimo = [...desigCats]
                        .filter((d) => d.celula === c.nome && d.tecnico === t)
                        .sort((a, b) => a.data.localeCompare(b.data))
                        .at(-1)
                      const ehProximo = t === proximo
                      return (
                        <li
                          key={t}
                          className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
                            ehProximo ? 'bg-blue-50/80 border-blue-100' : 'bg-white/[0.6] border-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-slate-950 truncate">{t}</p>
                            <p className="text-[11px] text-slate-400 font-light">
                              {n > 0 ? `atendeu no mês (${n})` : 'aguardando'}
                              {ultimo ? ` · último: ${formatarData(ultimo.data)}` : ''}
                            </p>
                          </div>
                          <button
                            className="shrink-0 text-[11px] font-mono text-slate-400 hover:text-blue-600 transition-colors duration-300"
                            disabled={ocupado}
                            onClick={() => designar(c.nome, t, !ehProximo)}
                            title={ehProximo ? 'Designar (é a vez dele)' : 'Designar direto, fora do rodízio'}
                          >
                            designar
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Histórico */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 pb-4">
          <Eyebrow>Histórico</Eyebrow>
          <h3 className="text-xl font-normal tracking-tight text-slate-950">CATs designados</h3>
        </div>
        {desigCats.length === 0 ? (
          <EstadoVazio icone="solar:siren-rounded-linear" mensagem="Nenhum CAT designado ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[36rem]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  {['Data', 'Célula', 'Técnico', 'Modo', ''].map((h, i) => (
                    <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {desigCats.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-white/[0.6] transition-colors duration-300">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(d.data)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{d.celula}</td>
                    <td className="px-4 py-3 text-slate-950 whitespace-nowrap">{d.tecnico}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.direta ? <span className="badge-amber">direto</span> : <span className="badge-blue">rodízio</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-slate-400 hover:text-red-600 transition-colors duration-300"
                        onClick={() => excluir(d.id, d.tecnico)}
                        aria-label="Excluir"
                      >
                        <Icone nome="solar:trash-bin-minimalistic-linear" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
