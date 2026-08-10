import { useMemo, useState } from 'react'
import { useData } from '../state/DataProvider'
import { maiusculo, mesmoNome } from '../lib/texto'
import { Icone, Modal } from '../components/Ui'
import type { PppRecord } from '../lib/types'

type Campo = 'empresa' | 'responsavel'

/**
 * Renomeia empresas e responsáveis em massa. Corrigir um nome aqui atualiza
 * todos os registros de PPP que o usam — é o jeito de consertar grafias
 * diferentes que vieram da planilha ("KAROL" e "Karol", por exemplo).
 */
export default function GerenciarNomes({
  campo,
  aberto,
  aoFechar,
}: {
  campo: Campo
  aberto: boolean
  aoFechar: () => void
}) {
  const { ppp, renomearEmMassa } = useData()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const rotulo = campo === 'empresa' ? 'empresa' : 'responsável'

  const lista = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const r of ppp) {
      const v = (r as PppRecord)[campo]
      if (v) contagem.set(v, (contagem.get(v) ?? 0) + 1)
    }
    return [...contagem.entries()]
      .filter(([nome]) => !busca || nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  }, [ppp, campo, busca])

  async function confirmar(antigo: string) {
    const novo = maiusculo(novoNome)
    if (!novo || novo === antigo) {
      setEditando(null)
      return
    }
    const existente = lista.find(([n]) => n !== antigo && mesmoNome(n, novo))
    const aviso = existente
      ? `Já existe "${existente[0]}". Os registros de "${antigo}" serão juntados nele. Confirma?`
      : `Renomear "${antigo}" para "${novo}" em todos os registros?`
    if (!confirm(aviso)) return

    setSalvando(true)
    setErro(null)
    try {
      await renomearEmMassa(campo, antigo, novo)
      setEditando(null)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={`Empresas e responsáveis — ${rotulo}s`} aberto={aberto} aoFechar={aoFechar} largo>
      <p className="text-sm text-slate-500 font-light mb-4">
        Corrigir um nome aqui atualiza todos os registros que o usam. Se o novo nome já existir, os registros são
        juntados.
      </p>

      <div className="relative mb-4">
        <Icone nome="solar:magnifer-linear" className="text-lg absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-11"
          placeholder={`Buscar ${rotulo}…`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {erro && <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {lista.length === 0 ? (
          <p className="text-sm text-slate-400 font-light py-6 text-center">Nada encontrado.</p>
        ) : (
          lista.map(([nome, n]) => (
            <div
              key={nome}
              className="flex items-center gap-2 rounded-2xl bg-white/[0.6] border border-white px-4 py-2.5"
            >
              {editando === nome ? (
                <>
                  <input
                    className="input flex-1 py-1.5 uppercase"
                    value={novoNome}
                    autoFocus
                    onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmar(nome)
                      if (e.key === 'Escape') setEditando(null)
                    }}
                  />
                  <button
                    className="btn-primary px-3 py-1.5 text-xs"
                    disabled={salvando}
                    onClick={() => confirmar(nome)}
                  >
                    {salvando ? '…' : 'Salvar'}
                  </button>
                  <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-950 flex-1 truncate">{nome}</span>
                  <span className="badge-neutral shrink-0">{n}</span>
                  <button
                    className="text-slate-400 hover:text-blue-600 transition-colors duration-300 shrink-0"
                    onClick={() => {
                      setEditando(nome)
                      setNovoNome(nome)
                    }}
                    aria-label={`Renomear ${nome}`}
                  >
                    <Icone nome="solar:pen-linear" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button className="btn-secondary" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
