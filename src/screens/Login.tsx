import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Campo, Icone } from '../components/Ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [criandoConta, setCriandoConta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    setAviso(null)
    try {
      if (criandoConta) {
        const { data, error } = await supabase!.auth.signUp({ email, password: senha })
        if (error) throw error
        if (!data.session) {
          setAviso('Conta criada. Confirme o e-mail recebido e entre em seguida.')
          setCriandoConta(false)
        }
      } else {
        const { error } = await supabase!.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      }
    } catch (e: any) {
      setErro(traduzirErro(e.message))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-10 rounded-full bg-gradient-to-b from-white to-slate-100 border border-slate-200 shadow-control flex items-center justify-center">
              <span className="font-mono text-xs font-medium tracking-[-0.08em] text-blue-600">CS</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-mono text-sm font-semibold tracking-[-0.08em] text-slate-950">CONTROLE STAFF</span>
              <span className="mt-1 text-[10px] font-light tracking-[-0.03em] text-slate-400">Segurança do Trabalho</span>
            </span>
          </div>

          <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-1">
            {criandoConta ? 'Criar conta' : 'Bem-vinda de volta'}
          </h1>
          <p className="text-sm text-slate-500 font-light mb-6">
            {criandoConta ? 'Uma conta individual, seus dados só seus.' : 'Entre pra ver seu dia organizado.'}
          </p>

          <form onSubmit={entrar} className="space-y-4">
            <Campo rotulo="E-mail">
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                autoComplete="email"
              />
            </Campo>
            <Campo rotulo="Senha">
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete={criandoConta ? 'new-password' : 'current-password'}
              />
            </Campo>

            {erro && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>
            )}
            {aviso && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                {aviso}
              </p>
            )}

            <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
              {enviando ? 'Aguarde…' : criandoConta ? 'Criar conta' : 'Entrar'}
              <Icone nome="solar:arrow-right-linear" />
            </button>
          </form>

          <button
            onClick={() => {
              setCriandoConta(!criandoConta)
              setErro(null)
            }}
            className="mt-5 w-full text-center text-xs text-slate-500 hover:text-blue-600 transition-colors duration-300"
          >
            {criandoConta ? 'Já tenho conta — entrar' : 'Primeira vez? Criar conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

function traduzirErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
  if (/user already registered/i.test(msg)) return 'Este e-mail já tem conta. Use "Entrar".'
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}
