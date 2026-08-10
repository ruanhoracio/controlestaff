/**
 * Padronização de texto do app: nomes de empresa, funcionário, responsável e
 * tipo são sempre gravados em MAIÚSCULAS, como a técnica pediu.
 */
export function maiusculo(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase()
}

/** Compara dois nomes ignorando caixa, acento e espaços repetidos. */
export function mesmoNome(a: string, b: string): boolean {
  const limpar = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  return limpar(a) === limpar(b)
}

/** Lista ordenada e sem repetição, ignorando vazios. */
export function distintos(valores: string[]): string[] {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
