import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from './lib/supabase'
import { useTema } from './state/tema'
import { DataProvider, useData } from './state/DataProvider'
import { Icone, TituloTela } from './components/Ui'
import Marca from './components/Marca'
import Setup from './screens/Setup'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Ppp from './screens/Ppp'
import Celulas from './screens/Celulas'
import Cat from './screens/Cat'
import Equipe from './screens/Equipe'
import Historico from './screens/Historico'
import Acessos from './screens/Acessos'
import NovaSenha from './screens/NovaSenha'
import type { Tela } from './lib/types'

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [verificando, setVerificando] = useState(true)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const { tema, alternar } = useTema()

  useEffect(() => {
    if (!supabaseConfigurado) {
      setVerificando(false)
      return
    }
    // O link de recuperação chega com o token no hash da URL; detectamos antes
    // do getSession pra abrir direto a tela de nova senha.
    if (/type=recovery/.test(window.location.hash)) setRecuperandoSenha(true)

    supabase!.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setVerificando(false)
    })
    const { data: sub } = supabase!.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      setSessao(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <Fundo escuro={tema === 'escuro'} />
      {!supabaseConfigurado ? (
        <Setup />
      ) : verificando ? (
        <TelaCarregando />
      ) : recuperandoSenha && sessao ? (
        <NovaSenha modo="recuperacao" aoConcluir={() => setRecuperandoSenha(false)} />
      ) : !sessao ? (
        <Login />
      ) : (
        <DataProvider>
          <Shell escuro={tema === 'escuro'} alternarTema={alternar} />
        </DataProvider>
      )}
    </>
  )
}

/** Fundo ambiente do design system: blobs em drift + textura de pontos. */
function Fundo({ escuro }: { escuro: boolean }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className={`bg-blob-one absolute top-[-12%] left-[-12%] w-[52vw] h-[52vw] rounded-full blur-[7.5rem] will-change-transform ${
          escuro ? 'bg-[#c9a961]/[0.09]' : 'bg-blue-200/35'
        }`}
      />
      <div
        className={`bg-blob-two absolute bottom-[-18%] right-[-10%] w-[62vw] h-[62vw] rounded-full blur-[8.75rem] will-change-transform ${
          escuro ? 'bg-[#1d3a6b]/25' : 'bg-sky-200/[0.22]'
        }`}
      />
      <div
        className={`bg-blob-three absolute top-[36%] left-[36%] w-[30vw] h-[30vw] rounded-full blur-[5rem] will-change-transform ${
          escuro ? 'bg-[#243352]/30' : 'bg-white/55'
        }`}
      />
      <div
        className={`bg-dots absolute inset-0 ${escuro ? 'opacity-[0.30]' : 'opacity-[0.22]'}`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            escuro ? 'rgba(201,169,97,0.10)' : 'rgba(15,23,42,0.09)'
          } 1px, transparent 0)`,
          backgroundSize: '2rem 2rem',
        }}
      />
    </div>
  )
}

function TelaCarregando() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-xs text-slate-400 animate-pulse">carregando…</p>
    </div>
  )
}

/** `soGestor` é só a metade visual — quem manda de verdade é o RLS do banco. */
const ITENS_MENU: { tela: Tela; rotulo: string; icone: string; soGestor?: boolean }[] = [
  { tela: 'dashboard', rotulo: 'Dashboard', icone: 'solar:widget-linear', soGestor: true },
  { tela: 'ppp', rotulo: 'Controle de PPP', icone: 'solar:document-text-linear' },
  { tela: 'celulas', rotulo: 'Designar Célula', icone: 'solar:buildings-2-linear', soGestor: true },
  { tela: 'cat', rotulo: 'Designar CAT', icone: 'solar:siren-rounded-linear', soGestor: true },
  { tela: 'equipe', rotulo: 'Equipe', icone: 'solar:users-group-rounded-linear', soGestor: true },
  { tela: 'historico', rotulo: 'Histórico', icone: 'solar:history-linear', soGestor: true },
  { tela: 'acessos', rotulo: 'Acessos', icone: 'solar:shield-user-linear', soGestor: true },
]

function Shell({ escuro, alternarTema }: { escuro: boolean; alternarTema: () => void }) {
  const { carregando, erro, papel, souGestor } = useData()
  // null = ainda não escolheu; a tela inicial depende do papel, que só chega
  // depois do primeiro render
  const [tela, setTela] = useState<Tela | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)

  const escolhida = tela ?? (souGestor ? 'dashboard' : 'ppp')
  const permitida = ITENS_MENU.find((i) => i.tela === escolhida)?.soGestor && !souGestor ? 'ppp' : escolhida
  const bloqueado = papel === 'bloqueado'

  function navegar(t: Tela) {
    setTela(t)
    setMenuAberto(false)
  }

  return (
    <div className="relative z-10 min-h-screen">
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <div className="glass-panel !rounded-[1.75rem] px-4 py-3 flex items-center justify-between gap-3">
          <Marca escuro={escuro} tamanho="compacto" comSubtitulo={false} />
          <button
            className="w-9 h-9 rounded-full bg-white/[0.78] border border-slate-200 shadow-control flex items-center justify-center text-slate-600"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Menu"
          >
            <Icone nome={menuAberto ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} />
          </button>
        </div>
        {menuAberto && (
          <div className="glass-panel mt-2 p-3">
            <Menu
              tela={permitida}
              navegar={navegar}
              escuro={escuro}
              alternarTema={alternarTema}
              souGestor={souGestor}
              bloqueado={bloqueado}
            />
          </div>
        )}
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 p-4 z-40">
        <div className="glass-panel h-full p-4 flex flex-col">
          <div className="px-2 pt-2 pb-6">
            <Marca escuro={escuro} />
          </div>
          <Menu
            tela={permitida}
            navegar={navegar}
            escuro={escuro}
            alternarTema={alternarTema}
            souGestor={souGestor}
            bloqueado={bloqueado}
          />
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="lg:pl-72 pt-24 lg:pt-10 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {erro && (
            <p className="mb-6 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              Erro ao carregar os dados: {erro}. Verifique o schema no Supabase (README.md).
            </p>
          )}
          {carregando ? (
            <TelaCarregando />
          ) : bloqueado ? (
            <SemAcesso />
          ) : permitida === 'dashboard' ? (
            <Dashboard navegar={navegar} />
          ) : permitida === 'ppp' ? (
            <Ppp />
          ) : permitida === 'celulas' ? (
            <Celulas />
          ) : permitida === 'cat' ? (
            <Cat irParaEquipe={() => navegar('equipe')} />
          ) : permitida === 'historico' ? (
            <Historico />
          ) : permitida === 'acessos' ? (
            <Acessos />
          ) : permitida === 'senha' ? (
            <>
              <TituloTela
                eyebrow="Conta"
                titulo="Trocar senha"
                descricao="Escolha uma nova senha de acesso ao Controle Staff."
              />
              <NovaSenha modo="troca" aoConcluir={() => navegar(souGestor ? 'dashboard' : 'ppp')} />
            </>
          ) : (
            <Equipe key={String(carregando)} />
          )}
        </div>
      </main>
    </div>
  )
}


function SemAcesso() {
  return (
    <div className="glass-card p-8 max-w-lg">
      <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-2">Acesso bloqueado</h1>
      <p className="text-sm text-slate-500 font-light">
        Sua conta existe, mas ainda não tem permissão pra ver os dados. Peça pra quem cuida do Controle Staff liberar
        seu acesso na tela de Acessos.
      </p>
    </div>
  )
}

function Menu({
  tela,
  navegar,
  escuro,
  alternarTema,
  souGestor,
  bloqueado = false,
}: {
  tela: Tela
  navegar: (t: Tela) => void
  escuro: boolean
  alternarTema: () => void
  souGestor: boolean
  bloqueado?: boolean
}) {
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {ITENS_MENU.filter((i) => !bloqueado && (souGestor || !i.soGestor)).map((item) => {
        const ativo = tela === item.tela
        return (
          <button
            key={item.tela}
            onClick={() => navegar(item.tela)}
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-left transition-all duration-300 ${
              ativo
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-700 text-white shadow-btn'
                : 'text-slate-600 border border-transparent hover:bg-white/70 hover:text-blue-600'
            }`}
          >
            <Icone nome={item.icone} className={`text-lg ${ativo ? 'text-white' : 'text-blue-500'}`} />
            {item.rotulo}
          </button>
        )
      })}
      <div className="mt-auto pt-4 flex flex-col gap-1">
        <button
          onClick={alternarTema}
          className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-slate-500 hover:text-blue-600 hover:bg-white/70 transition-all duration-300"
        >
          <Icone nome={escuro ? 'solar:sun-linear' : 'solar:moon-linear'} className="text-lg" />
          {escuro ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          onClick={() => navegar('senha')}
          className={`w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all duration-300 ${
            tela === 'senha' ? 'text-blue-600 bg-white/70' : 'text-slate-500 hover:text-blue-600 hover:bg-white/70'
          }`}
        >
          <Icone nome="solar:lock-password-linear" className="text-lg" />
          Trocar senha
        </button>
        <button
          onClick={() => supabase!.auth.signOut()}
          className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-slate-500 hover:text-red-600 hover:bg-white/70 transition-all duration-300"
        >
          <Icone nome="solar:logout-2-linear" className="text-lg" />
          Sair
        </button>
      </div>
    </nav>
  )
}
