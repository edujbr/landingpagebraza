export type RankingEntry = {
  position: number
  customer_name: string
  phone_last_four: string | null
  order_count: number
}

export type PublishedRanking = {
  id: number
  period_label: string | null
  entries: RankingEntry[]
}

export type RankingStatus = 'draft' | 'published' | 'archived'

export type RankingRow = {
  id: number
  period_label: string
  status: RankingStatus
  published_at: string | null
  created_at: string
  entries: RankingEntry[]
}

/** Entrada enviada pelo painel ao publicar um ranking novo. */
export type RankingDraft = {
  period: { label: string; start: string; end: string }
  sourceFileName: string | null
  entries: { name: string; phone: string; orders: number; originalPosition: number | null; edited: boolean }[]
}

export const TOP_N = 5
