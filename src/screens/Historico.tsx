import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EstadoVazio, Icone, TituloTela } from '../components/Ui'
import type { LogAtividade } from '../lib/types'

const MODULOS: Record<string, string> = {
  ppp_records: 'Controle de PPP',
  designacoes_celula: 'Designar Célula',
  designacoes_cat: 'Designar CAT',
  app_config: 'Equipe',
}

const ACOES: Record<string, { rotulo: string; classe: string }> = {
  INSERT: { rotulo: 'criou', classe: 'badge-emerald' },
  UPDATE: { rotulo: 'alterou', classe: 'badge-blue' },
  DELETE: { rotulo: 'excluiu', classe: 'badge-red' },
}

/** Campos que não interessam no "o que mudou". */
const IGNORAR = new Set(['id', 'user_id', 'created_at'])

function quandoTexto(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function valorTexto(v: any): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return 'configuração'
  return String(v)
}

/** Lista só os campos que realmente mudaram entre antes e depois. */
function diferencas(r: LogAtividade): { campo: string; de: any; para: any }[] {
  const antes = r.antes ?? {}
  const depois = r.depois ?? {}
  const campos = new Set([...Object.keys(antes), ...Object.keys(depois)].filter((c) => !IGNORAR.has(c)))
  const saida: { campo: string; de: any; para: any }[] = []
  for (const campo of campos) {
    const de = antes[campo]
    const para = depois[campo]
    if (JSON.stringify(de ?? null) !== JSON.stringify(para ?? null)) saida.push({ campo, de, para })
  }
  return saida
}

export default function Historico() {
  const [registros, setRegistros] = useState<LogAtividade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [fQuem, setFQuem] = useState('')
  const [fModulo, setFModulo] = useState('')
  const [fAcao, setFAcao] = useState('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<number | null>(null)
  const [limite, setLimite] = useState(400)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      setCarregando(true)
      const { data, error } = await supabase!
        .from('log_atividade')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite)
      if (!vivo) return
      if (error) setErro(error.message)
      else {
        setRegistros(data as LogAtividade[])
        setErro(null)
      }
      setCarregando(false)
    })()
    return () => {
      vivo = false
    }
  }, [limite])

  const pessoas = useMemo(() => [...new Set(registros.map((r) => r.quem))].sort(), [registros])

  const filtrados = registros.filter((r) => {
    if (fQuem && r.quem !== fQuem) return false
    if (fModulo && r.tabela !== fModulo) return false
    if (fAcao && r.acao !== fAcao) return false
    if (busca && !r.resumo.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <TituloTela
        eyebrow="Gestão"
        titulo="Histórico"
        descricao="Tudo que cada pessoa lançou, alterou ou excluiu. Gravado pelo banco — ninguém edita esta lista."
      />

      {erro && (
        <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          {/relation|does not exist/i.test(erro)
            ? 'A tabela de histórico ainda não existe. Rode a migração 04 no Supabase.'
            : erro}
        </p>
      )}

      <div className="glass-card p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Icone
            nome="solar:magnifer-linear"
            className="text-lg absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input pl-11"
            placeholder="Buscar por funcionário, empresa…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="input" value={fQuem} onChange={(e) => setFQuem(e.target.value)}>
          <option value="">Todas as pessoas</option>
          {pessoas.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="input" value={fModulo} onChange={(e) => setFModulo(e.target.value)}>
          <option value="">Todos os módulos</option>
          {Object.entries(MODULOS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <select className="input" value={fAcao} onChange={(e) => setFAcao(e.target.value)}>
          <option value="">Tudo</option>
          {Object.entries(ACOES).map(([valor, a]) => (
            <option key={valor} value={valor}>
              Só o que se {a.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {carregando ? (
          <p className="px-6 py-10 text-center font-mono text-xs text-slate-400 animate-pulse">carregando…</p>
        ) : filtrados.length === 0 ? (
          <EstadoVazio
            icone="solar:history-linear"
            mensagem={registros.length === 0 ? 'Nada registrado ainda.' : 'Nada encontrado com esses filtros.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto max-h-[36rem]">
              <table className="w-full text-sm min-w-[52rem]">
                <thead className="sticky top-0 bg-white/90 backdrop-blur">
                  <tr className="text-left border-b border-slate-100">
                    {['Quando', 'Quem', 'O quê', 'Módulo', 'Registro', ''].map((h, i) => (
                      <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((r) => {
                    const acao = ACOES[r.acao] ?? { rotulo: r.acao, classe: 'badge-neutral' }
                    const mudancas = r.acao === 'UPDATE' ? diferencas(r) : []
                    const expandido = aberto === r.id
                    return (
                      <Fragment key={r.id}>
                        <tr className="border-b border-slate-100 last:border-0 hover:bg-white/[0.6] transition-colors duration-300">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                            {quandoTexto(r.created_at)}
                          </td>
                          <td className="px-4 py-3 text-slate-950 whitespace-nowrap">{r.quem}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={acao.classe}>{acao.rotulo}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{MODULOS[r.tabela] ?? r.tabela}</td>
                          <td className="px-4 py-3 text-slate-600">{r.resumo || '—'}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {r.acao === 'UPDATE' && mudancas.length > 0 && (
                              <button
                                className="text-xs text-slate-400 hover:text-blue-600 transition-colors duration-300 inline-flex items-center gap-1"
                                onClick={() => setAberto(expandido ? null : r.id)}
                              >
                                {mudancas.length} campo{mudancas.length > 1 ? 's' : ''}
                                <Icone
                                  nome={expandido ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                                  className="text-sm"
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandido && (
                          <tr className="border-b border-slate-100">
                            <td colSpan={6} className="px-4 py-3 bg-white/[0.5]">
                              <ul className="space-y-1.5">
                                {mudancas.map((m) => (
                                  <li key={m.campo} className="text-xs text-slate-500 font-light">
                                    <span className="font-mono text-[10px] uppercase text-slate-400 mr-2">
                                      {m.campo}
                                    </span>
                                    <span className="line-through text-slate-400">{valorTexto(m.de)}</span>
                                    <Icone nome="solar:arrow-right-linear" className="text-xs mx-1.5 align-middle" />
                                    <span className="text-slate-950">{valorTexto(m.para)}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100">
              <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400">
                mostrando {filtrados.length} de {registros.length}
              </p>
              {registros.length >= limite && (
                <button className="btn-secondary text-xs px-4 py-2" onClick={() => setLimite((l) => l + 400)}>
                  Carregar mais antigos
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
