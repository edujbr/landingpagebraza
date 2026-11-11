'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parseCustomersCsv } from '@/lib/csv'
import { TOP_N, type RankingDraft, type RankingRow } from '@/lib/ranking'
import { api } from './parts'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const STATUS_LABEL: Record<string, string> = { published: 'No site', archived: 'Arquivado', draft: 'Rascunho' }
const pad = (n: number) => String(n).padStart(2, '0')

type Entry = RankingDraft['entries'][number]
const blank = (): Entry => ({ name: '', phone: '', orders: 0, originalPosition: null, edited: true })

function periodFromMonth(value: string): RankingDraft['period'] {
  const [y, m] = value.split('-').map(Number)
  if (!y || !m) throw new Error('Escolha o mês do ranking.')
  return { label: `${MONTHS[m - 1]}/${y}`, start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}` }
}

export function RankingAdmin({ notify, onChanged }: { notify: (msg: string, err?: boolean) => void; onChanged: () => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` })
  const [draft, setDraft] = useState<RankingDraft | null>(null)
  const [csvMsg, setCsvMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<RankingRow[] | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    api<{ items: RankingRow[] }>('rankings').then((d) => setHistory(d.items)).catch((e) => notify(e.message, true))
  }, [notify])
  useEffect(load, [load])

  const fromCsv = async () => {
    const f = file.current?.files?.[0]
    if (!f) return notify('Selecione o arquivo CSV.', true)
    try {
      const { customers, aggregated } = parseCustomersCsv(await f.text())
      if (!customers.length) throw new Error('Nenhum cliente com pedidos encontrado.')
      setDraft({
        period: periodFromMonth(month),
        sourceFileName: f.name,
        entries: customers.slice(0, TOP_N).map((c, i) => ({ name: c.name, phone: c.phone.slice(-4), orders: c.orders, originalPosition: i + 1, edited: false })),
      })
      setCsvMsg(`${customers.length} clientes lidos${aggregated ? ' (pedidos somados por cliente)' : ''}. Confira o TOP ${TOP_N} abaixo.`)
    } catch (err) {
      notify((err as Error).message, true)
    }
  }

  const manual = () => {
    try {
      setDraft({ period: periodFromMonth(month), sourceFileName: null, entries: [blank()] })
      setCsvMsg('')
    } catch (err) {
      notify((err as Error).message, true)
    }
  }

  const update = (i: number, patch: Partial<Entry>) =>
    setDraft((d) => d && { ...d, entries: d.entries.map((e, j) => (j === i ? { ...e, ...patch, edited: true } : e)) })

  const publish = async () => {
    if (!draft) return
    if (!confirm(`Publicar o ranking de ${draft.period.label}? O ranking atual sai do site.`)) return
    setBusy(true)
    try {
      await api('ranking-create', draft)
      notify('Ranking publicado!')
      setDraft(null)
      setCsvMsg('')
      if (file.current) file.current.value = ''
      load()
      onChanged()
    } catch (err) {
      notify((err as Error).message, true)
    } finally {
      setBusy(false)
    }
  }

  const act = async (action: 'ranking-publish' | 'ranking-delete', row: RankingRow) => {
    const q = action === 'ranking-publish'
      ? `Colocar "${row.period_label}" no site? O atual será arquivado.`
      : row.status === 'published' ? `"${row.period_label}" está no site e vai sumir de lá. Excluir mesmo assim?` : `Excluir "${row.period_label}"?`
    if (!confirm(q)) return
    try {
      await api(action, { id: row.id })
      notify(action === 'ranking-publish' ? 'Ranking publicado!' : 'Ranking excluído')
      load()
      onChanged()
    } catch (err) {
      notify((err as Error).message, true)
    }
  }

  return (
    <>
      <div className="sub-card">
        <h3>Novo ranking</h3>
        <p className="muted small">
          Exporte o relatório de clientes do Brendi em CSV (nome, telefone e quantidade de pedidos). Se for uma lista de pedidos,
          os pedidos de cada cliente são somados. Ou monte na mão.
        </p>
        <div className="row">
          <label className="field"><span>Arquivo CSV</span><input type="file" accept=".csv,text/csv" ref={file} /></label>
          <label className="field"><span>Mês do ranking</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={fromCsv}>Ler CSV</button>
          <button className="btn btn-ghost" type="button" onClick={manual}>Montar manualmente</button>
        </div>
        {csvMsg && <p className="status ok">{csvMsg}</p>}
      </div>

      {draft && (
        <div className="sub-card">
          <h3>TOP {TOP_N} de {draft.period.label}</h3>
          <div className="scroll">
            <table>
              <thead><tr><th>#</th><th>Cliente</th><th>Pedidos</th><th>Final do tel.</th><th /></tr></thead>
              <tbody>
                {draft.entries.map((e, i) => (
                  <tr key={i}>
                    <td className="pos">{i + 1}º</td>
                    <td><input value={e.name} aria-label={`Nome ${i + 1}`} onChange={(ev) => update(i, { name: ev.target.value })} /></td>
                    <td style={{ width: 100 }}><input type="number" min={0} value={e.orders} aria-label={`Pedidos ${i + 1}`}
                      onChange={(ev) => update(i, { orders: parseInt(ev.target.value, 10) || 0 })} /></td>
                    <td style={{ width: 110 }}><input inputMode="numeric" maxLength={4} value={e.phone} aria-label={`Final do telefone ${i + 1}`}
                      onChange={(ev) => update(i, { phone: ev.target.value.replace(/\D/g, '').slice(0, 4) })} /></td>
                    <td style={{ width: 60 }}><button className="icon danger" type="button" title="Tirar"
                      onClick={() => setDraft({ ...draft, entries: draft.entries.filter((_, j) => j !== i) })}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-xs" type="button" disabled={draft.entries.length >= TOP_N}
              onClick={() => setDraft({ ...draft, entries: [...draft.entries, blank()] })}>+ Cliente</button>
            <button className="btn btn-ghost btn-xs" type="button"
              onClick={() => setDraft({ ...draft, entries: [...draft.entries].sort((a, b) => b.orders - a.orders) })}>Ordenar por pedidos</button>
          </div>
          <div className="actions">
            <button className="btn" type="button" onClick={publish} disabled={busy}>{busy ? 'Publicando…' : 'Publicar no site'}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="sub-card">
        <h3>Histórico</h3>
        <p className="muted small">Só o ranking marcado "No site" aparece. Publicar outro arquiva o atual.</p>
        <div className="scroll">
          <table>
            <thead><tr><th>Período</th><th>Status</th><th>Publicado em</th><th /></tr></thead>
            <tbody>
              {history === null && <tr><td colSpan={4} className="muted">Carregando…</td></tr>}
              {history?.length === 0 && <tr><td colSpan={4} className="muted">Nenhum ranking ainda.</td></tr>}
              {history?.map((r) => (
                <RowItem key={r.id} row={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)}
                  onPublish={() => act('ranking-publish', r)} onDelete={() => act('ranking-delete', r)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function RowItem({ row, open, onToggle, onPublish, onDelete }: {
  row: RankingRow; open: boolean; onToggle: () => void; onPublish: () => void; onDelete: () => void
}) {
  const when = row.published_at ? new Date(row.published_at.replace(' ', 'T') + (row.published_at.includes('Z') || row.published_at.includes('+') ? '' : 'Z')) : null
  return (
    <>
      <tr>
        <td>{row.period_label}</td>
        <td><span className={`tag ${row.status}`}>{STATUS_LABEL[row.status] ?? row.status}</span></td>
        <td>{when && !isNaN(+when) ? when.toLocaleString('pt-BR') : '—'}</td>
        <td className="right">
          <button className="btn btn-ghost btn-xs" type="button" onClick={onToggle}>{open ? 'Fechar' : 'Ver'}</button>
          {row.status !== 'published' && <button className="btn btn-ghost btn-xs" type="button" onClick={onPublish}>Publicar</button>}
          <button className="btn btn-danger btn-xs" type="button" onClick={onDelete}>Excluir</button>
        </td>
      </tr>
      {open && (
        <tr className="detail"><td colSpan={4}>
          {row.entries.length === 0 && 'Sem clientes.'}
          {row.entries.map((e) => (
            <div key={e.position}>{e.position}º {e.customer_name} — {e.order_count} pedidos{e.phone_last_four ? ` (final ${e.phone_last_four})` : ''}</div>
          ))}
        </td></tr>
      )}
    </>
  )
}
