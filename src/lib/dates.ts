/** Utilitários de data. Datas circulam como ISO 'YYYY-MM-DD'; mês como 'YYYY-MM'. */

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Soma N dias úteis (pula sábado e domingo) a partir de uma data ISO. */
export function somarDiasUteis(dataISO: string, dias: number): string {
  const d = new Date(dataISO + 'T12:00:00')
  let somados = 0
  while (somados < dias) {
    d.setDate(d.getDate() + 1)
    const diaSemana = d.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) somados++
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

/** 'YYYY-MM' do mês corrente. */
export function mesAtual(): string {
  return hojeISO().slice(0, 7)
}

/** 'YYYY-MM' → 'ago/2026'. */
export function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-')
  const idx = Number(m) - 1
  return `${MESES_CURTOS[idx] ?? m}/${ano}`
}

export function dataLongaHoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
