import type { EquipeConfig } from './types'

/**
 * REGRA A CONFIRMAR (módulo Designar Célula):
 * o rodízio anda sempre nesta ordem fixa. Para mudar a ordem, basta
 * reordenar este array — todo o cálculo de "próxima da vez" deriva dele.
 */
export const RODIZIO_ORDEM = ['Célula I', 'Célula II', 'Célula III'] as const

/** Portes de empresa, cada um com rodízio independente. */
export const PORTES = [
  'Empreiteiras Regionais',
  'Pequena Empresa',
  'Média Empresa',
  'Grande Empresa',
] as const

/** Prazo do PPP: dias ÚTEIS a partir da data de solicitação. */
export const PRAZO_PPP_DIAS_UTEIS = 7

/**
 * Equipe padrão — usada na primeira vez que o app roda.
 * Depois disso a fonte da verdade é a tela "Equipe" (salva online).
 */
export const EQUIPE_PADRAO: EquipeConfig = {
  celulas: [
    { nome: 'Célula I', responsavel: 'Patricia', esocial: '', gestor: '', tecnicos: [] },
    { nome: 'Célula II', responsavel: 'Gabriela', esocial: '', gestor: '', tecnicos: [] },
    { nome: 'Célula III', responsavel: 'Felipe', esocial: '', gestor: '', tecnicos: [] },
  ],
}
