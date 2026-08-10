import type { EquipeConfig } from './types'

/**
 * REGRA CONFIRMADA (módulo Designar Célula):
 * o rodízio entre células anda sempre nesta ordem fixa. Para mudar,
 * basta reordenar este array — todo o cálculo de "próxima da vez" deriva dele.
 */
export const RODIZIO_ORDEM = ['Célula I', 'Célula II', 'Célula III'] as const

/**
 * Os sete rodízios da planilha "RODÍZIO - DESIGNAR CÉLULA".
 *
 * - tipo 'celula'      → gira entre Célula I, II e III (RODIZIO_ORDEM)
 * - tipo 'ergonomista' → gira entre pessoas (equipe.ergonomistas), não entre células
 */
export const RODIZIOS = [
  { id: 'Empreiteiras Regionais', sigla: 'ER', tipo: 'celula' },
  { id: 'Pequena Empresa', sigla: 'PE', tipo: 'celula' },
  { id: 'Média Empresa', sigla: 'ME', tipo: 'celula' },
  { id: 'Grande Empresa', sigla: 'GE', tipo: 'celula' },
  { id: 'Rede Corporativa', sigla: 'RC', tipo: 'celula' },
  { id: 'Exames, Pontual, PGSM e Licitações', sigla: 'EX', tipo: 'celula' },
  { id: 'Ergonomistas', sigla: 'EG', tipo: 'ergonomista' },
] as const

export type RodizioId = (typeof RODIZIOS)[number]['id']

/** Prazo do PPP: dias ÚTEIS a partir da data de solicitação. */
export const PRAZO_PPP_DIAS_UTEIS = 7

/** Conclusões possíveis de um PPP (valores reais da planilha). */
export const CONCLUSOES = ['ENTREGUE', 'PENDENTE', 'AUXILIO', 'NAO_SE_APLICA', 'DESCONSIDERADO'] as const

/** Tipos de PPP (valores reais da planilha). */
export const TIPOS_PPP = ['PERIODO MAXIPAS', 'RETROATIVO', 'ELETRÔNICO'] as const

/**
 * Células usadas no controle de PPP. A Célula IV é histórica: não participa
 * mais dos rodízios, mas aparece em registros antigos.
 */
export const CELULAS_PPP = ['Célula I', 'Célula II', 'Célula III', 'Célula IV'] as const

/**
 * Equipe padrão — usada na primeira vez que o app roda.
 * Depois disso a fonte da verdade é a tela "Equipe" (salva online).
 */
export const EQUIPE_PADRAO: EquipeConfig = {
  celulas: [
    { nome: 'Célula I', responsavel: 'Patricia', gestor: 'Patricia', tecnicos: [] },
    { nome: 'Célula II', responsavel: 'Gabriela', gestor: 'Gabriela', tecnicos: [] },
    { nome: 'Célula III', responsavel: 'Felipe', gestor: 'Felipe', tecnicos: [] },
  ],
  // Rodízio de eSocial: fila própria, avança a cada designação, independente da célula.
  esocial: [],
  // Rodízio de ergonomistas: gira entre pessoas.
  ergonomistas: [],
}
