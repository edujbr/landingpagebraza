import { createServerClient } from './supabase'

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

export const TOP_N = 5

export async function getPublishedRanking(): Promise<PublishedRanking | null> {
  const sb = createServerClient()
  if (!sb) return null
  try {
    const { data, error } = await sb
      .from('rankings')
      .select('id, period_label, ranking_entries(position, customer_name, phone_last_four, order_count)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    const entries = ((data.ranking_entries ?? []) as RankingEntry[])
      .filter((e) => e.position > 0)
      .sort((a, b) => a.position - b.position)
      .slice(0, TOP_N)
    return { id: data.id, period_label: data.period_label, entries }
  } catch {
    return null
  }
}
