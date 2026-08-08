import { useMemo, useState, type FormEvent } from 'react'
import { useData, type NovoPpp } from '../state/DataProvider'
import { PRAZO_PPP_DIAS_UTEIS } from '../lib/config'
import { formatarData, hojeISO, rotuloMes, somarDiasUteis } from '../lib/dates'
import { BadgeConclusao, CaixaIcone, Campo, EstadoVazio, Icone, Modal, ROTULO_CONCLUSAO, TituloTela } from '../components/Ui'
import type { Conclusao, PppRecord } from '../lib/types'

type FiltroConclusao = '' | Conclusao | 'ATRASADO'

const CONCLUSOES: Conclusao[] = ['ENTREGUE', 'PENDENTE', 'ELETRONICO']

function estaAtrasado(r: PppRecord): boolean {
  return r.conclusao !== 'ENTREGUE' && r.prazo_entrega < hojeISO()
}

export default function Ppp() {
  const { ppp, salvarPpp, excluirPpp, equipe } = useData()

  const [busca, setBusca] = useState('')
  const [fEmpresa, setFEmpresa] = useState('')
  const [fResponsavel, setFResponsavel] = useState('')
  const [fMes, setFMes] = useState('')
  const [fConclusao, setFConclusao] = useState<FiltroConclusao>('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<PppRecord | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const empresas = useMemo(() => distintos(ppp.map((r) => r.empresa)), [ppp])
  const responsaveis = useMemo(
    () => distintos([...ppp.map((r) => r.responsavel), ...equipe.celulas.map((c) => c.responsavel)]),
    [ppp, equipe],
  )
  const meses = useMemo(() => [...new Set(ppp.map((r) => r.mes))].sort((a, b) => b.localeCompare(a)), [ppp])
  const tipos = useMemo(() => distintos(ppp.map((r) => r.tipo)), [ppp])
  const celulas = equipe.celulas.map((c) => c.nome)

  const filtrados = useMemo(() => {
    return ppp.filter((r) => {
      if (busca && !r.funcionario.toLowerCase().includes(busca.toLowerCase())) return false
      if (fEmpresa && r.empresa !== fEmpresa) return false
      if (fResponsavel && r.responsavel !== fResponsavel) return false
      if (fMes && r.mes !== fMes) return false
      if (fConclusao === 'ATRASADO') return estaAtrasado(r)
      if (fConclusao && r.conclusao !== fConclusao) return false
      return true
    })
  }, [ppp, busca, fEmpresa, fResponsavel, fMes, fConclusao])

  const cards: { chave: FiltroConclusao; rotulo: string; icone: string; cor: 'emerald' | 'amber' | 'blue' | 'red'; total: number }[] = [
    { chave: 'ENTREGUE', rotulo: 'Entregues', icone: 'solar:check-circle-linear', cor: 'emerald', total: ppp.filter((r) => r.conclusao === 'ENTREGUE').length },
    { chave: 'PENDENTE', rotulo: 'Pendentes', icone: 'solar:hourglass-line-linear', cor: 'amber', total: ppp.filter((r) => r.conclusao === 'PENDENTE').length },
    { chave: 'ELETRONICO', rotulo: 'Eletrônicos', icone: 'solar:cpu-bolt-linear', cor: 'blue', total: ppp.filter((r) => r.conclusao === 'ELETRONICO').length },
    { chave: 'ATRASADO', rotulo: 'Atrasados', icone: 'solar:danger-triangle-linear', cor: 'red', total: ppp.filter(estaAtrasado).length },
  ]

  async function mudarConclusao(r: PppRecord, nova: Conclusao) {
    setErro(null)
    try {
      const { id, created_at, ...resto } = r
      await salvarPpp(
        { ...resto, conclusao: nova, data_entrega: nova === 'ENTREGUE' && !r.data_entrega ? hojeISO() : r.data_entrega },
        r.id,
      )
    } catch (e: any) {
      setErro(e.message)
    }
  }

  async function excluir(r: PppRecord) {
    if (!confirm(`Excluir o PPP de ${r.funcionario}?`)) return
    setErro(null)
    try {
      await excluirPpp(r.id)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TituloTela
          eyebrow="Módulo 1"
          titulo="Controle de PPP"
          descricao={`Prazo calculado sozinho: ${PRAZO_PPP_DIAS_UTEIS} dias úteis a partir da solicitação.`}
        />
        <button
          className="btn-primary"
          onClick={() => {
            setEditando(null)
            setModalAberto(true)
          }}
        >
          <Icone nome="solar:add-circle-linear" />
          Novo PPP
        </button>
      </div>

      {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      {/* Cards de conclusão (clicáveis pra filtrar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <button
            key={c.chave}
            onClick={() => setFConclusao(fConclusao === c.chave ? '' : c.chave)}
            className={`glass-card p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.84] ${
              fConclusao === c.chave ? 'ring-2 ring-blue-200 bg-white/[0.84]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <CaixaIcone nome={c.icone} cor={c.cor} />
              <span className="text-3xl font-light tracking-tight text-slate-950">{c.total}</span>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400">{c.rotulo}</p>
          </button>
        ))}
      </div>

      {/* Busca e filtros */}
      <div className="glass-card p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Icone nome="solar:magnifer-linear" className="text-lg absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Buscar funcionário…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="input" value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)}>
          <option value="">Todas as empresas</option>
          {empresas.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className="input" value={fResponsavel} onChange={(e) => setFResponsavel(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className="input" value={fMes} onChange={(e) => setFMes(e.target.value)}>
          <option value="">Todos os meses</option>
          {meses.map((x) => (
            <option key={x} value={x}>
              {rotuloMes(x)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="glass-card overflow-hidden">
        {filtrados.length === 0 ? (
          <EstadoVazio
            icone="solar:document-text-linear"
            mensagem={ppp.length === 0 ? 'Nenhum PPP cadastrado ainda. Clique em “Novo PPP” pra começar.' : 'Nada encontrado com esses filtros.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[64rem]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  {['Funcionário', 'Empresa', 'Célula', 'Tipo', 'Solicitado', 'Prazo', 'Entrega', 'Responsável', 'Mês', 'Conclusão', ''].map(
                    (h, i) => (
                      <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => {
                  const atrasado = estaAtrasado(r)
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors duration-300 hover:bg-white/[0.6] ${
                        atrasado ? 'bg-red-50/60' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-950 whitespace-nowrap">
                        {r.funcionario}
                        {atrasado && <span className="badge-red ml-2">atrasado</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.empresa}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.celula || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.tipo || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(r.data_solicitada)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap ${atrasado ? 'text-red-600' : 'text-slate-500'}`}>
                        {formatarData(r.prazo_entrega)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(r.data_entrega)}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.responsavel || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{rotuloMes(r.mes)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {/* Atalho pra mudar a conclusão direto na linha */}
                        <select
                          className="badge-neutral cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%225%22%3E%3Cpath%20d%3D%22M0%200l4%205%204-5z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.6rem_center]"
                          value={r.conclusao}
                          onChange={(e) => mudarConclusao(r, e.target.value as Conclusao)}
                        >
                          {CONCLUSOES.map((c) => (
                            <option key={c} value={c}>
                              {ROTULO_CONCLUSAO[c]}
                            </option>
                          ))}
                        </select>
                        <span className="ml-2 align-middle">
                          <BadgeConclusao valor={r.conclusao} />
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          className="text-slate-400 hover:text-blue-600 transition-colors duration-300 mr-2"
                          onClick={() => {
                            setEditando(r)
                            setModalAberto(true)
                          }}
                          aria-label="Editar"
                        >
                          <Icone nome="solar:pen-linear" />
                        </button>
                        <button
                          className="text-slate-400 hover:text-red-600 transition-colors duration-300"
                          onClick={() => excluir(r)}
                          aria-label="Excluir"
                        >
                          <Icone nome="solar:trash-bin-minimalistic-linear" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormPpp
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        registro={editando}
        sugestoes={{ empresas, responsaveis, tipos, celulas }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------

function FormPpp({
  aberto,
  aoFechar,
  registro,
  sugestoes,
}: {
  aberto: boolean
  aoFechar: () => void
  registro: PppRecord | null
  sugestoes: { empresas: string[]; responsaveis: string[]; tipos: string[]; celulas: string[] }
}) {
  const { salvarPpp } = useData()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const vazio: NovoPpp = {
    empresa: '',
    funcionario: '',
    celula: '',
    tipo: '',
    admissao: null,
    demissao: null,
    data_solicitada: hojeISO(),
    prazo_entrega: somarDiasUteis(hojeISO(), PRAZO_PPP_DIAS_UTEIS),
    data_entrega: null,
    responsavel: '',
    mes: somarDiasUteis(hojeISO(), PRAZO_PPP_DIAS_UTEIS).slice(0, 7),
    conclusao: 'PENDENTE',
  }

  const [form, setForm] = useState<NovoPpp>(vazio)
  const [chaveAberta, setChaveAberta] = useState<string | null>(null)

  // Reinicia o formulário sempre que o modal (re)abre
  const chaveAtual = aberto ? (registro?.id ?? 'novo') : null
  if (chaveAtual !== chaveAberta) {
    setChaveAberta(chaveAtual)
    if (chaveAtual !== null) {
      if (registro) {
        const { id, created_at, ...resto } = registro
        setForm(resto)
      } else {
        setForm(vazio)
      }
      setErro(null)
    }
  }

  function definir<K extends keyof NovoPpp>(campo: K, valor: NovoPpp[K]) {
    setForm((f) => {
      const novo = { ...f, [campo]: valor }
      // prazo e mês sempre derivados da data de solicitação
      if (campo === 'data_solicitada' && typeof valor === 'string' && valor) {
        novo.prazo_entrega = somarDiasUteis(valor, PRAZO_PPP_DIAS_UTEIS)
        novo.mes = novo.prazo_entrega.slice(0, 7)
      }
      return novo
    })
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await salvarPpp(
        { ...form, data_entrega: form.conclusao === 'ENTREGUE' && !form.data_entrega ? hojeISO() : form.data_entrega },
        registro?.id,
      )
      aoFechar()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={registro ? 'Editar PPP' : 'Novo PPP'} aberto={aberto} aoFechar={aoFechar} largo>
      <form onSubmit={enviar} className="grid sm:grid-cols-2 gap-4">
        <Campo rotulo="Funcionário *">
          <input className="input" required value={form.funcionario} onChange={(e) => definir('funcionario', e.target.value)} />
        </Campo>
        <Campo rotulo="Empresa *">
          <input className="input" required list="sug-empresas" value={form.empresa} onChange={(e) => definir('empresa', e.target.value)} />
          <datalist id="sug-empresas">
            {sugestoes.empresas.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Célula">
          <select className="input" value={form.celula} onChange={(e) => definir('celula', e.target.value)}>
            <option value="">—</option>
            {sugestoes.celulas.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Tipo">
          <input className="input" list="sug-tipos" value={form.tipo} onChange={(e) => definir('tipo', e.target.value)} />
          <datalist id="sug-tipos">
            {sugestoes.tipos.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Admissão">
          <input type="date" className="input" value={form.admissao ?? ''} onChange={(e) => definir('admissao', e.target.value || null)} />
        </Campo>
        <Campo rotulo="Demissão">
          <input type="date" className="input" value={form.demissao ?? ''} onChange={(e) => definir('demissao', e.target.value || null)} />
        </Campo>
        <Campo rotulo="Data solicitada *">
          <input
            type="date"
            className="input"
            required
            value={form.data_solicitada}
            onChange={(e) => definir('data_solicitada', e.target.value)}
          />
        </Campo>
        <Campo rotulo={`Prazo (${PRAZO_PPP_DIAS_UTEIS} dias úteis, automático)`}>
          <input className="input bg-slate-50 text-slate-500" readOnly value={`${formatarData(form.prazo_entrega)} · ${rotuloMes(form.mes)}`} />
        </Campo>
        <Campo rotulo="Responsável">
          <input
            className="input"
            list="sug-responsaveis"
            value={form.responsavel}
            onChange={(e) => definir('responsavel', e.target.value)}
          />
          <datalist id="sug-responsaveis">
            {sugestoes.responsaveis.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Conclusão">
          <select className="input" value={form.conclusao} onChange={(e) => definir('conclusao', e.target.value as Conclusao)}>
            {CONCLUSOES.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CONCLUSAO[c]}
              </option>
            ))}
          </select>
        </Campo>
        {form.conclusao === 'ENTREGUE' && (
          <Campo rotulo="Data da entrega">
            <input
              type="date"
              className="input"
              value={form.data_entrega ?? ''}
              onChange={(e) => definir('data_entrega', e.target.value || null)}
            />
          </Campo>
        )}

        {erro && <p className="sm:col-span-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando…' : registro ? 'Salvar alterações' : 'Cadastrar PPP'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function distintos(valores: string[]): string[] {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
