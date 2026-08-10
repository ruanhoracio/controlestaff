import { RODIZIOS, RODIZIO_ORDEM, type RodizioId } from './config'
import type { DesignacaoCat, DesignacaoCelula, EquipeConfig } from './types'

function cfg(rodizioId: string) {
  return RODIZIOS.find((r) => r.id === rodizioId)
}

/** Designações de um rodízio, da mais antiga para a mais recente. */
function emOrdem(historico: DesignacaoCelula[]): DesignacaoCelula[] {
  return [...historico].sort((a, b) => (a.created_at + a.data).localeCompare(b.created_at + b.data))
}

/** A fila de um rodízio: células, nomes de ergonomistas ou a fila de eSocial. */
export function filaDoRodizio(rodizioId: RodizioId, equipe: EquipeConfig): string[] {
  const c = cfg(rodizioId)
  if (c?.tipo === 'ergonomista') return equipe.ergonomistas.map((e) => e.nome)
  if (c?.tipo === 'esocial') return equipe.esocial.fila
  return [...RODIZIO_ORDEM]
}

/** Avança uma posição numa fila circular a partir do último valor usado. */
function proximoNaFila(fila: string[], ultimo: string | undefined): string | null {
  if (fila.length === 0) return null
  if (ultimo === undefined) return fila[0]
  const idx = fila.indexOf(ultimo)
  // se o último não está mais na fila (alguém saiu da equipe), recomeça do início
  if (idx === -1) return fila[0]
  return fila[(idx + 1) % fila.length]
}

/**
 * Próxima da vez de um rodízio: a seguinte à última designação registrada.
 * Designações puladas também avançam a vez.
 */
export function proximaCelula(
  historicoDoRodizio: DesignacaoCelula[],
  rodizioId: RodizioId,
  equipe: EquipeConfig,
): string | null {
  const fila = filaDoRodizio(rodizioId, equipe)
  return proximoNaFila(fila, emOrdem(historicoDoRodizio).at(-1)?.celula)
}

/**
 * Quem faz o eSocial da vez.
 *
 * O eSocial é fixo por célula, mas cada rodízio tem seu próprio deslocamento:
 * na Pequena Empresa a fila está uma posição adiante das demais. Rodízios de
 * Exames e Ergonomistas não têm eSocial.
 */
export function esocialDaVez(
  rodizioId: RodizioId,
  posicao: string | null,
  equipe: EquipeConfig,
): string {
  if (!posicao || !cfg(rodizioId)?.temEsocial) return ''
  return equipe.esocial.porRodizio?.[rodizioId]?.[posicao] ?? ''
}

/** Quem responde por uma posição da fila: o responsável da célula, ou a própria pessoa. */
export function responsavelDaVez(posicao: string, rodizioId: RodizioId, equipe: EquipeConfig): string {
  const tipo = cfg(rodizioId)?.tipo
  if (tipo === 'ergonomista' || tipo === 'esocial') return posicao
  return equipe.celulas.find((c) => c.nome === posicao)?.responsavel ?? ''
}

// --------------------------------------------------------------------------
// Rodízio de CAT
// --------------------------------------------------------------------------

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
