import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'escuro'

const CHAVE = 'controle-staff:tema'

function temaInicial(): Tema {
  const salvo = localStorage.getItem(CHAVE)
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

/** Tema do app, lembrado no navegador de cada máquina. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    localStorage.setItem(CHAVE, tema)
  }, [tema])

  return { tema, alternar: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')) }
}
