import { RODIZIO_ORDEM } from './config'
import type { DesignacaoCat, DesignacaoCelula } from './types'

/**
 * Próxima célula da vez para um porte: a seguinte à última designação
 * registrada (designações puladas também avançam a vez).
 */
export function proximaCelula(historicoDoPorte: DesignacaoCelula[]): string {
  if (historicoDoPorte.length === 0) return RODIZIO_ORDEM[0]
  const ultimo = [...historicoDoPorte].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1)!
  const idx = RODIZIO_ORDEM.indexOf(ultimo.celula as (typeof RODIZIO_ORDEM)[number])
  return RODIZIO_ORDEM[(idx + 1) % RODIZIO_ORDEM.length]
}

/** Fila alfabética da célula (locale pt-BR). */
export function filaAlfabetica(tecnicos: string[]): string[] {
  return [...tecnicos].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
}

/** Quantos CATs cada técnico atendeu no mês. */
export function contagemDoMes(tecnicos: string[], catsDoMes: DesignacaoCat[]): Map<string, number> {
  const contagem = new Map(tecnicos.map((t) => [t, 0]))
  for (const cat of catsDoMes) {
    if (contagem.has(cat.tecnico)) contagem.set(cat.tecnico, contagem.get(cat.tecnico)! + 1)
  }
  return contagem
}

/**
 * Próximo técnico a atender CAT: o primeiro da fila alfabética que ainda não
 * atendeu no mês. Quando todos já atenderam, a fila reinicia (quem tem menos
 * atendimentos no mês volta a ser o próximo, em ordem alfabética).
 */
export function proximoTecnico(tecnicos: string[], catsDoMes: DesignacaoCat[]): string | null {
  if (tecnicos.length === 0) return null
  const fila = filaAlfabetica(tecnicos)
  const contagem = contagemDoMes(fila, catsDoMes)
  const minimo = Math.min(...fila.map((t) => contagem.get(t)!))
  return fila.find((t) => contagem.get(t) === minimo) ?? null
}
