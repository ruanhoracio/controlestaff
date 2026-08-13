import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useData } from '../state/DataProvider'
import { EstadoVazio, Icone, TituloTela } from '../components/Ui'
import type { Papel, Perfil } from '../lib/types'

const PAPEIS: { valor: Papel; rotulo: string; ajuda: string }[] = [
  { valor: 'gestor', rotulo: 'Gestora(o)', ajuda: 'Vê e mexe em tudo, inclusive no histórico' },
  { valor: 'tecnico', rotulo: 'Técnica(o)', ajuda: 'Só o Controle de PPP' },
  { valor: 'bloqueado', rotulo: 'Bloqueado', ajuda: 'Entra no login mas não vê nada' },
]

const CLASSE_PAPEL: Record<Papel, string> = {
  gestor: 'badge-blue',
  tecnico: 'badge-neutral',
  bloqueado: 'badge-red',
}

function quandoTexto(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Acessos() {
  const { perfil } = useData()
  const [pessoas, setPessoas] = useState<Perfil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const { data, error } = await supabase!.from('perfis').select('*').order('created_at')
      if (!vivo) return
      if (error) setErro(error.message)
      else setPessoas(data as Perfil[])
      setCarregando(false)
    })()
    return () => {
      vivo = false
    }
  }, [])

  async function mudarPapel(alvo: Perfil, papel: Papel) {
    setErro(null)
    const anterior = alvo.papel
    setPessoas((lista) => lista.map((p) => (p.user_id === alvo.user_id ? { ...p, papel } : p)))
    const { error } = await supabase!.from('perfis').update({ papel }).eq('user_id', alvo.user_id)
    if (error) {
      setErro(error.message)
      setPessoas((lista) => lista.map((p) => (p.user_id === alvo.user_id ? { ...p, papel: anterior } : p)))
    }
  }

  return (
    <div>
      <TituloTela
        eyebrow="Gestão"
        titulo="Acessos"
        descricao="Quem tem login e o que cada um enxerga. Quem se cadastra escolhe o papel; aqui você confirma ou muda."
      />

      {erro && (
        <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          {/relation|does not exist/i.test(erro)
            ? 'A tabela de perfis ainda não existe. Rode a migração 04 no Supabase.'
            : erro}
        </p>
      )}

      <div className="glass-card overflow-hidden mb-4">
        {carregando ? (
          <p className="px-6 py-10 text-center font-mono text-xs text-slate-400 animate-pulse">carregando…</p>
        ) : pessoas.length === 0 ? (
          <EstadoVazio icone="solar:users-group-rounded-linear" mensagem="Nenhuma conta cadastrada ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[44rem]">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  {['Pessoa', 'E-mail', 'Desde', 'Papel', ''].map((h, i) => (
                    <th key={i} className="th-label px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => {
                  const souEu = p.user_id === perfil?.user_id
                  return (
                    <tr
                      key={p.user_id}
                      className="border-b border-slate-100 last:border-0 hover:bg-white/[0.6] transition-colors duration-300"
                    >
                      <td className="px-4 py-3 text-slate-950 whitespace-nowrap">
                        {p.nome || '—'}
                        {souEu && <span className="badge-neutral ml-2">você</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.email}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                        {quandoTexto(p.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={CLASSE_PAPEL[p.papel] ?? 'badge-neutral'}>
                          {PAPEIS.find((x) => x.valor === p.papel)?.rotulo ?? p.papel}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {/* Ninguém tira o próprio acesso sem querer */}
                        <select
                          className="input py-1.5 text-xs max-w-40 ml-auto disabled:opacity-40"
                          value={p.papel}
                          disabled={souEu}
                          onChange={(e) => mudarPapel(p, e.target.value as Papel)}
                          aria-label={`Papel de ${p.nome || p.email}`}
                        >
                          {PAPEIS.map((x) => (
                            <option key={x.valor} value={x.valor}>
                              {x.rotulo}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-slate-400 mb-4">O que cada papel vê</p>
        <ul className="space-y-3">
          {PAPEIS.map((x) => (
            <li key={x.valor} className="flex items-start gap-3">
              <span className={`${CLASSE_PAPEL[x.valor]} shrink-0 mt-0.5`}>{x.rotulo}</span>
              <span className="text-sm text-slate-500 font-light">{x.ajuda}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-slate-400 font-light flex items-start gap-2">
          <Icone nome="solar:info-circle-linear" className="text-sm shrink-0 mt-0.5" />
          <span>
            O cadastro é aberto: quem tiver o link do app cria conta e escolhe o próprio papel. Confira esta lista de
            vez em quando e deixe como <strong className="font-normal text-slate-500">Bloqueado</strong> quem não devia
            estar aqui.
          </span>
        </p>
      </div>
    </div>
  )
}
