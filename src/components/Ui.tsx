import type { ReactNode } from 'react'
import type { Conclusao } from '../lib/types'

export function Icone({ nome, className = 'text-lg' }: { nome: string; className?: string }) {
  return <iconify-icon icon={nome} style={{ strokeWidth: 1.5 }} class={className}></iconify-icon>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>
}

export function TituloTela({ eyebrow, titulo, descricao }: { eyebrow: string; titulo: string; descricao?: string }) {
  return (
    <div className="mb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="text-3xl md:text-4xl font-light tracking-tight text-slate-950 leading-[1.05]">{titulo}</h1>
      {descricao && <p className="mt-3 text-base leading-7 text-slate-600 font-light max-w-2xl">{descricao}</p>}
    </div>
  )
}

export function CaixaIcone({ nome, cor = 'blue' }: { nome: string; cor?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' }) {
  const cores: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-500',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-500',
    amber: 'bg-amber-50 border-amber-100 text-amber-500',
    red: 'bg-red-50 border-red-100 text-red-500',
    slate: 'bg-slate-100 border-slate-200 text-slate-600',
  }
  return (
    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-[inset_0_1px_0_white] ${cores[cor]}`}>
      <Icone nome={nome} className="text-2xl" />
    </div>
  )
}

export const ROTULO_CONCLUSAO: Record<Conclusao, string> = {
  ENTREGUE: 'Entregue',
  PENDENTE: 'Pendente',
  AUXILIO: 'Auxílio',
  NAO_SE_APLICA: 'Não se aplica',
  DESCONSIDERADO: 'Desconsiderado',
}

const CLASSE_CONCLUSAO: Record<Conclusao, string> = {
  ENTREGUE: 'badge-emerald',
  PENDENTE: 'badge-amber',
  AUXILIO: 'badge-blue',
  NAO_SE_APLICA: 'badge-neutral',
  DESCONSIDERADO: 'badge-neutral',
}

export function BadgeConclusao({ valor }: { valor: Conclusao }) {
  return <span className={CLASSE_CONCLUSAO[valor] ?? 'badge-neutral'}>{ROTULO_CONCLUSAO[valor] ?? valor}</span>
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{rotulo}</span>
      {children}
    </label>
  )
}

export function Modal({
  titulo,
  aberto,
  aoFechar,
  children,
  largo = false,
}: {
  titulo: string
  aberto: boolean
  aoFechar: () => void
  children: ReactNode
  largo?: boolean
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={aoFechar} />
      <div className={`relative z-10 w-full ${largo ? 'max-w-3xl' : 'max-w-xl'} glass-panel p-6 sm:p-8 my-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-normal tracking-tight text-slate-950">{titulo}</h2>
          <button
            onClick={aoFechar}
            className="w-9 h-9 rounded-full bg-white/[0.78] border border-slate-200 shadow-control flex items-center justify-center text-slate-500 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-300"
            aria-label="Fechar"
          >
            <Icone nome="solar:close-circle-linear" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EstadoVazio({ icone, mensagem }: { icone: string; mensagem: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
        <Icone nome={icone} className="text-2xl" />
      </div>
      <p className="text-sm text-slate-400 font-light max-w-xs">{mensagem}</p>
    </div>
  )
}
