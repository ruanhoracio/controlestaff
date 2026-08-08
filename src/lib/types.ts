export type Conclusao = 'ENTREGUE' | 'PENDENTE' | 'ELETRONICO'

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
  mes: string // 'YYYY-MM', derivado do prazo
  conclusao: Conclusao
  created_at: string
}

export interface DesignacaoCelula {
  id: string
  data: string
  porte: string
  empresa: string | null // null quando a vez foi pulada
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
  responsavel: string
  esocial: string
  gestor: string
  tecnicos: string[]
}

export interface EquipeConfig {
  celulas: CelulaEquipe[]
}

export type Tela = 'dashboard' | 'ppp' | 'celulas' | 'cat' | 'equipe'
