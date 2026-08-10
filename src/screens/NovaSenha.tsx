import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Campo, Icone } from '../components/Ui'
import logoMaxipas from '../assets/logo-maxipas-branco.png'

/**
 * Define uma nova senha para quem já está autenticado.
 * Serve nos dois casos: link de recuperação recebido por e-mail
 * (modo "recuperacao") e troca voluntária dentro do app.
 */
export default function NovaSenha({
  modo,
  aoConcluir,
}: {
  modo: 'recuperacao' | 'troca'
  aoConcluir: () => void
}) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (senha !== confirmacao) {
      setErro('As duas senhas não são iguais.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const { error } = await supabase!.auth.updateUser({ password: senha })
      if (error) throw error
      setPronto(true)
      // limpa o token de recuperação da URL pra não reabrir esta tela ao recarregar
      if (modo === 'recuperacao') window.history.replaceState(null, '', window.location.pathname)
      setTimeout(aoConcluir, 1400)
    } catch (e: any) {
      setErro(traduzirErro(e.message))
    } finally {
      setEnviando(false)
    }
  }

  const conteudo = (
    <>
      {/* No modo troca o título já vem do cabeçalho da tela; aqui só a instrução */}
      {modo === 'recuperacao' && (
        <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-1">Criar uma nova senha</h1>
      )}
      <p className="text-sm text-slate-500 font-light mb-6">
        {pronto ? 'Senha alterada com sucesso.' : 'Use pelo menos 6 caracteres.'}
      </p>

      {pronto ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5">
          <Icone nome="solar:check-circle-linear" className="text-xl text-emerald-500" />
          <p className="text-sm text-emerald-700">Pronto. Já pode usar a nova senha.</p>
        </div>
      ) : (
        <form onSubmit={salvar} className="space-y-4">
          <Campo rotulo="Nova senha">
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
            />
          </Campo>
          <Campo rotulo="Repita a nova senha">
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Campo>

          {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}

          <div className="flex gap-2 pt-1">
            {modo === 'troca' && (
              <button type="button" className="btn-secondary" onClick={aoConcluir}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={enviando} className="btn-primary flex-1 py-3">
              {enviando ? 'Salvando…' : 'Salvar nova senha'}
              <Icone nome="solar:check-circle-linear" />
            </button>
          </div>
        </form>
      )}
    </>
  )

  // No modo recuperação a tela é a página inteira (o app ainda não montou o menu)
  if (modo === 'recuperacao') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="glass-panel p-8">
            <span className="inline-flex rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-raised px-5 py-3.5 mb-7">
              <img src={logoMaxipas} alt="Maxipas — Saúde Ocupacional" className="h-7 w-auto" />
            </span>
            {conteudo}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <div className="glass-card p-7">{conteudo}</div>
    </div>
  )
}

function traduzirErro(msg: string): string {
  if (/should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/different from the old/i.test(msg)) return 'A nova senha precisa ser diferente da anterior.'
  if (/session|expired|invalid/i.test(msg))
    return 'O link de recuperação expirou. Peça um novo na tela de login.'
  return msg
}
