import { TOP_N, type PublishedRanking, type RankingDraft, type RankingEntry, type RankingRow } from '@/lib/ranking'
import { createServerClient } from '@/lib/supabase'
import { db, getSetting, setSetting, tx } from './db'

type Row = Omit<RankingRow, 'entries'>

function entriesOf(id: number): RankingEntry[] {
  return db().prepare(
    'SELECT position, customer_name, phone_last_four, order_count FROM ranking_entries WHERE ranking_id = ? ORDER BY position',
  ).all(id) as RankingEntry[]
}

export async function getPublishedRanking(): Promise<PublishedRanking | null> {
  await importFromSupabaseOnce()
  const r = db().prepare(
    "SELECT id, period_label FROM rankings WHERE status = 'published' ORDER BY published_at DESC LIMIT 1",
  ).get() as { id: number; period_label: string } | undefined
  if (!r) return null
  return { id: r.id, period_label: r.period_label, entries: entriesOf(r.id).slice(0, TOP_N) }
}

export async function listRankings(): Promise<RankingRow[]> {
  await importFromSupabaseOnce()
  const rows = db().prepare(
    'SELECT id, period_label, status, published_at, created_at FROM rankings ORDER BY created_at DESC, id DESC',
  ).all() as Row[]
  return rows.map((r) => ({ ...r, entries: entriesOf(r.id) }))
}

function markPublished(id: number) {
  db().prepare("UPDATE rankings SET status = 'archived' WHERE status = 'published'").run()
  db().prepare("UPDATE rankings SET status = 'published', published_at = datetime('now') WHERE id = ?").run(id)
}

export class RankingError extends Error {}

export function createAndPublish(draft: RankingDraft) {
  const label = String(draft?.period?.label ?? '').trim().slice(0, 40)
  if (!label) throw new RankingError('Escolha o mês do ranking.')
  const entries = (Array.isArray(draft.entries) ? draft.entries : [])
    .map((e) => ({
      name: String(e.name ?? '').trim().slice(0, 80),
      phone: String(e.phone ?? '').replace(/\D/g, '').slice(-4),
      orders: Math.max(0, Math.min(100000, Math.round(Number(e.orders) || 0))),
      originalPosition: Number.isInteger(e.originalPosition) ? e.originalPosition : null,
      edited: Boolean(e.edited),
    }))
    .filter((e) => e.name)
    .slice(0, TOP_N)
  if (!entries.length) throw new RankingError('Adicione pelo menos um cliente com nome.')

  return tx(() => {
    const { lastInsertRowid } = db().prepare(
      "INSERT INTO rankings (period_label, period_start, period_end, source_file_name, status) VALUES (?, ?, ?, ?, 'draft')",
    ).run(label, draft.period.start || null, draft.period.end || null, draft.sourceFileName?.slice(0, 120) || null)
    const id = Number(lastInsertRowid)
    const ins = db().prepare(
      `INSERT INTO ranking_entries (ranking_id, position, customer_name, phone_last_four, order_count, original_position, manually_edited)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    entries.forEach((e, i) => ins.run(id, i + 1, e.name, e.phone || null, e.orders, e.originalPosition, e.edited ? 1 : 0))
    markPublished(id)
    return id
  })
}

export function publishRanking(id: number) {
  tx(() => markPublished(id))
}

export function deleteRanking(id: number) {
  db().prepare('DELETE FROM rankings WHERE id = ?').run(id)
}

/**
 * Traz para o .db os rankings que estavam no Supabase (uma vez só).
 * Se o Supabase não estiver configurado ou já houver rankings locais, só marca como feito.
 */
let importing: Promise<void> | null = null
function importFromSupabaseOnce() {
  if (getSetting('supabase_imported')) return Promise.resolve()
  importing ??= (async () => {
    const hasLocal = (db().prepare('SELECT COUNT(*) AS n FROM rankings').get() as { n: number }).n > 0
    const sb = createServerClient()
    if (hasLocal || !sb) {
      setSetting('supabase_imported', hasLocal ? 'skipped:local-data' : 'skipped:no-supabase')
      return
    }
    try {
      const { data, error } = await sb
        .from('rankings')
        .select('period_label, period_start, period_end, source_file_name, status, published_at, created_at, ranking_entries(position, customer_name, phone_last_four, order_count, original_position, manually_edited)')
        .order('created_at', { ascending: true })
      if (error) throw error
      tx(() => {
        for (const r of data ?? []) {
          const { lastInsertRowid } = db().prepare(
            'INSERT INTO rankings (period_label, period_start, period_end, source_file_name, status, published_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ).run(r.period_label ?? '—', r.period_start, r.period_end, r.source_file_name, r.status, r.published_at, r.created_at ?? new Date().toISOString())
          for (const e of (r.ranking_entries ?? []) as Record<string, unknown>[]) {
            db().prepare(
              `INSERT INTO ranking_entries (ranking_id, position, customer_name, phone_last_four, order_count, original_position, manually_edited)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ).run(Number(lastInsertRowid), e.position as number, e.customer_name as string, (e.phone_last_four as string) ?? null,
              (e.order_count as number) ?? 0, (e.original_position as number) ?? null, e.manually_edited ? 1 : 0)
          }
        }
      })
      setSetting('supabase_imported', `ok:${(data ?? []).length}`)
    } catch (err) {
      // Sem rede/permissão: tenta de novo na próxima leitura.
      console.warn('[ranking] importação do Supabase falhou:', (err as Error).message)
    } finally {
      importing = null
    }
  })()
  return importing
}
