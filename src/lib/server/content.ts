import { DEFAULT_CONTENT, STATIC_IMAGES } from '@/content/site'
import {
  LIMITS,
  type Img, type ImageRef, type LibraryImage, type PhotoItem, type ResolvedSite,
  type SectionKey, type SignatureItem, type SiteContent, type StoryItem,
} from '@/lib/content-types'
import { db } from './db'

type MediaRow = { id: string; width: number; height: number; blur: string | null; name: string | null }

const SECTIONS = Object.keys(DEFAULT_CONTENT) as SectionKey[]
export const isSection = (k: string): k is SectionKey => (SECTIONS as string[]).includes(k)

function mediaRow(id: string): MediaRow | undefined {
  return db().prepare('SELECT id, width, height, blur, name FROM media WHERE id = ?').get(id) as MediaRow | undefined
}

const mediaImg = (m: MediaRow): Img => ({ src: `/media/${m.id}`, width: m.width, height: m.height, blurDataURL: m.blur ?? undefined })

/** Converte a referência guardada no banco em imagem; referência quebrada cai na foto padrão. */
export function resolveImage(ref: ImageRef, fallback: ImageRef = 'static:hero-melt'): Img {
  const [kind, key] = ref.split(':', 2)
  if (kind === 'static' && STATIC_IMAGES[key]) return STATIC_IMAGES[key]
  if (kind === 'upload') {
    const m = mediaRow(key)
    if (m) return mediaImg(m)
  }
  return ref === fallback ? STATIC_IMAGES['hero-melt'] : resolveImage(fallback)
}

export function imageExists(ref: unknown): ref is ImageRef {
  if (typeof ref !== 'string') return false
  const [kind, key] = ref.split(':', 2)
  return (kind === 'static' && key in STATIC_IMAGES) || (kind === 'upload' && Boolean(mediaRow(key)))
}

/** Conteúdo cru (com referências), seção do banco quando existir, senão o padrão. */
export function getContent(): SiteContent {
  const rows = db().prepare('SELECT key, value FROM content').all() as { key: string; value: string }[]
  const out = structuredClone(DEFAULT_CONTENT)
  for (const r of rows) {
    if (!isSection(r.key)) continue
    try {
      ;(out as Record<string, unknown>)[r.key] = JSON.parse(r.value)
    } catch {
      /* seção corrompida: mantém o padrão */
    }
  }
  return out
}

function resolveItem<T extends { image: ImageRef }>(item: T, fallback: ImageRef) {
  return { ...item, image: resolveImage(item.image, fallback) }
}

/** Conteúdo pronto para a página (imagens resolvidas). */
export function getSiteContent(): ResolvedSite {
  const c = getContent()
  const d = DEFAULT_CONTENT
  return {
    hero: resolveItem(c.hero, d.hero.image),
    rankingBackdrop: resolveItem(c.rankingBackdrop, d.rankingBackdrop.image),
    stories: c.stories.map((s, i) => resolveItem(s, d.stories[i]?.image ?? 'static:vibe-01')),
    reel: c.reel.map((p) => resolveItem(p, 'static:strip-01')),
    signatures: c.signatures.map((s) => resolveItem(s, 'static:sig-bacon')),
    gallery: c.gallery.map((p) => resolveItem(p, 'static:vibe-02')),
  } as ResolvedSite
}

// ---------- validação do que chega do painel ----------

class Invalid extends Error {}
export const isInvalid = (e: unknown): e is Invalid => e instanceof Invalid

const text = (v: unknown, field: string, max: number, required = true) => {
  const s = typeof v === 'string' ? v.trim().slice(0, max) : ''
  if (required && !s) throw new Invalid(`Preencha: ${field}.`)
  return s
}
const image = (v: unknown, where: string) => {
  if (!imageExists(v)) throw new Invalid(`Foto inválida em ${where}. Envie a foto de novo.`)
  return v
}
const list = (v: unknown, name: string, min: number, max: number) => {
  if (!Array.isArray(v)) throw new Invalid(`Lista inválida: ${name}.`)
  if (v.length < min) throw new Invalid(`${name}: mínimo de ${min} foto(s).`)
  if (v.length > max) throw new Invalid(`${name}: máximo de ${max} itens.`)
  return v as Record<string, unknown>[]
}
const photo = (p: Record<string, unknown>, where: string, altRequired = true): PhotoItem => ({
  image: image(p?.image, where),
  alt: text(p?.alt, `descrição da foto (${where})`, 160, altRequired),
})

function validate(section: SectionKey, v: unknown): SiteContent[SectionKey] {
  const o = v as Record<string, unknown>
  switch (section) {
    case 'hero':
      return photo(o, 'Início')
    case 'rankingBackdrop':
      return photo(o, 'fundo do Ranking', false)
    case 'reel':
      return list(v, 'Faixa de fotos', LIMITS.reel.min, LIMITS.reel.max).map((p, i) => photo(p, `faixa, foto ${i + 1}`))
    case 'gallery':
      return list(v, 'Galeria', LIMITS.gallery.min, LIMITS.gallery.max).map((p, i) => photo(p, `galeria, foto ${i + 1}`))
    case 'stories': {
      // Os atalhos têm links fixos (cardápio, WhatsApp...): o painel só troca foto, título e subtítulo.
      const items = list(v, 'Atalhos', DEFAULT_CONTENT.stories.length, DEFAULT_CONTENT.stories.length)
      return items.map((s, i): StoryItem => ({
        ...DEFAULT_CONTENT.stories[i],
        label: text(s.label, `título do atalho ${i + 1}`, 24),
        hint: text(s.hint, `subtítulo do atalho ${i + 1}`, 40, false),
        image: image(s.image, `atalho ${i + 1}`),
      }))
    }
    case 'signatures':
      return list(v, 'Os que fazem fila', LIMITS.signatures.min, LIMITS.signatures.max).map((s, i): SignatureItem => ({
        name: text(s.name, `nome do lanche ${i + 1}`, 40),
        tag: text(s.tag, `etiqueta do lanche ${i + 1}`, 40, false),
        seal: text(s.seal, `selo do lanche ${i + 1}`, 28, false),
        description: text(s.description, `descrição do lanche ${i + 1}`, 220),
        image: image(s.image, `lanche ${i + 1}`),
        alt: text(s.alt, `descrição da foto do lanche ${i + 1}`, 160, false) || text(s.name, '', 40, false),
      }))
  }
}

export function saveSection(section: SectionKey, value: unknown) {
  const clean = validate(section, value)
  db().prepare(
    `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(section, JSON.stringify(clean))
  return clean
}

export function resetSection(section: SectionKey) {
  db().prepare('DELETE FROM content WHERE key = ?').run(section)
}

// ---------- biblioteca de fotos ----------

export function addMedia(m: { id: string; width: number; height: number; blur: string; name: string }) {
  db().prepare('INSERT INTO media (id, width, height, blur, name) VALUES (?, ?, ?, ?, ?)').run(m.id, m.width, m.height, m.blur, m.name)
  return { ref: `upload:${m.id}`, img: mediaImg({ ...m }) }
}

/** Todas as fotos disponíveis: enviadas (mais novas primeiro) e as que vieram com o site. */
export function library(): LibraryImage[] {
  const uploads = (db().prepare('SELECT id, width, height, blur, name FROM media ORDER BY created_at DESC').all() as MediaRow[])
    .map((m) => ({ ref: `upload:${m.id}`, img: mediaImg(m), label: m.name || 'Foto enviada', uploaded: true }))
  const statics = Object.entries(STATIC_IMAGES).map(([key, s]) => ({
    ref: `static:${key}`,
    img: { src: s.src, width: s.width, height: s.height, blurDataURL: s.blurDataURL },
    label: key,
    uploaded: false,
  }))
  return [...uploads, ...statics]
}
