'use client'

import type { Img, ImageRef, LibraryImage, PhotoItem, SignatureItem, SiteContent, StoryItem } from '@/lib/content-types'
import { LIMITS } from '@/lib/content-types'
import { whatsappUrl } from '@/lib/store'
import { ItemTools, PhotoField, move } from './parts'

/** O que todo editor recebe do painel. */
export type EditorProps<K extends keyof SiteContent> = {
  value: SiteContent[K]
  onChange: (v: SiteContent[K]) => void
  images: Record<ImageRef, Img>
  addImage: (ref: ImageRef, img: Img) => void
  focusSlot: (slot: string) => void
  onError: (msg: string) => void
  openLibrary: (pick: (item: LibraryImage) => void) => void
}

type Common = Omit<EditorProps<'hero'>, 'value' | 'onChange'>

function photoProps(p: Common, ref: ImageRef, slot: string, label: string, set: (ref: ImageRef) => void) {
  return {
    value: ref,
    img: p.images[ref],
    label,
    slot,
    onFocusSlot: p.focusSlot,
    onError: p.onError,
    openLibrary: p.openLibrary,
    onChange: (r: ImageRef, img: Img) => { p.addImage(r, img); set(r) },
  }
}

function Field({ label, value, onChange, max, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; max: number; multiline?: boolean; placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label} <em>{value.length}/{max}</em></span>
      {multiline
        ? <textarea value={value} maxLength={max} rows={3} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  )
}

// ---------- Início ----------

export function HeroEditor({ value, onChange, ...p }: EditorProps<'hero'>) {
  return (
    <div className="grid-1">
      <PhotoField {...photoProps(p, value.image, 'hero', 'Foto principal', (image) => onChange({ ...value, image }))} ratio="3 / 4">
        <Field label="Descrição da foto (acessibilidade e Google)" value={value.alt} max={160}
          onChange={(alt) => onChange({ ...value, alt })} />
      </PhotoField>
      <p className="muted small">Dica: use uma foto vertical, com o lanche bem no centro. No celular ela ocupa a tela inteira atrás do título.</p>
    </div>
  )
}

// ---------- Atalhos (stories) ----------

export function StoriesEditor({ value, onChange, ...p }: EditorProps<'stories'>) {
  const set = (i: number, patch: Partial<StoryItem>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="grid-cards">
      {value.map((s, i) => (
        <div key={i} className="item-card">
          <PhotoField {...photoProps(p, s.image, `stories.${i}`, `Atalho ${i + 1}`, (image) => set(i, { image }))} ratio="1 / 1">
            <Field label="Título" value={s.label} max={24} onChange={(label) => set(i, { label })} />
            <Field label="Subtítulo" value={s.hint} max={40} onChange={(hint) => set(i, { hint })} />
          </PhotoField>
          <small className="muted">Abre: {s.link ?? s.href}</small>
        </div>
      ))}
    </div>
  )
}

// ---------- Listas de fotos (faixa e galeria) ----------

function PhotoListEditor({ value, onChange, slot, min, max, ratio, ...p }: EditorProps<'gallery'> & {
  slot: 'reel' | 'gallery'; min: number; max: number; ratio: string
}) {
  const set = (i: number, patch: Partial<PhotoItem>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const add = () => p.openLibrary((it) => { p.addImage(it.ref, it.img); onChange([...value, { image: it.ref, alt: '' }]) })
  return (
    <>
      <div className="grid-cards">
        {value.map((s, i) => (
          <div key={`${s.image}-${i}`} className="item-card">
            <ItemTools index={i} count={value.length} min={min}
              onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
            <PhotoField {...photoProps(p, s.image, `${slot}.${i}`, `Foto ${i + 1}`, (image) => set(i, { image }))} ratio={ratio}>
              <Field label="Descrição" value={s.alt} max={160} placeholder="Ex.: Burger com bacon na tábua"
                onChange={(alt) => set(i, { alt })} />
            </PhotoField>
          </div>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={add} disabled={value.length >= max}>+ Adicionar foto</button>
        <span className="muted small">{value.length} de no máximo {max} fotos</span>
      </div>
    </>
  )
}

export function ReelEditor(props: EditorProps<'reel'>) {
  return <PhotoListEditor {...props} slot="reel" min={LIMITS.reel.min} max={LIMITS.reel.max} ratio="3 / 4" />
}

export function GalleryEditor(props: EditorProps<'gallery'>) {
  return (
    <>
      <p className="muted small">No computador as fotos se distribuem em 4 colunas (1ª, 5ª, 9ª… na primeira coluna). A ordem aqui é a ordem no site.</p>
      <PhotoListEditor {...props} slot="gallery" min={LIMITS.gallery.min} max={LIMITS.gallery.max} ratio="1 / 1" />
    </>
  )
}

// ---------- Os que fazem fila ----------

const blankSignature = (image: ImageRef): SignatureItem => ({ name: '', tag: '', seal: '', description: '', image, alt: '' })

export function SignaturesEditor({ value, onChange, ...p }: EditorProps<'signatures'>) {
  const set = (i: number, patch: Partial<SignatureItem>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const add = () => p.openLibrary((it) => { p.addImage(it.ref, it.img); onChange([...value, blankSignature(it.ref)]) })
  return (
    <>
      <div className="sig-list">
        {value.map((s, i) => (
          <div key={i} className="item-card sig-item">
            <ItemTools index={i} count={value.length} min={LIMITS.signatures.min}
              onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
            <PhotoField {...photoProps(p, s.image, `signatures.${i}`, s.name || `Lanche ${i + 1}`, (image) => set(i, { image }))} ratio="4 / 5" />
            <div className="sig-fields">
              <Field label="Nome do lanche" value={s.name} max={40} onChange={(name) => set(i, { name })} />
              <Field label="Etiqueta (acima do nome)" value={s.tag} max={40} placeholder="Ex.: O mais pedido" onChange={(tag) => set(i, { tag })} />
              <Field label="Descrição" value={s.description} max={220} multiline onChange={(description) => set(i, { description })} />
              <Field label="Selo giratório na foto (opcional)" value={s.seal} max={28} placeholder="Deixe vazio para não mostrar"
                onChange={(seal) => set(i, { seal })} />
              <Field label="Descrição da foto (acessibilidade)" value={s.alt} max={160} onChange={(alt) => set(i, { alt })} />
            </div>
          </div>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={add} disabled={value.length >= LIMITS.signatures.max}>+ Adicionar lanche</button>
        <span className="muted small">{value.length} de no máximo {LIMITS.signatures.max}</span>
      </div>
    </>
  )
}

// ---------- fundo do ranking ----------

export function RankingBackdropEditor({ value, onChange, ...p }: EditorProps<'rankingBackdrop'>) {
  return (
    <div className="grid-1">
      <PhotoField {...photoProps(p, value.image, 'rankingBackdrop', 'Foto de fundo do Ranking', (image) => onChange({ ...value, image }))} ratio="16 / 9" />
      <p className="muted small">Fica escurecida atrás do pódio. Fotos do salão cheio funcionam bem.</p>
    </div>
  )
}

// ---------- WhatsApp ----------

/** Mesma regra do servidor: sem DDI, assume Brasil (55). */
const normalizePhone = (raw: string) => {
  const d = raw.replace(/\D/g, '')
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

/** 5565920012601 -> +55 (65) 92001-2601 */
export function formatPhone(digits: string) {
  const m = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : digits
}

export function ContactEditor({ value, onChange }: EditorProps<'contact'>) {
  const phone = normalizePhone(value.whatsapp)
  const valid = /^55\d{10,11}$/.test(phone)
  return (
    <div className="grid-1 contact">
      <Field label="Número do WhatsApp (com DDD)" value={value.whatsapp} max={20} placeholder="(65) 92001-2601"
        onChange={(whatsapp) => onChange({ ...value, whatsapp })} />
      <p className={`status ${valid ? 'ok' : 'err'}`}>
        {valid ? `✓ Vai abrir a conversa com ${formatPhone(phone)}` : 'Digite DDD + número, ex.: (65) 92001-2601'}
      </p>
      <Field label="Mensagem que já vem escrita" value={value.message} max={300} multiline
        placeholder="Olá! Vim pelo site e quero fazer um pedido."
        onChange={(message) => onChange({ ...value, message })} />
      <div className="actions">
        <a className={`btn btn-ghost btn-xs${valid ? '' : ' is-disabled'}`} aria-disabled={!valid}
          href={valid ? whatsappUrl(phone, value.message) : undefined} target="_blank" rel="noopener noreferrer">
          Testar no WhatsApp ↗
        </a>
      </div>
      <p className="muted small">
        Vale para todos os botões de WhatsApp do site: barra de baixo no celular, atalho "WhatsApp", "Chamar no WhatsApp"
        e os botões que usam o WhatsApp quando não há link de pedido. Lembre de clicar em "Salvar e publicar".
      </p>
    </div>
  )
}
