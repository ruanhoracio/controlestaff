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
  /** Célula da vez — ou o nome da pessoa nos rodízios de ergonomista e eSocial. */
  celula: string
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
  /** Responsável da célula — é também quem aparece como gestor no CAT. */
  responsavel: string
  tecnicos: string[]
}

export interface Ergonomista {
  nome: string
  celula: string
}

export interface ConfigEsocial {
  /** Fila do rodízio de eSocial avulso (empresa sem célula). */
  fila: string[]
  /**
   * Quem faz o eSocial de cada célula, por rodízio. É fixo por célula, mas
   * cada rodízio tem seu próprio deslocamento — na Pequena Empresa a fila
   * está uma posição adiante das demais.
   *
   * porRodizio['Pequena Empresa']['Célula I'] === 'Miriã'
   */
  porRodizio: Record<string, Record<string, string>>
}

export interface EquipeConfig {
  celulas: CelulaEquipe[]
  esocial: ConfigEsocial
  ergonomistas: Ergonomista[]
}

export type Tela = 'dashboard' | 'ppp' | 'celulas' | 'cat' | 'equipe' | 'senha'
