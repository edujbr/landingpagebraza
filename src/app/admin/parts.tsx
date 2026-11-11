'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Img, ImageRef, LibraryImage } from '@/lib/content-types'

// ---------- chamadas à API do painel ----------

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function api<T = Record<string, unknown>>(action: string, body?: unknown): Promise<T> {
  const init: RequestInit = body === undefined
    ? { method: 'GET' }
    : body instanceof FormData
      ? { method: 'POST', body }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  const res = await fetch(`/api/admin/${action}`, { ...init, cache: 'no-store' })
  const data = await res.json().catch(() => ({ ok: false, error: 'Resposta inválida do servidor.' }))
  if (!res.ok || !data.ok) throw new ApiError(data.error || 'Algo deu errado.', res.status)
  return data as T
}

export type Uploaded = { ref: ImageRef; img: Img }

export function uploadImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  return api<Uploaded & { ok: true }>('upload', form)
}

// ---------- aviso rápido no rodapé ----------

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)
  const timer = useRef(0)
  // Estável entre renders: o painel usa `show` em efeitos e não pode disparar recarga a cada render.
  const show = useCallback((msg: string, err = false) => {
    setToast({ msg, err })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), err ? 5000 : 2600)
  }, [])
  const node = toast && <div className={`toast${toast.err ? ' is-err' : ''}`} role="status">{toast.msg}</div>
  return { show, node }
}

// ---------- foto com botões de trocar ----------

type PhotoFieldProps = {
  value: ImageRef
  img?: Img
  label: string
  slot: string
  onChange: (ref: ImageRef, img: Img) => void
  onFocusSlot: (slot: string) => void
  onError: (msg: string) => void
  openLibrary: (pick: (item: LibraryImage) => void) => void
  ratio?: string
  children?: ReactNode
}

/** Miniatura da foto + "Enviar foto" + "Biblioteca". Clicar na miniatura mostra onde ela fica no site. */
export function PhotoField({ value, img, label, slot, onChange, onFocusSlot, onError, openLibrary, ratio = '4 / 3', children }: PhotoFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const up = await uploadImage(file)
      onChange(up.ref, up.img)
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="photo-field">
      <button
        type="button"
        className="thumb"
        style={{ aspectRatio: ratio }}
        onClick={() => onFocusSlot(slot)}
        title="Mostrar onde fica no site"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]) }}
      >
        {img && <img src={img.src} alt="" loading="lazy" />}
        <span className="thumb-label">{label}</span>
        <span className="thumb-where">👁 Ver no site</span>
        {busy && <span className="thumb-busy">Enviando…</span>}
      </button>
      <div className="photo-actions">
        <button type="button" className="btn btn-xs" disabled={busy} onClick={() => input.current?.click()}>Enviar foto</button>
        <button type="button" className="btn btn-ghost btn-xs" disabled={busy}
          onClick={() => openLibrary((it) => onChange(it.ref, it.img))}>Biblioteca</button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {children}
      <small className="ref" title={value}>{value.startsWith('upload:') ? 'Foto enviada pelo painel' : `Foto original: ${value.slice(7)}`}</small>
    </div>
  )
}

// ---------- biblioteca ----------

export function LibraryModal({ onPick, onClose, onError }: {
  onPick: (item: LibraryImage) => void
  onClose: () => void
  onError: (msg: string) => void
}) {
  const [items, setItems] = useState<LibraryImage[] | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
    api<{ items: LibraryImage[] }>('library').then((d) => setItems(d.items)).catch((e) => { onError(e.message); onClose() })
  }, [onClose, onError])

  return (
    <dialog ref={dialog} className="library" onClose={onClose} onClick={(e) => { if (e.target === dialog.current) onClose() }}>
      <header>
        <h2>Biblioteca de fotos</h2>
        <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>Fechar</button>
      </header>
      <p className="muted">Fotos já enviadas aparecem primeiro, depois as que vieram com o site.</p>
      {!items && <p className="muted">Carregando…</p>}
      <div className="library-grid">
        {items?.map((it) => (
          <button key={it.ref} type="button" onClick={() => { onPick(it); onClose() }} title={it.label}>
            <img src={it.img.src} alt="" loading="lazy" />
            <span>{it.uploaded ? '★ ' : ''}{it.label}</span>
          </button>
        ))}
      </div>
    </dialog>
  )
}

// ---------- pré-visualizador ----------

const DEVICES = {
  mobile: { w: 390, h: 800, label: 'Celular' },
  desktop: { w: 1366, h: 820, label: 'Computador' },
} as const
export type Device = keyof typeof DEVICES

/** O site de verdade num iframe, reduzido para caber no painel; recebe pedidos de "mostrar foto". */
export function Preview({ anchor, version, frameRef }: {
  anchor: string
  version: number
  frameRef: React.RefObject<HTMLIFrameElement | null>
}) {
  const [device, setDevice] = useState<Device>('mobile')
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const d = DEVICES[device]

  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / d.w))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [d.w])

  // Trocar de seção rola o preview até ela; e toda vez que o preview (re)carrega, ele avisa "pronto" e rola de novo.
  useEffect(() => {
    const go = () => frameRef.current?.contentWindow?.postMessage({ type: 'braza:scroll', anchor }, location.origin)
    go()
    const onReady = (e: MessageEvent) => {
      if (e.origin === location.origin && e.data?.type === 'braza:ready') window.setTimeout(go, 400)
    }
    window.addEventListener('message', onReady)
    return () => window.removeEventListener('message', onReady)
  }, [anchor, frameRef])

  return (
    <div className="preview">
      <div className="preview-bar">
        <strong>Pré-visualização</strong>
        <div className="seg">
          {(Object.keys(DEVICES) as Device[]).map((k) => (
            <button key={k} type="button" className={k === device ? 'on' : ''} onClick={() => setDevice(k)}>{DEVICES[k].label}</button>
          ))}
        </div>
      </div>
      <div className="preview-box" ref={box} style={{ height: d.h * scale }}>
        <iframe
          key={`${device}-${version}`}
          ref={frameRef}
          title="Pré-visualização do site"
          src={`/?preview=1&v=${version}#${anchor}`}
          style={{ width: d.w, height: d.h, transform: `scale(${scale})` }}
        />
      </div>
      <p className="muted small">Mostra o site publicado. Depois de salvar, ele recarrega sozinho com as mudanças.</p>
    </div>
  )
}

/** Botões de mover/remover de um item de lista. */
export function ItemTools({ index, count, min, onMove, onRemove }: {
  index: number
  count: number
  min: number
  onMove: (to: number) => void
  onRemove: () => void
}) {
  return (
    <div className="item-tools">
      <button type="button" className="icon" title="Mover para trás" disabled={index === 0} onClick={() => onMove(index - 1)}>↑</button>
      <button type="button" className="icon" title="Mover para frente" disabled={index === count - 1} onClick={() => onMove(index + 1)}>↓</button>
      <button type="button" className="icon danger" title="Remover" disabled={count <= min} onClick={onRemove}>✕</button>
    </div>
  )
}

export const move = <T,>(arr: T[], from: number, to: number) => {
  const next = [...arr]
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}
