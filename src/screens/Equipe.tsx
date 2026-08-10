import { useState } from 'react'
import { useData } from '../state/DataProvider'
import { RODIZIOS, RODIZIO_ORDEM } from '../lib/config'
import { filaAlfabetica } from '../lib/rodizio'
import { Campo, Icone, TituloTela } from '../components/Ui'
import type { EquipeConfig } from '../lib/types'

const COM_ESOCIAL = RODIZIOS.filter((r) => r.temEsocial)

export default function Equipe() {
  const { equipe, salvarEquipe } = useData()
  const [rascunho, setRascunho] = useState<EquipeConfig>(() => structuredClone(equipe))
  const [novoTecnico, setNovoTecnico] = useState<Record<number, string>>({})
  const [novoEsocial, setNovoEsocial] = useState('')
  const [novoErgo, setNovoErgo] = useState({ nome: '', celula: RODIZIO_ORDEM[0] as string })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  const alterado = JSON.stringify(rascunho) !== JSON.stringify(equipe)

  function mudar(fn: (r: EquipeConfig) => EquipeConfig) {
    setRascunho(fn)
    setSalvo(false)
  }

  function adicionarTecnico(idx: number) {
    const nome = (novoTecnico[idx] ?? '').trim()
    if (!nome) return
    if (rascunho.celulas[idx].tecnicos.some((t) => t.localeCompare(nome, 'pt-BR', { sensitivity: 'base' }) === 0)) return
    mudar((r) => ({
      ...r,
      celulas: r.celulas.map((c, i) => (i === idx ? { ...c, tecnicos: [...c.tecnicos, nome] } : c)),
    }))
    setNovoTecnico((m) => ({ ...m, [idx]: '' }))
  }

  function adicionarEsocial() {
    const nome = novoEsocial.trim()
    if (!nome || rascunho.esocial.fila.includes(nome)) return
    mudar((r) => ({ ...r, esocial: { ...r.esocial, fila: [...r.esocial.fila, nome] } }))
    setNovoEsocial('')
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
          descricao="Responsáveis, técnicos e as filas de eSocial e ergonomistas. Os rodízios usam o que estiver aqui."
        />
        <button className="btn-primary" onClick={salvar} disabled={salvando || !alterado}>
          <Icone nome="solar:diskette-linear" />
          {salvando ? 'Salvando…' : salvo && !alterado ? 'Salvo' : 'Salvar alterações'}
        </button>
      </div>

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      {/* Células e técnicos */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {rascunho.celulas.map((c, idx) => (
          <div key={c.nome} className="glass-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-4">{c.nome}</p>
            <div className="space-y-4">
              <Campo rotulo="Responsável / gestor da célula">
                <input
                  className="input"
                  value={c.responsavel}
                  onChange={(e) =>
                    mudar((r) => ({
                      ...r,
                      celulas: r.celulas.map((x, i) => (i === idx ? { ...x, responsavel: e.target.value } : x)),
                    }))
                  }
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
                      <li
                        key={t}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.6] border border-white px-4 py-2.5"
                      >
                        <span className="text-sm text-slate-950 truncate">
                          <span className="font-mono text-[10px] text-slate-400 mr-2">
                            {String(ordem + 1).padStart(2, '0')}
                          </span>
                          {t}
                        </span>
                        <button
                          className="text-slate-400 hover:text-red-600 transition-colors duration-300 shrink-0"
                          onClick={() =>
                            mudar((r) => ({
                              ...r,
                              celulas: r.celulas.map((x, i) =>
                                i === idx ? { ...x, tecnicos: x.tecnicos.filter((n) => n !== t) } : x,
                              ),
                            }))
                          }
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

      {/* eSocial: quem faz cada célula, em cada rodízio */}
      <div className="glass-card p-6 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-1">eSocial</p>
        <p className="text-sm text-slate-500 font-light mb-5">
          Quem faz o eSocial de cada célula. É fixo por célula, mas cada rodízio tem seu próprio deslocamento — na
          Pequena Empresa a fila está uma posição adiante das demais.
        </p>

        {/* Pessoas disponíveis */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="field-label !mb-0 mr-1">Pessoas</span>
          {rascunho.esocial.fila.map((nome) => (
            <span key={nome} className="badge-blue gap-1.5">
              {nome}
              <button
                className="text-blue-400 hover:text-red-600 transition-colors duration-300"
                onClick={() =>
                  mudar((r) => ({ ...r, esocial: { ...r.esocial, fila: r.esocial.fila.filter((n) => n !== nome) } }))
                }
                aria-label={`Remover ${nome}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="input max-w-40 py-1.5"
            placeholder="Nome…"
            value={novoEsocial}
            onChange={(e) => setNovoEsocial(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                adicionarEsocial()
              }
            }}
          />
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={adicionarEsocial}>
            <Icone nome="solar:add-circle-linear" className="text-base" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[36rem]">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="th-label px-3 py-2">Rodízio</th>
                {RODIZIO_ORDEM.map((c) => (
                  <th key={c} className="th-label px-3 py-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COM_ESOCIAL.map((rod) => (
                <tr key={rod.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{rod.id}</td>
                  {RODIZIO_ORDEM.map((cel) => (
                    <td key={cel} className="px-3 py-2">
                      <select
                        className="input py-1.5 text-xs"
                        value={rascunho.esocial.porRodizio?.[rod.id]?.[cel] ?? ''}
                        onChange={(e) =>
                          mudar((r) => ({
                            ...r,
                            esocial: {
                              ...r.esocial,
                              porRodizio: {
                                ...r.esocial.porRodizio,
                                [rod.id]: { ...(r.esocial.porRodizio?.[rod.id] ?? {}), [cel]: e.target.value },
                              },
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        {rascunho.esocial.fila.map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ergonomistas */}
      <div className="glass-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-1">Ergonomistas</p>
        <p className="text-sm text-slate-500 font-light mb-4">
          Esse rodízio gira entre pessoas, não entre células. A ordem aqui é a ordem da vez.
        </p>
        <div className="flex gap-2 mb-3 max-w-lg">
          <input
            className="input flex-1"
            placeholder="Nome…"
            value={novoErgo.nome}
            onChange={(e) => setNovoErgo((v) => ({ ...v, nome: e.target.value }))}
          />
          <select
            className="input max-w-36"
            value={novoErgo.celula}
            onChange={(e) => setNovoErgo((v) => ({ ...v, celula: e.target.value }))}
          >
            {RODIZIO_ORDEM.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            className="btn-secondary px-4"
            onClick={() => {
              const nome = novoErgo.nome.trim()
              if (nome && !rascunho.ergonomistas.some((e) => e.nome === nome)) {
                mudar((r) => ({ ...r, ergonomistas: [...r.ergonomistas, { nome, celula: novoErgo.celula }] }))
                setNovoErgo((v) => ({ ...v, nome: '' }))
              }
            }}
            aria-label="Adicionar ergonomista"
          >
            <Icone nome="solar:add-circle-linear" />
          </button>
        </div>
        {rascunho.ergonomistas.length === 0 ? (
          <p className="text-xs text-slate-400 font-light">Fila vazia.</p>
        ) : (
          <ul className="space-y-2 max-w-lg">
            {rascunho.ergonomistas.map((e, i) => (
              <li
                key={e.nome}
                className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.6] border border-white px-4 py-2.5"
              >
                <span className="text-sm text-slate-950 truncate">
                  <span className="font-mono text-[10px] text-slate-400 mr-2">{String(i + 1).padStart(2, '0')}</span>
                  {e.nome}
                  <span className="text-xs text-slate-400 font-light ml-2">{e.celula}</span>
                </span>
                <button
                  className="text-slate-400 hover:text-red-600 transition-colors duration-300 shrink-0"
                  onClick={() => mudar((r) => ({ ...r, ergonomistas: r.ergonomistas.filter((x) => x.nome !== e.nome) }))}
                  aria-label={`Remover ${e.nome}`}
                >
                  <Icone nome="solar:trash-bin-minimalistic-linear" className="text-base" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
