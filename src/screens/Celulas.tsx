import { useState } from 'react'
import { useData } from '../state/DataProvider'
import { PORTES_ESOCIAL, RODIZIOS, type RodizioId } from '../lib/config'
import { esocialDaVez, proximaCelula, responsavelDaVez } from '../lib/rodizio'
import { formatarData, hojeISO } from '../lib/dates'
import { maiusculo } from '../lib/texto'
import { EstadoVazio, Eyebrow, Icone, TituloTela } from '../components/Ui'

export default function Celulas() {
  const { desigCelulas, adicionarDesigCelula, excluirDesigCelula, equipe } = useData()
  const [empresaPorRodizio, setEmpresaPorRodizio] = useState<Record<string, string>>({})
  const [portePorRodizio, setPortePorRodizio] = useState<Record<string, string>>({})
  const [fPorte, setFPorte] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function designar(rodizioId: RodizioId, pulada: boolean) {
    const empresa = maiusculo(empresaPorRodizio[rodizioId] ?? '')
    if (!pulada && !empresa) return
    const posicao = proximaCelula(desigCelulas.filter((d) => d.porte === rodizioId), rodizioId, equipe)
    if (!posicao) {
      setErro('Sem fila configurada para este rodízio. Cadastre em Equipe.')
      return
    }
    // O rodízio de eSocial avulso registra o porte da empresa junto do nome
    const porte = portePorRodizio[rodizioId]
    const nomeFinal = porte && !pulada ? `${empresa} (${porte})` : empresa
    setOcupado(true)
    setErro(null)
    try {
      await adicionarDesigCelula({
        data: hojeISO(),
        porte: rodizioId,
        empresa: pulada ? null : nomeFinal,
        celula: posicao,
        responsavel: responsavelDaVez(posicao, rodizioId, equipe),
        esocial: esocialDaVez(rodizioId, posicao, equipe),
        pulada,
      })
      if (!pulada) setEmpresaPorRodizio((m) => ({ ...m, [rodizioId]: '' }))
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function excluir(id: string, empresa: string | null) {
    if (!confirm(`Excluir a designação${empresa ? ` de ${empresa}` : ' (vez pulada)'}? A vez volta pra posição anterior.`))
      return
    setErro(null)
    try {
      await excluirDesigCelula(id)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const historico = desigCelulas.filter((d) => !fPorte || d.porte === fPorte)

  return (
    <div>
      <TituloTela
        eyebrow="Módulo 2"
        titulo="Designar Célula"
        descricao="Cada rodízio anda por conta. Designou, a vez avança sozinha."
      />

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      {/* Um painel por rodízio */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {RODIZIOS.map((rod) => {
          const posicao = proximaCelula(desigCelulas.filter((d) => d.porte === rod.id), rod.id, equipe)
          const responsavel = posicao ? responsavelDaVez(posicao, rod.id, equipe) : ''
          const esocial = esocialDaVez(rod.id, posicao, equipe)
          const feitas = desigCelulas.filter((d) => d.porte === rod.id).length
          const soEsocial = rod.tipo === 'esocial'
          return (
            <div key={rod.id} className={`glass-card p-6 ${soEsocial ? 'md:col-span-2 ring-1 ring-blue-100' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400">{rod.id}</p>
                  {rod.tipo === 'ergonomista' && (
                    <p className="text-[11px] text-slate-400 font-light mt-0.5">gira entre pessoas</p>
                  )}
                  {soEsocial && (
                    <p className="text-[11px] text-slate-400 font-light mt-0.5">
                      empresa que é só eSocial, sem célula
                    </p>
                  )}
                </div>
                <span className="badge-neutral shrink-0">{feitas} feitas</span>
              </div>

              {posicao ? (
                <div className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-700 shadow-btn px-5 py-4 mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-blue-100 mb-1">próxima da vez</p>
                  <p className="text-xl text-white tracking-tight">{posicao}</p>
                  <p className="text-xs text-blue-100 font-light mt-0.5">
                    {/* Em ergonomistas e eSocial a posição já É a pessoa; não repetir */}
                    {[responsavel !== posicao ? responsavel : '', esocial ? `eSocial: ${esocial}` : '']
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-100 border border-slate-200 px-5 py-4 mb-4">
                  <p className="text-sm text-slate-500 font-light">Sem fila configurada. Cadastre em Equipe.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  className="input flex-1 min-w-48 uppercase"
                  placeholder="Nome da empresa nova…"
                  value={empresaPorRodizio[rod.id] ?? ''}
                  onChange={(e) => setEmpresaPorRodizio((m) => ({ ...m, [rod.id]: e.target.value.toUpperCase() }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') designar(rod.id, false)
                  }}
                />
                {soEsocial && (
                  <select
                    className="input max-w-28"
                    value={portePorRodizio[rod.id] ?? ''}
                    onChange={(e) => setPortePorRodizio((m) => ({ ...m, [rod.id]: e.target.value }))}
                  >
                    <option value="">Porte</option>
                    {PORTES_ESOCIAL.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                )}
                <button
                  className="btn-primary whitespace-nowrap"
                  disabled={ocupado || !posicao || !maiusculo(empresaPorRodizio[rod.id] ?? '')}
                  onClick={() => designar(rod.id, false)}
                >
                  Designar
                </button>
              </div>
              <button
                className="mt-3 text-xs text-slate-400 hover:text-blue-600 transition-colors duration-300 inline-flex items-center gap-1.5 disabled:opacity-50"
                disabled={ocupado || !posicao}
                onClick={() => designar(rod.id, true)}
              >
                <Icone nome="solar:forward-linear" className="text-sm" />
                Pular a vez{posicao ? ` de ${posicao}` : ''} (alguém afastado)
              </button>
            </div>
          )
        })}
      </div>

      {/* Histórico */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
          <div>
            <Eyebrow>Histórico</Eyebrow>
            <h3 className="text-xl font-normal tracking-tight text-slate-950">
              Designações feitas
              <span className="ml-2 text-sm text-slate-400 font-light">{historico.length}</span>
            </h3>
          </div>
          <select className="input max-w-72" value={fPorte} onChange={(e) => setFPorte(e.target.value)}>
            <option value="">Todos os rodízios</option>
            {RODIZIOS.map((r) => (
              <option key={r.id}>{r.id}</option>
            ))}
          </select>
        </div>
        {historico.length === 0 ? (
          <EstadoVazio icone="solar:buildings-2-linear" mensagem="Nenhuma designação ainda." />
        ) : (
          <div className="overflow-x-auto max-h-[32rem]">
            <table className="w-full text-sm min-w-[48rem]">
              <thead className="sticky top-0 bg-white/90 backdrop-blur">
                <tr className="text-left border-b border-slate-100">
                  {['Data', 'Rodízio', 'Empresa', 'Célula', 'Responsável', 'eSocial', ''].map((h, i) => (
                    <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-white/[0.6] transition-colors duration-300"
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(d.data)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.porte}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.pulada ? (
                        <span className="badge-neutral">vez pulada</span>
                      ) : d.empresa ? (
                        <span className="text-slate-950">{d.empresa}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{d.celula}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.responsavel || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.esocial || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-slate-400 hover:text-red-600 transition-colors duration-300"
                        onClick={() => excluir(d.id, d.empresa)}
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
