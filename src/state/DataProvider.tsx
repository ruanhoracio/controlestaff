import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { EQUIPE_PADRAO } from '../lib/config'
import type { DesignacaoCat, DesignacaoCelula, EquipeConfig, Papel, Perfil, PppRecord } from '../lib/types'

export type NovoPpp = Omit<PppRecord, 'id' | 'created_at'>
export type NovaDesigCelula = Omit<DesignacaoCelula, 'id' | 'created_at'>
export type NovaDesigCat = Omit<DesignacaoCat, 'id' | 'created_at'>

interface DataContextValue {
  carregando: boolean
  erro: string | null
  perfil: Perfil | null
  papel: Papel
  souGestor: boolean
  ppp: PppRecord[]
  salvarPpp: (registro: NovoPpp, id?: string) => Promise<void>
  excluirPpp: (id: string) => Promise<void>
  renomearEmMassa: (campo: 'empresa' | 'responsavel', antigo: string, novo: string) => Promise<void>
  desigCelulas: DesignacaoCelula[]
  adicionarDesigCelula: (registro: NovaDesigCelula) => Promise<void>
  excluirDesigCelula: (id: string) => Promise<void>
  desigCats: DesignacaoCat[]
  adicionarDesigCat: (registro: NovaDesigCat) => Promise<void>
  excluirDesigCat: (id: string) => Promise<void>
  equipe: EquipeConfig
  salvarEquipe: (equipe: EquipeConfig) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData fora do DataProvider')
  return ctx
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ppp, setPpp] = useState<PppRecord[]>([])
  const [desigCelulas, setDesigCelulas] = useState<DesignacaoCelula[]>([])
  const [desigCats, setDesigCats] = useState<DesignacaoCat[]>([])
  const [equipe, setEquipe] = useState<EquipeConfig>(EQUIPE_PADRAO)
  const [configId, setConfigId] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [papel, setPapel] = useState<Papel>('gestor')

  useEffect(() => {
    carregarTudo()
  }, [])

  /**
   * Papel de quem entrou. Enquanto a migração 04 não rodar a tabela `perfis`
   * nem existe — nesse caso todo mundo segue como gestor, que é como o app
   * funcionava antes de ter papéis.
   */
  async function carregarPerfil(): Promise<Papel> {
    const { data: sessao } = await supabase!.auth.getSession()
    const uid = sessao.session?.user.id
    if (!uid) return 'gestor'
    const { data, error } = await supabase!.from('perfis').select('*').eq('user_id', uid).maybeSingle()
    if (error) return 'gestor'
    const meu = (data as Perfil) ?? null
    setPerfil(meu)
    setPapel(meu?.papel ?? 'tecnico')
    return meu?.papel ?? 'tecnico'
  }

  async function carregarTudo() {
    setCarregando(true)
    setErro(null)
    try {
      const meuPapel = await carregarPerfil()
      const [rPpp, rCel, rCat, rCfg] = await Promise.all([
        supabase!.from('ppp_records').select('*').order('data_solicitada', { ascending: false }),
        supabase!.from('designacoes_celula').select('*').order('created_at', { ascending: false }),
        supabase!.from('designacoes_cat').select('*').order('created_at', { ascending: false }),
        supabase!.from('app_config').select('*').limit(1).maybeSingle(),
      ])
      const falha = rPpp.error ?? rCel.error ?? rCat.error ?? rCfg.error
      if (falha) throw falha
      setPpp(rPpp.data as PppRecord[])
      setDesigCelulas(rCel.data as DesignacaoCelula[])
      setDesigCats(rCat.data as DesignacaoCat[])
      if (rCfg.data) {
        setConfigId(rCfg.data.id)
        setEquipe(rCfg.data.equipe as EquipeConfig)
      } else if (meuPapel === 'gestor') {
        // primeira vez: grava a equipe padrão pra já ficar disponível em qualquer máquina
        const { data, error } = await supabase!
          .from('app_config')
          .insert({ equipe: EQUIPE_PADRAO })
          .select()
          .single()
        if (error) throw error
        setConfigId(data.id)
        setEquipe(data.equipe as EquipeConfig)
      }
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar os dados.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvarPpp(registro: NovoPpp, id?: string) {
    const gravar = (payload: Partial<NovoPpp>) =>
      id
        ? supabase!.from('ppp_records').update(payload).eq('id', id).select().single()
        : supabase!.from('ppp_records').insert(payload).select().single()

    let { data, error } = await gravar(registro)
    // A coluna `ativo` veio na migração 03. Se o banco ainda não tiver rodado
    // ela, grava sem o campo em vez de deixar o cadastro quebrado.
    if (error && /ativo/.test(error.message)) {
      const { ativo, ...semAtivo } = registro
      ;({ data, error } = await gravar(semAtivo))
    }
    if (error) throw error

    const salvo = { ativo: false, ...(data as Partial<PppRecord>) } as PppRecord
    setPpp((atual) => (id ? atual.map((r) => (r.id === id ? salvo : r)) : [salvo, ...atual]))
  }

  async function excluirPpp(id: string) {
    const { error } = await supabase!.from('ppp_records').delete().eq('id', id)
    if (error) throw error
    setPpp((atual) => atual.filter((r) => r.id !== id))
  }

  /** Renomeia uma empresa ou responsável em todos os registros de uma vez. */
  async function renomearEmMassa(campo: 'empresa' | 'responsavel', antigo: string, novo: string) {
    const { error } = await supabase!.from('ppp_records').update({ [campo]: novo }).eq(campo, antigo)
    if (error) throw error
    setPpp((atual) => atual.map((r) => (r[campo] === antigo ? { ...r, [campo]: novo } : r)))
  }

  async function adicionarDesigCelula(registro: NovaDesigCelula) {
    const { data, error } = await supabase!.from('designacoes_celula').insert(registro).select().single()
    if (error) throw error
    setDesigCelulas((atual) => [data as DesignacaoCelula, ...atual])
  }

  async function excluirDesigCelula(id: string) {
    const { error } = await supabase!.from('designacoes_celula').delete().eq('id', id)
    if (error) throw error
    setDesigCelulas((atual) => atual.filter((r) => r.id !== id))
  }

  async function adicionarDesigCat(registro: NovaDesigCat) {
    const { data, error } = await supabase!.from('designacoes_cat').insert(registro).select().single()
    if (error) throw error
    setDesigCats((atual) => [data as DesignacaoCat, ...atual])
  }

  async function excluirDesigCat(id: string) {
    const { error } = await supabase!.from('designacoes_cat').delete().eq('id', id)
    if (error) throw error
    setDesigCats((atual) => atual.filter((r) => r.id !== id))
  }

  async function salvarEquipe(nova: EquipeConfig) {
    const { error } = await supabase!.from('app_config').update({ equipe: nova }).eq('id', configId)
    if (error) throw error
    setEquipe(nova)
  }

  return (
    <DataContext.Provider
      value={{
        carregando,
        erro,
        perfil,
        papel,
        souGestor: papel === 'gestor',
        ppp,
        salvarPpp,
        excluirPpp,
        renomearEmMassa,
        desigCelulas,
        adicionarDesigCelula,
        excluirDesigCelula,
        desigCats,
        adicionarDesigCat,
        excluirDesigCat,
        equipe,
        salvarEquipe,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
