'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import logo from '@/assets/logo.jpeg'
import type { Img, ImageRef, LibraryImage, SectionKey, SiteContent } from '@/lib/content-types'
import { ApiError, LibraryModal, Preview, api, useToast } from './parts'
import { RankingAdmin } from './RankingAdmin'
import {
  GalleryEditor, HeroEditor, RankingBackdropEditor, ReelEditor, SignaturesEditor, StoriesEditor, type EditorProps,
} from './sections'

type State = { content: SiteContent; images: Record<ImageRef, Img> }
type TabKey = SectionKey | 'password'

const TABS: { key: TabKey; label: string; anchor: string; where: string; icon: string }[] = [
  { key: 'hero', label: 'Início', anchor: 'inicio', icon: '🔥', where: 'Foto grande do topo, atrás do título BRAZA FORTE.' },
  { key: 'stories', label: 'Atalhos', anchor: 'atalhos', icon: '◎', where: 'Os círculos de "Onde você quer ir?" logo abaixo do topo.' },
  { key: 'reel', label: 'Faixa de fotos', anchor: 'fotos', icon: '🎞', where: 'A faixa que corre sozinha na horizontal, antes de "Os que fazem fila".' },
  { key: 'signatures', label: 'Os que fazem fila', anchor: 'assinaturas', icon: '🍔', where: 'Os cards dos lanches da casa: foto, nome e descrição.' },
  { key: 'rankingBackdrop', label: 'Ranking', anchor: 'ranking', icon: '🏆', where: 'Pódio dos clientes que mais pediram e a foto de fundo da seção.' },
  { key: 'gallery', label: 'Galeria', anchor: 'galeria', icon: '▦', where: 'O mosaico "Mesa cheia, casa quente".' },
  { key: 'password', label: 'Senha', anchor: 'inicio', icon: '🔑', where: 'Senha de acesso a este painel.' },
]

const EDITORS: { [K in SectionKey]: (p: EditorProps<K>) => ReactNode } = {
  hero: HeroEditor,
  stories: StoriesEditor,
  reel: ReelEditor,
  signatures: SignaturesEditor,
  gallery: GalleryEditor,
  rankingBackdrop: RankingBackdropEditor,
}

export default function AdminPage() {
  const [auth, setAuth] = useState<'loading' | 'out' | 'in'>('loading')
  const [saved, setSaved] = useState<State | null>(null)
  const [draft, setDraft] = useState<SiteContent | null>(null)
  const [images, setImages] = useState<Record<ImageRef, Img>>({})
  const [tab, setTab] = useState<TabKey>('hero')
  const [saving, setSaving] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(1)
  const [library, setLibrary] = useState<((item: LibraryImage) => void) | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const toast = useToast()
  const notify = toast.show

  const apply = (s: State) => {
    setSaved(s)
    setDraft(structuredClone(s.content))
    setImages((prev) => ({ ...prev, ...s.images }))
  }

  const load = useCallback(async () => {
    try {
      apply(await api<State>('state'))
      setAuth('in')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuth('out')
      else notify((err as Error).message, true)
    }
  }, [notify])

  // Carrega uma vez ao abrir (e de novo só depois do login).
  useEffect(() => { load() }, [load])

  const handleError = useCallback((msg: string) => notify(msg, true), [notify])
  const onApiError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) setAuth('out')
    notify((err as Error).message, true)
  }

  const current = TABS.find((t) => t.key === tab)!
  const section = tab === 'password' ? null : tab
  const dirty = Boolean(section && saved && draft && JSON.stringify(saved.content[section]) !== JSON.stringify(draft[section]))
  const anyDirty = Boolean(saved && draft && JSON.stringify(saved.content) !== JSON.stringify(draft))

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!anyDirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [anyDirty])

  const goTab = (k: TabKey) => {
    if (dirty && !confirm('Você tem alterações não salvas nesta seção. Sair mesmo assim? (elas ficam guardadas até você recarregar a página)')) return
    setTab(k)
  }

  const focusSlot = (slot: string) => frame.current?.contentWindow?.postMessage({ type: 'braza:focus', slot }, location.origin)
  const reloadPreview = () => setPreviewVersion((v) => v + 1)

  const save = async () => {
    if (!section || !draft) return
    setSaving(true)
    try {
      apply(await api<State>('save', { section, value: draft[section] }))
      notify('Salvo e publicado no site!')
      reloadPreview()
    } catch (err) {
      onApiError(err)
    } finally {
      setSaving(false)
    }
  }

  const discard = () => section && saved && setDraft((d) => d && { ...d, [section]: structuredClone(saved.content[section]) })

  const reset = async () => {
    if (!section || !confirm(`Voltar "${current.label}" para as fotos e textos originais do site?`)) return
    try {
      apply(await api<State>('reset', { section }))
      notify('Seção voltou ao original.')
      reloadPreview()
    } catch (err) {
      onApiError(err)
    }
  }

  const logout = async () => {
    await api('logout', {}).catch(() => {})
    setAuth('out')
  }

  if (auth === 'loading') return <div className="wrap"><p className="muted">Carregando painel…</p></div>
  if (auth === 'out') return <Login onIn={load} />

  const editorProps = section && draft && {
    value: draft[section],
    onChange: (v: unknown) => setDraft((d) => d && { ...d, [section]: v }),
    images,
    addImage: (ref: ImageRef, img: Img) => setImages((m) => ({ ...m, [ref]: img })),
    focusSlot,
    onError: handleError,
    openLibrary: (pick: (item: LibraryImage) => void) => setLibrary(() => pick),
  }
  const Editor = section ? (EDITORS[section] as (p: NonNullable<typeof editorProps>) => ReactNode) : null

  return (
    <div className="shell-admin">
      <header className="top">
        <div className="brand">
          <Image src={logo} alt="" width={40} height={40} />
          <div><small>Painel</small><h1>BRAZA FORTE</h1></div>
        </div>
        <div className="actions tight">
          <a className="btn btn-ghost btn-xs" href="/" target="_blank" rel="noopener">Ver site ↗</a>
          <button className="btn btn-ghost btn-xs" type="button" onClick={logout}>Sair</button>
        </div>
      </header>

      <nav className="tabs" aria-label="Seções do site">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={t.key === tab ? 'on' : ''} onClick={() => goTab(t.key)}>
            <span aria-hidden="true">{t.icon}</span>{t.label}
            {t.key !== 'password' && saved && draft && JSON.stringify(saved.content[t.key as SectionKey]) !== JSON.stringify(draft[t.key as SectionKey]) && <i className="dot" title="Não salvo" />}
          </button>
        ))}
      </nav>

      <div className={`layout${section ? '' : ' single'}`}>
        <main className="editor">
          <div className="editor-head">
            <h2>{current.label}</h2>
            <p className="muted">{current.where}</p>
          </div>

          {Editor && editorProps && <Editor {...editorProps} />}
          {tab === 'rankingBackdrop' && <RankingAdmin notify={notify} onChanged={reloadPreview} />}
          {tab === 'password' && <PasswordForm notify={notify} onExpired={() => setAuth('out')} />}

          {section && (
            <div className={`savebar${dirty ? ' is-dirty' : ''}`}>
              <span>{dirty ? '● Alterações não salvas' : '✓ Tudo salvo'}</span>
              <div className="actions tight">
                <button type="button" className="btn btn-ghost btn-xs" onClick={reset}>Voltar ao original</button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={discard} disabled={!dirty}>Descartar</button>
                <button type="button" className="btn" onClick={save} disabled={!dirty || saving}>{saving ? 'Salvando…' : 'Salvar e publicar'}</button>
              </div>
            </div>
          )}
        </main>

        {section && <aside><Preview anchor={current.anchor} version={previewVersion} frameRef={frame} /></aside>}
      </div>

      {library && <LibraryModal onPick={library} onClose={() => setLibrary(null)} onError={handleError} />}
      {toast.node}
    </div>
  )
}

function Login({ onIn }: { onIn: () => void }) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await api('login', { password: new FormData(e.currentTarget).get('password') })
      onIn()
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login">
      <Image src={logo} alt="" width={84} height={84} />
      <h1>Painel BRAZA FORTE</h1>
      <form onSubmit={submit}>
        <label className="field"><span>Senha</span>
          <input type="password" name="password" autoComplete="current-password" autoFocus required />
        </label>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        {msg && <p className="status err">{msg}</p>}
      </form>
    </div>
  )
}

function PasswordForm({ notify, onExpired }: { notify: (m: string, err?: boolean) => void; onExpired: () => void }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    if (f.get('next') !== f.get('confirm')) return notify('A confirmação não bate com a nova senha.', true)
    setBusy(true)
    try {
      await api('password', { current: f.get('current'), next: f.get('next') })
      form.reset()
      notify('Senha trocada! Outros aparelhos conectados foram desconectados.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onExpired()
      notify((err as Error).message, true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="sub-card narrow" onSubmit={submit}>
      <label className="field"><span>Senha atual</span><input type="password" name="current" autoComplete="current-password" required /></label>
      <label className="field"><span>Nova senha (mínimo 8 caracteres)</span><input type="password" name="next" minLength={8} autoComplete="new-password" required /></label>
      <label className="field"><span>Repita a nova senha</span><input type="password" name="confirm" minLength={8} autoComplete="new-password" required /></label>
      <div className="actions"><button className="btn" type="submit" disabled={busy}>{busy ? 'Trocando…' : 'Trocar senha'}</button></div>
    </form>
  )
}
