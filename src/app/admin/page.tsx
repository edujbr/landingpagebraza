'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import logo from '@/assets/logo.jpeg'
import { parseCustomersCsv } from '@/lib/csv'
import { TOP_N } from '@/lib/ranking'
import { getBrowserClient } from '@/lib/supabase'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const STATUS_LABEL: Record<string, string> = { published: 'No site', archived: 'Arquivado', draft: 'Rascunho' }

type Status = { msg: string; kind?: 'ok' | 'err' }
type Period = { label: string; start: string; end: string }
type DraftEntry = { name: string; phone: string; orders: number; originalPosition: number | null; edited: boolean }
type Draft = { period: Period; sourceFileName: string | null; entries: DraftEntry[] }
type HistoryRow = {
  id: number
  period_label: string | null
  status: string
  published_at: string | null
  ranking_entries: { position: number; customer_name: string; phone_last_four: string | null; order_count: number }[]
}

const pad = (n: number) => String(n).padStart(2, '0')

function periodFromMonth(value: string): Period {
  const [y, m] = value.split('-').map(Number)
  if (!y || !m) throw new Error('Escolha o mês do ranking.')
  const lastDay = new Date(y, m, 0).getDate()
  return { label: `${MONTHS[m - 1]}/${y}`, start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(lastDay)}` }
}

function StatusLine({ status }: { status: Status }) {
  if (!status.msg) return null
  return <p className={`status ${status.kind ?? ''}`}>{status.msg}</p>
}

export default function AdminPage() {
  const sb = getBrowserClient()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [loginStatus, setLoginStatus] = useState<Status>({ msg: '' })
  const [csvStatus, setCsvStatus] = useState<Status>({ msg: '' })
  const [publishStatus, setPublishStatus] = useState<Status>({ msg: '' })
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [history, setHistory] = useState<HistoryRow[] | null>(null)
  const [historyError, setHistoryError] = useState('')
  const [openDetail, setOpenDetail] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [sb])

  const loadHistory = useCallback(async () => {
    const { data, error } = await sb
      .from('rankings')
      .select('id, period_label, status, published_at, ranking_entries(position, customer_name, phone_last_four, order_count)')
      .order('created_at', { ascending: false })
    if (error) { setHistoryError(error.message); setHistory([]); return }
    setHistoryError('')
    setHistory(data as HistoryRow[])
  }, [sb])

  useEffect(() => { if (session) loadHistory() }, [session, loadHistory])

  const refreshSite = async () => {
    const token = (await sb.auth.getSession()).data.session?.access_token
    if (!token) return
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setLoginStatus({ msg: 'Entrando...' })
    const { error } = await sb.auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    })
    setLoginStatus(error ? { msg: 'E-mail ou senha inválidos.', kind: 'err' } : { msg: '' })
  }

  const processCsv = async () => {
    const file = fileInput.current?.files?.[0]
    if (!file) return setCsvStatus({ msg: 'Selecione um arquivo CSV.', kind: 'err' })
    try {
      const period = periodFromMonth(month)
      const { customers, aggregated } = parseCustomersCsv(await file.text())
      if (!customers.length) throw new Error('Nenhum cliente com pedidos encontrado.')
      setDraft({
        period,
        sourceFileName: file.name,
        entries: customers.slice(0, TOP_N).map((c, i) => ({
          name: c.name, phone: c.phone.slice(-4), orders: c.orders, originalPosition: i + 1, edited: false,
        })),
      })
      setCsvStatus({
        msg: `${customers.length} clientes lidos${aggregated ? ' (pedidos somados por cliente)' : ''}. Confira o TOP ${TOP_N} abaixo.`,
        kind: 'ok',
      })
      setPublishStatus({ msg: '' })
    } catch (err) {
      setCsvStatus({ msg: (err as Error).message, kind: 'err' })
    }
  }

  const startManual = () => {
    try {
      setDraft({ period: periodFromMonth(month), sourceFileName: null, entries: [{ name: '', phone: '', orders: 0, originalPosition: null, edited: true }] })
      setCsvStatus({ msg: '' })
    } catch (err) {
      setCsvStatus({ msg: (err as Error).message, kind: 'err' })
    }
  }

  const updateEntry = (i: number, patch: Partial<DraftEntry>) =>
    setDraft((d) => d && { ...d, entries: d.entries.map((e, j) => (j === i ? { ...e, ...patch, edited: true } : e)) })

  const removeEntry = (i: number) => setDraft((d) => d && { ...d, entries: d.entries.filter((_, j) => j !== i) })

  const addEntry = () =>
    setDraft((d) => d && d.entries.length < TOP_N
      ? { ...d, entries: [...d.entries, { name: '', phone: '', orders: 0, originalPosition: null, edited: true }] }
      : d)

  const sortEntries = () => setDraft((d) => d && { ...d, entries: [...d.entries].sort((a, b) => b.orders - a.orders) })

  const cancelDraft = () => {
    setDraft(null)
    setCsvStatus({ msg: '' })
    setPublishStatus({ msg: '' })
    if (fileInput.current) fileInput.current.value = ''
  }

  const setPublished = async (id: number) => {
    const { error: aErr } = await sb.from('rankings').update({ status: 'archived' }).eq('status', 'published')
    if (aErr) throw aErr
    const { error: pErr } = await sb.from('rankings').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id)
    if (pErr) throw pErr
    await refreshSite()
  }

  const publish = async () => {
    if (!draft) return
    const entries = draft.entries.map((e) => ({ ...e, name: e.name.trim() })).filter((e) => e.name)
    if (!entries.length) return setPublishStatus({ msg: 'Adicione pelo menos um cliente com nome.', kind: 'err' })
    if (!confirm(`Publicar o ranking de ${draft.period.label}? O ranking atual sai do site.`)) return

    setPublishing(true)
    setPublishStatus({ msg: 'Publicando...' })
    try {
      const { data: ranking, error: rErr } = await sb.from('rankings').insert({
        period_label: draft.period.label,
        period_start: draft.period.start,
        period_end: draft.period.end,
        source_file_name: draft.sourceFileName,
        status: 'draft',
      }).select('id').single()
      if (rErr) throw rErr

      const { error: eErr } = await sb.from('ranking_entries').insert(entries.map((e, i) => ({
        ranking_id: ranking.id,
        position: i + 1,
        customer_name: e.name,
        phone_last_four: e.phone || null,
        order_count: e.orders,
        original_position: e.originalPosition,
        manually_edited: e.edited,
      })))
      if (eErr) {
        await sb.from('rankings').delete().eq('id', ranking.id)
        throw eErr
      }

      await setPublished(ranking.id)
      notify('Ranking publicado!')
      cancelDraft()
      loadHistory()
    } catch (err) {
      setPublishStatus({ msg: `Erro ao publicar: ${(err as Error).message}`, kind: 'err' })
    } finally {
      setPublishing(false)
    }
  }

  const republish = async (row: HistoryRow) => {
    if (!confirm(`Colocar "${row.period_label}" no site? O atual será arquivado.`)) return
    try {
      await setPublished(row.id)
      notify('Ranking publicado!')
    } catch (err) {
      notify(`Erro: ${(err as Error).message}`)
    }
    loadHistory()
  }

  const remove = async (row: HistoryRow) => {
    const msg = row.status === 'published'
      ? `"${row.period_label}" está no site e vai sumir de lá. Excluir mesmo assim?`
      : `Excluir o ranking "${row.period_label}"?`
    if (!confirm(msg)) return
    const { error } = await sb.from('rankings').delete().eq('id', row.id)
    if (!error && row.status === 'published') await refreshSite()
    notify(error ? `Erro: ${error.message}` : 'Ranking excluído')
    loadHistory()
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <Image src={logo} alt="" width={46} height={46} />
          <div><small>Painel</small><h1>BRAZA FORTE</h1></div>
        </div>
        <div className="actions" style={{ margin: 0 }}>
          <a className="btn btn-ghost btn-xs" href="/" target="_blank" rel="noopener">Ver site</a>
          {session && <button className="btn btn-ghost btn-xs" type="button" onClick={() => sb.auth.signOut()}>Sair</button>}
        </div>
      </header>

      {ready && !session && (
        <section className="card login">
          <h2>Entrar</h2>
          <p className="muted">Use o usuário administrador criado no Supabase.</p>
          <form onSubmit={login}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" autoComplete="username" required />
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" name="password" autoComplete="current-password" required />
            <div className="actions"><button className="btn" type="submit">Entrar</button></div>
            <StatusLine status={loginStatus} />
          </form>
        </section>
      )}

      {session && (
        <>
          <section className="card">
            <h2>Novo ranking</h2>
            <p className="muted">
              Exporte o relatório de clientes do Brendi em CSV. O painel reconhece colunas de nome, telefone e quantidade de
              pedidos. Se o arquivo for uma lista de pedidos (uma linha por pedido), os pedidos de cada cliente são somados.
            </p>
            <div className="row">
              <div>
                <label htmlFor="csvFile">Arquivo CSV</label>
                <input type="file" id="csvFile" accept=".csv,text/csv" ref={fileInput} />
              </div>
              <div>
                <label htmlFor="periodMonth">Mês do ranking</label>
                <input type="month" id="periodMonth" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
            </div>
            <div className="actions">
              <button className="btn" type="button" onClick={processCsv}>Processar CSV</button>
              <button className="btn btn-ghost" type="button" onClick={startManual}>Montar manualmente</button>
            </div>
            <StatusLine status={csvStatus} />
          </section>

          {draft && (
            <section className="card">
              <h2>Pré-visualização do TOP {TOP_N}</h2>
              <p className="muted">
                Período: {draft.period.label}{draft.sourceFileName ? ` · arquivo ${draft.sourceFileName}` : ''}
              </p>
              <div className="scroll">
                <table>
                  <thead><tr><th>#</th><th>Cliente</th><th>Pedidos</th><th>Final do telefone</th><th /></tr></thead>
                  <tbody>
                    {draft.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="pos">{i + 1}º</td>
                        <td><input value={e.name} aria-label={`Nome do cliente ${i + 1}`} onChange={(ev) => updateEntry(i, { name: ev.target.value })} /></td>
                        <td style={{ width: 110 }}>
                          <input type="number" min={0} value={e.orders} aria-label={`Pedidos do cliente ${i + 1}`}
                            onChange={(ev) => updateEntry(i, { orders: parseInt(ev.target.value, 10) || 0 })} />
                        </td>
                        <td style={{ width: 130 }}>
                          <input inputMode="numeric" maxLength={4} value={e.phone} aria-label={`Final do telefone ${i + 1}`}
                            onChange={(ev) => updateEntry(i, { phone: ev.target.value.replace(/\D/g, '').slice(0, 4) })} />
                        </td>
                        <td style={{ width: 80 }}>
                          <button className="btn btn-danger btn-xs" type="button" onClick={() => removeEntry(i)}>Tirar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions">
                <button className="btn btn-ghost btn-xs" type="button" onClick={addEntry} disabled={draft.entries.length >= TOP_N}>+ Adicionar cliente</button>
                <button className="btn btn-ghost btn-xs" type="button" onClick={sortEntries}>Reordenar por pedidos</button>
              </div>
              <div className="actions">
                <button className="btn" type="button" onClick={publish} disabled={publishing}>Publicar no site</button>
                <button className="btn btn-ghost" type="button" onClick={cancelDraft}>Cancelar</button>
              </div>
              <StatusLine status={publishStatus} />
            </section>
          )}

          <section className="card">
            <h2>Histórico</h2>
            <p className="muted">Só o ranking publicado aparece no site. Publicar um novo arquiva o anterior.</p>
            <div className="scroll">
              <table>
                <thead><tr><th>Período</th><th>Status</th><th>Publicado em</th><th /></tr></thead>
                <tbody>
                  {history === null && <tr><td colSpan={4} className="muted">Carregando...</td></tr>}
                  {historyError && (
                    <tr><td colSpan={4} className="status err">
                      Erro ao carregar: {historyError}. Confira se o SQL de migration_rankings.sql foi executado no Supabase.
                    </td></tr>
                  )}
                  {history?.length === 0 && !historyError && <tr><td colSpan={4} className="muted">Nenhum ranking ainda.</td></tr>}
                  {history?.map((r) => (
                    <HistoryItem
                      key={r.id}
                      row={r}
                      open={openDetail === r.id}
                      onToggle={() => setOpenDetail(openDetail === r.id ? null : r.id)}
                      onPublish={() => republish(r)}
                      onDelete={() => remove(r)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function HistoryItem({ row, open, onToggle, onPublish, onDelete }: {
  row: HistoryRow
  open: boolean
  onToggle: () => void
  onPublish: () => void
  onDelete: () => void
}) {
  const entries = [...(row.ranking_entries ?? [])].sort((a, b) => a.position - b.position)
  return (
    <>
      <tr>
        <td>{row.period_label || '—'}</td>
        <td><span className={`tag ${row.status}`}>{STATUS_LABEL[row.status] ?? row.status}</span></td>
        <td>{row.published_at ? new Date(row.published_at).toLocaleString('pt-BR') : '—'}</td>
        <td className="right">
          <button className="btn btn-ghost btn-xs" type="button" onClick={onToggle}>{open ? 'Fechar' : 'Ver'}</button>
          {row.status !== 'published' && <button className="btn btn-ghost btn-xs" type="button" onClick={onPublish}>Publicar</button>}
          <button className="btn btn-danger btn-xs" type="button" onClick={onDelete}>Excluir</button>
        </td>
      </tr>
      {open && (
        <tr className="detail">
          <td colSpan={4}>
            {entries.length === 0 && 'Sem clientes.'}
            {entries.map((e) => (
              <div key={e.position}>
                {e.position}º {e.customer_name} — {e.order_count} pedidos{e.phone_last_four ? ` (final ${e.phone_last_four})` : ''}
              </div>
            ))}
          </td>
        </tr>
      )}
    </>
  )
}
