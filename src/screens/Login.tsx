import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Campo, Icone } from '../components/Ui'
import logoMaxipas from '../assets/logo-maxipas-branco.png'

type Modo = 'entrar' | 'criar' | 'recuperar'

const TITULOS: Record<Modo, { titulo: string; legenda: string; acao: string }> = {
  entrar: { titulo: 'Bem-vinda de volta', legenda: 'Entre pra ver seu dia organizado.', acao: 'Entrar' },
  criar: { titulo: 'Criar conta', legenda: 'Uma conta individual, seus dados só seus.', acao: 'Criar conta' },
  recuperar: {
    titulo: 'Esqueceu a senha?',
    legenda: 'Informe seu e-mail e enviamos um link pra você criar uma nova.',
    acao: 'Enviar link',
  },
}

export default function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  function trocarModo(novo: Modo) {
    setModo(novo)
    setErro(null)
    setAviso(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    setAviso(null)
    try {
      if (modo === 'recuperar') {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setAviso('Link enviado. Confira a caixa de entrada (e o spam) e abra o link pra criar a nova senha.')
      } else if (modo === 'criar') {
        const { data, error } = await supabase!.auth.signUp({ email, password: senha })
        if (error) throw error
        if (!data.session) {
          setAviso('Conta criada. Confirme o e-mail recebido e entre em seguida.')
          setModo('entrar')
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

  const t = TITULOS[modo]

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="glass-panel p-8">
          <div className="flex flex-col gap-2.5 mb-8">
            {/* Placa escura: o logo tem o texto em branco, precisa de fundo escuro pra contrastar */}
            <span className="inline-flex rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-raised px-5 py-3.5 self-start">
              <img src={logoMaxipas} alt="Maxipas — Saúde Ocupacional" className="h-7 w-auto" />
            </span>
            <span className="font-mono text-[10px] font-medium tracking-[-0.02em] text-slate-400 uppercase pl-1">
              Controle Staff · Segurança do Trabalho
            </span>
          </div>

          <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-1">{t.titulo}</h1>
          <p className="text-sm text-slate-500 font-light mb-6">{t.legenda}</p>

          <form onSubmit={enviar} className="space-y-4">
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

            {modo !== 'recuperar' && (
              <Campo rotulo="Senha">
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                />
              </Campo>
            )}

            {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{erro}</p>}
            {aviso && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                {aviso}
              </p>
            )}

            <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
              {enviando ? 'Aguarde…' : t.acao}
              <Icone nome="solar:arrow-right-linear" />
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center text-xs">
            {modo === 'entrar' && (
              <>
                <button
                  onClick={() => trocarModo('recuperar')}
                  className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
                >
                  Esqueci minha senha
                </button>
                <button
                  onClick={() => trocarModo('criar')}
                  className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
                >
                  Primeira vez? Criar conta
                </button>
              </>
            )}
            {modo !== 'entrar' && (
              <button
                onClick={() => trocarModo('entrar')}
                className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
              >
                Voltar para o login
              </button>
            )}
          </div>
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
  if (/signups not allowed/i.test(msg)) return 'O cadastro de novas contas está fechado.'
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  return msg
}
