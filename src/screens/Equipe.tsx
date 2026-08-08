import { useState } from 'react'
import { useData } from '../state/DataProvider'
import { filaAlfabetica } from '../lib/rodizio'
import { Campo, Icone, TituloTela } from '../components/Ui'
import type { EquipeConfig } from '../lib/types'

export default function Equipe() {
  const { equipe, salvarEquipe } = useData()
  const [rascunho, setRascunho] = useState<EquipeConfig>(() => structuredClone(equipe))
  const [novoTecnico, setNovoTecnico] = useState<Record<number, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  const alterado = JSON.stringify(rascunho) !== JSON.stringify(equipe)

  function definirCelula(idx: number, campo: 'responsavel' | 'esocial' | 'gestor', valor: string) {
    setRascunho((r) => {
      const celulas = r.celulas.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c))
      return { celulas }
    })
    setSalvo(false)
  }

  function adicionarTecnico(idx: number) {
    const nome = (novoTecnico[idx] ?? '').trim()
    if (!nome) return
    if (rascunho.celulas[idx].tecnicos.some((t) => t.localeCompare(nome, 'pt-BR', { sensitivity: 'base' }) === 0)) return
    setRascunho((r) => {
      const celulas = r.celulas.map((c, i) => (i === idx ? { ...c, tecnicos: [...c.tecnicos, nome] } : c))
      return { celulas }
    })
    setNovoTecnico((m) => ({ ...m, [idx]: '' }))
    setSalvo(false)
  }

  function removerTecnico(idx: number, nome: string) {
    setRascunho((r) => {
      const celulas = r.celulas.map((c, i) => (i === idx ? { ...c, tecnicos: c.tecnicos.filter((t) => t !== nome) } : c))
      return { celulas }
    })
    setSalvo(false)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      await salvarEquipe(rascunho)
      setSalvo(true)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TituloTela
          eyebrow="Configuração"
          titulo="Equipe"
          descricao="Responsáveis, eSocial, gestores e técnicos de cada célula. Os rodízios usam o que estiver aqui."
        />
        <button className="btn-primary" onClick={salvar} disabled={salvando || !alterado}>
          <Icone nome="solar:diskette-linear" />
          {salvando ? 'Salvando…' : salvo && !alterado ? 'Salvo' : 'Salvar alterações'}
        </button>
      </div>

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        {rascunho.celulas.map((c, idx) => (
          <div key={c.nome} className="glass-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-4">{c.nome}</p>
            <div className="space-y-4">
              <Campo rotulo="Responsável da célula">
                <input className="input" value={c.responsavel} onChange={(e) => definirCelula(idx, 'responsavel', e.target.value)} />
              </Campo>
              <Campo rotulo="Responsável eSocial">
                <input
                  className="input"
                  placeholder="Quem cuida do eSocial"
                  value={c.esocial}
                  onChange={(e) => definirCelula(idx, 'esocial', e.target.value)}
                />
              </Campo>
              <Campo rotulo="Gestor (CAT)">
                <input
                  className="input"
                  placeholder="Gestor da célula"
                  value={c.gestor}
                  onChange={(e) => definirCelula(idx, 'gestor', e.target.value)}
                />
              </Campo>

              <div>
                <span className="field-label">Técnicos (fila alfabética do CAT)</span>
                <div className="flex gap-2 mb-3">
                  <input
                    className="input flex-1"
                    placeholder="Nome do técnico…"
                    value={novoTecnico[idx] ?? ''}
                    onChange={(e) => setNovoTecnico((m) => ({ ...m, [idx]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarTecnico(idx)
                      }
                    }}
                  />
                  <button className="btn-secondary px-4" onClick={() => adicionarTecnico(idx)} aria-label="Adicionar técnico">
                    <Icone nome="solar:add-circle-linear" />
                  </button>
                </div>
                {c.tecnicos.length === 0 ? (
                  <p className="text-xs text-slate-400 font-light">Nenhum técnico ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {filaAlfabetica(c.tecnicos).map((t, ordem) => (
                      <li key={t} className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.6] border border-white px-4 py-2.5">
                        <span className="text-sm text-slate-950 truncate">
                          <span className="font-mono text-[10px] text-slate-400 mr-2">{String(ordem + 1).padStart(2, '0')}</span>
                          {t}
                        </span>
                        <button
                          className="text-slate-400 hover:text-red-600 transition-colors duration-300 shrink-0"
                          onClick={() => removerTecnico(idx, t)}
                          aria-label={`Remover ${t}`}
                        >
                          <Icone nome="solar:trash-bin-minimalistic-linear" className="text-base" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
