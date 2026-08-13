import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Campo, Icone } from '../components/Ui'
import Marca from '../components/Marca'
import { useTema } from '../state/tema'

type Modo = 'entrar' | 'criar' | 'recuperar'

const TITULOS: Record<Modo, { titulo: string; legenda: string; acao: string }> = {
  entrar: { titulo: 'Bem-vinda de volta', legenda: 'Entre pra ver seu dia organizado.', acao: 'Entrar' },
  criar: {
    titulo: 'Criar conta',
    legenda: 'Login individual, dados compartilhados com a equipe.',
    acao: 'Criar conta',
  },
  recuperar: {
    titulo: 'Esqueceu a senha?',
    legenda: 'Informe seu e-mail e enviamos um link pra você criar uma nova.',
    acao: 'Enviar link',
  },
}

export default function Login() {
  const { tema } = useTema()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [papel, setPapel] = useState<'tecnico' | 'gestor'>('tecnico')
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
        // nome e papel viajam como metadados; o gatilho do banco cria o perfil com eles
        const { data, error } = await supabase!.auth.signUp({
          email,
          password: senha,
          options: { data: { nome: nome.trim(), papel } },
        })
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
          <div className="mb-8">
            <Marca escuro={tema === 'escuro'} tamanho="grande" comSubtitulo={false} />
            <span className="mt-2 block font-mono text-[10px] font-medium tracking-[-0.02em] text-slate-400 uppercase">
              Controle Staff · Segurança do Trabalho
            </span>
          </div>

          <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-1">{t.titulo}</h1>
          <p className="text-sm text-slate-500 font-light mb-6">{t.legenda}</p>

          <form onSubmit={enviar} className="space-y-4">
            {modo === 'criar' && (
              <Campo rotulo="Seu nome">
                <input
                  required
                  className="input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como aparece no histórico"
                  autoComplete="name"
                />
              </Campo>
            )}

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

            {modo === 'criar' && (
              <div>
                <span className="field-label">Seu acesso</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { valor: 'tecnico', rotulo: 'Técnica(o)', ajuda: 'Só o Controle de PPP' },
                      { valor: 'gestor', rotulo: 'Gestora(o)', ajuda: 'Acesso a tudo' },
                    ] as const
                  ).map((op) => (
                    <button
                      key={op.valor}
                      type="button"
                      onClick={() => setPapel(op.valor)}
                      className={`rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 ${
                        papel === op.valor
                          ? 'bg-gradient-to-b from-blue-500 to-blue-600 border-blue-700 text-white shadow-btn'
                          : 'bg-white/[0.6] border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <span className="block text-sm">{op.rotulo}</span>
                      <span
                        className={`block text-[11px] font-light ${papel === op.valor ? 'text-blue-100' : 'text-slate-400'}`}
                      >
                        {op.ajuda}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
