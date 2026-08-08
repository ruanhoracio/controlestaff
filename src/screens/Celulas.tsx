import { useState } from 'react'
import { useData } from '../state/DataProvider'
import { PORTES } from '../lib/config'
import { proximaCelula } from '../lib/rodizio'
import { formatarData, hojeISO } from '../lib/dates'
import { EstadoVazio, Eyebrow, Icone, TituloTela } from '../components/Ui'

export default function Celulas() {
  const { desigCelulas, adicionarDesigCelula, excluirDesigCelula, equipe } = useData()
  const [empresaPorPorte, setEmpresaPorPorte] = useState<Record<string, string>>({})
  const [fPorte, setFPorte] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function designar(porte: string, pulada: boolean) {
    const empresa = (empresaPorPorte[porte] ?? '').trim()
    if (!pulada && !empresa) return
    const celula = proximaCelula(desigCelulas.filter((d) => d.porte === porte))
    const cfg = equipe.celulas.find((c) => c.nome === celula)
    setOcupado(true)
    setErro(null)
    try {
      await adicionarDesigCelula({
        data: hojeISO(),
        porte,
        empresa: pulada ? null : empresa,
        celula,
        responsavel: cfg?.responsavel ?? '',
        esocial: cfg?.esocial ?? '',
        pulada,
      })
      if (!pulada) setEmpresaPorPorte((m) => ({ ...m, [porte]: '' }))
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function excluir(id: string, empresa: string | null) {
    if (!confirm(`Excluir a designação${empresa ? ` de ${empresa}` : ' (vez pulada)'}? A vez volta pra célula anterior.`)) return
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
        descricao="Cada porte tem seu próprio rodízio. Designou, a vez avança sozinha."
      />

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      {/* Painel por porte */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {PORTES.map((porte) => {
          const celula = proximaCelula(desigCelulas.filter((d) => d.porte === porte))
          const cfg = equipe.celulas.find((c) => c.nome === celula)
          return (
            <div key={porte} className="glass-card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400">{porte}</p>
                <span className="badge-blue">próxima da vez</span>
              </div>

              <div className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-700 shadow-btn px-5 py-4 mb-4">
                <p className="text-xl text-white tracking-tight">{celula}</p>
                <p className="text-xs text-blue-100 font-light mt-0.5">
                  {cfg?.responsavel ?? '—'} · eSocial: {cfg?.esocial || '—'}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Nome da empresa nova…"
                  value={empresaPorPorte[porte] ?? ''}
                  onChange={(e) => setEmpresaPorPorte((m) => ({ ...m, [porte]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') designar(porte, false)
                  }}
                />
                <button
                  className="btn-primary whitespace-nowrap"
                  disabled={ocupado || !(empresaPorPorte[porte] ?? '').trim()}
                  onClick={() => designar(porte, false)}
                >
                  Designar
                </button>
              </div>
              <button
                className="mt-3 text-xs text-slate-400 hover:text-blue-600 transition-colors duration-300 inline-flex items-center gap-1.5"
                disabled={ocupado}
                onClick={() => designar(porte, true)}
              >
                <Icone nome="solar:forward-linear" className="text-sm" />
                Pular a vez de {celula} (alguém afastado)
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
            <h3 className="text-xl font-normal tracking-tight text-slate-950">Designações feitas</h3>
          </div>
          <select className="input max-w-56" value={fPorte} onChange={(e) => setFPorte(e.target.value)}>
            <option value="">Todos os portes</option>
            {PORTES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        {historico.length === 0 ? (
          <EstadoVazio icone="solar:buildings-2-linear" mensagem="Nenhuma designação ainda. A primeira vai pra Célula I." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[48rem]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  {['Data', 'Porte', 'Empresa', 'Célula', 'Responsável', 'eSocial', ''].map((h, i) => (
                    <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-white/[0.6] transition-colors duration-300">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(d.data)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.porte}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.pulada ? <span className="badge-neutral">vez pulada</span> : <span className="text-slate-950">{d.empresa}</span>}
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
