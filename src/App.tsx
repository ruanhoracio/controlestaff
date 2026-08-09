import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from './lib/supabase'
import { DataProvider, useData } from './state/DataProvider'
import { Icone } from './components/Ui'
import logoMaxipas from './assets/logo-maxipas-branco.png'
import Setup from './screens/Setup'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Ppp from './screens/Ppp'
import Celulas from './screens/Celulas'
import Cat from './screens/Cat'
import Equipe from './screens/Equipe'
import type { Tela } from './lib/types'

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    if (!supabaseConfigurado) {
      setVerificando(false)
      return
    }
    supabase!.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setVerificando(false)
    })
    const { data: sub } = supabase!.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <Fundo />
      {!supabaseConfigurado ? (
        <Setup />
      ) : verificando ? (
        <TelaCarregando />
      ) : !sessao ? (
        <Login />
      ) : (
        <DataProvider>
          <Shell />
        </DataProvider>
      )}
    </>
  )
}

/** Fundo ambiente do design system: blobs em drift + textura de pontos. */
function Fundo() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="bg-blob-one absolute top-[-12%] left-[-12%] w-[52vw] h-[52vw] rounded-full bg-blue-200/35 blur-[7.5rem] will-change-transform" />
      <div className="bg-blob-two absolute bottom-[-18%] right-[-10%] w-[62vw] h-[62vw] rounded-full bg-sky-200/[0.22] blur-[8.75rem] will-change-transform" />
      <div className="bg-blob-three absolute top-[36%] left-[36%] w-[30vw] h-[30vw] rounded-full bg-white/55 blur-[5rem] will-change-transform" />
      <div
        className="bg-dots absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.09) 1px, transparent 0)',
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

const ITENS_MENU: { tela: Tela; rotulo: string; icone: string }[] = [
  { tela: 'dashboard', rotulo: 'Início', icone: 'solar:widget-linear' },
  { tela: 'ppp', rotulo: 'Controle de PPP', icone: 'solar:document-text-linear' },
  { tela: 'celulas', rotulo: 'Designar Célula', icone: 'solar:buildings-2-linear' },
  { tela: 'cat', rotulo: 'Designar CAT', icone: 'solar:siren-rounded-linear' },
  { tela: 'equipe', rotulo: 'Equipe', icone: 'solar:users-group-rounded-linear' },
]

function Shell() {
  const { carregando, erro } = useData()
  const [tela, setTela] = useState<Tela>('dashboard')
  const [menuAberto, setMenuAberto] = useState(false)

  function navegar(t: Tela) {
    setTela(t)
    setMenuAberto(false)
  }

  return (
    <div className="relative z-10 min-h-screen">
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <div className="glass-panel !rounded-[1.75rem] px-4 py-3 flex items-center justify-between gap-3">
          <Marca compacto />
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
            <Menu tela={tela} navegar={navegar} />
          </div>
        )}
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 p-4 z-40">
        <div className="glass-panel h-full p-4 flex flex-col">
          <div className="px-2 pt-2 pb-6">
            <Marca />
          </div>
          <Menu tela={tela} navegar={navegar} />
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
          ) : tela === 'dashboard' ? (
            <Dashboard navegar={navegar} />
          ) : tela === 'ppp' ? (
            <Ppp />
          ) : tela === 'celulas' ? (
            <Celulas />
          ) : tela === 'cat' ? (
            <Cat irParaEquipe={() => navegar('equipe')} />
          ) : (
            <Equipe key={String(carregando)} />
          )}
        </div>
      </main>
    </div>
  )
}

function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex flex-col gap-2 min-w-0">
      {/* Placa escura: o logo tem o texto em branco, precisa de fundo escuro pra contrastar */}
      <span className="inline-flex rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-raised px-4 py-2.5 self-start">
        <img
          src={logoMaxipas}
          alt="Maxipas — Saúde Ocupacional"
          className={compacto ? 'h-5 w-auto' : 'h-6 w-auto'}
        />
      </span>
      {/* No topo mobile o espaço é curto: só a placa, sem a linha de texto */}
      {!compacto && (
        <span className="font-mono text-[10px] font-medium tracking-[-0.02em] text-slate-400 uppercase pl-1">
          Controle Staff
        </span>
      )}
    </span>
  )
}

function Menu({ tela, navegar }: { tela: Tela; navegar: (t: Tela) => void }) {
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {ITENS_MENU.map((item) => {
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
      <div className="mt-auto pt-4">
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
