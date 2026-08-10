import type { CONCLUSOES } from './config'

export type Conclusao = (typeof CONCLUSOES)[number]

export interface PppRecord {
  id: string
  empresa: string
  funcionario: string
  celula: string
  tipo: string
  admissao: string | null
  demissao: string | null
  data_solicitada: string
  prazo_entrega: string
  data_entrega: string | null
  responsavel: string
  mes: string // 'YYYY-MM' — mês da entrega quando entregue, senão mês do prazo
  conclusao: Conclusao
  observacao: string
  created_at: string
}

export interface DesignacaoCelula {
  id: string
  data: string
  porte: string // id do rodízio (ver RODIZIOS em config.ts)
  empresa: string | null // null quando a vez foi pulada ou não registrada
  celula: string // célula da vez — ou o nome do ergonomista, no rodízio de ergonomistas
  responsavel: string
  esocial: string
  pulada: boolean
  created_at: string
}

export interface DesignacaoCat {
  id: string
  data: string
  celula: string
  tecnico: string
  direta: boolean // designado fora do rodízio (clique direto no técnico)
  created_at: string
}

export interface CelulaEquipe {
  nome: string
  responsavel: string
  gestor: string
  tecnicos: string[]
}

export interface Ergonomista {
  nome: string
  celula: string
}

export interface EquipeConfig {
  celulas: CelulaEquipe[]
  /** Fila do rodízio de eSocial — avança a cada designação, independente da célula. */
  esocial: string[]
  /** Fila do rodízio de ergonomistas. */
  ergonomistas: Ergonomista[]
}

export type Tela = 'dashboard' | 'ppp' | 'celulas' | 'cat' | 'equipe' | 'senha'
