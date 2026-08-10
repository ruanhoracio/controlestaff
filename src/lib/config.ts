import type { EquipeConfig } from './types'

/**
 * REGRA CONFIRMADA (módulo Designar Célula):
 * o rodízio entre células anda sempre nesta ordem fixa. Para mudar,
 * basta reordenar este array — todo o cálculo de "próxima da vez" deriva dele.
 */
export const RODIZIO_ORDEM = ['Célula I', 'Célula II', 'Célula III'] as const

export type Celula = (typeof RODIZIO_ORDEM)[number]

/**
 * Os rodízios da planilha "RODÍZIO - DESIGNAR CÉLULA".
 *
 * - tipo 'celula'      → gira entre Célula I, II e III (RODIZIO_ORDEM)
 * - tipo 'ergonomista' → gira entre pessoas (equipe.ergonomistas)
 * - tipo 'esocial'     → empresa que é só eSocial, sem célula; gira entre a fila de eSocial
 *
 * 'temEsocial' diz se a designação também carrega um responsável de eSocial.
 * Em "Exames" a coluna equivalente da planilha é Classificação, não eSocial.
 */
export const RODIZIOS = [
  { id: 'Empreiteiras Regionais', tipo: 'celula', temEsocial: true },
  { id: 'Pequena Empresa', tipo: 'celula', temEsocial: true },
  { id: 'Média Empresa', tipo: 'celula', temEsocial: true },
  { id: 'Grande Empresa', tipo: 'celula', temEsocial: true },
  { id: 'Rede Corporativa', tipo: 'celula', temEsocial: true },
  { id: 'Exames, Pontual, PGSM e Licitações', tipo: 'celula', temEsocial: false },
  { id: 'Ergonomistas', tipo: 'ergonomista', temEsocial: false },
  { id: 'eSocial', tipo: 'esocial', temEsocial: false },
] as const

export type RodizioId = (typeof RODIZIOS)[number]['id']

/** Portes usados no rodízio de eSocial avulso (empresa sem célula). */
export const PORTES_ESOCIAL = ['PE', 'ME', 'GE', 'RC'] as const

/** Classificações do rodízio de Exames (a planilha usa a coluna "Classificaçao"). */
export const CLASSIFICACOES_EXAMES = ['Exames', 'Pontual', 'PGSM', 'Licitações'] as const

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
 *
 * O eSocial é fixo por célula, mas cada rodízio tem seu próprio deslocamento:
 * na Pequena Empresa a fila está uma posição adiante das demais.
 */
export const EQUIPE_PADRAO: EquipeConfig = {
  celulas: [
    { nome: 'Célula I', responsavel: 'Patricia', tecnicos: [] },
    { nome: 'Célula II', responsavel: 'Gabriela', tecnicos: [] },
    { nome: 'Célula III', responsavel: 'Felipe', tecnicos: [] },
  ],
  esocial: { fila: [], porRodizio: {} },
  ergonomistas: [],
}
