import type { LinkKey } from './store'

/**
 * Referência de imagem guardada no banco:
 * `static:<nome>` = foto que veio com o site (src/assets/img), `upload:<id>` = foto enviada pelo painel.
 */
export type ImageRef = string

/** Imagem pronta para o <Image> do Next. */
export type Img = { src: string; width: number; height: number; blurDataURL?: string }

export type PhotoItem = { image: ImageRef; alt: string }
export type StoryItem = { label: string; hint: string; image: ImageRef; link?: LinkKey; href?: string }
/** WhatsApp: número com DDI+DDD (só dígitos) e a mensagem que já vem escrita na conversa. */
export type ContactInfo = { whatsapp: string; message: string }

export type SignatureItem = { name: string; tag: string; seal: string; description: string; image: ImageRef; alt: string }

export type SiteContent = {
  hero: PhotoItem
  stories: StoryItem[]
  reel: PhotoItem[]
  signatures: SignatureItem[]
  gallery: PhotoItem[]
  rankingBackdrop: PhotoItem
  contact: ContactInfo
}
export type SectionKey = keyof SiteContent

/** Troca cada `image: ImageRef` por `image: Img` (o que a página recebe). */
type ResolveItem<T> = T extends { image: ImageRef } ? Omit<T, 'image'> & { image: Img } : T
export type Resolved<T> = T extends (infer U)[] ? ResolveItem<U>[] : ResolveItem<T>
export type ResolvedSite = { [K in SectionKey]: Resolved<SiteContent[K]> }

/** Limites usados no painel e validados no servidor. */
export const LIMITS = {
  reel: { min: 3, max: 24 },
  gallery: { min: 4, max: 40 },
  signatures: { min: 1, max: 8 },
} as const

export type LibraryImage = { ref: ImageRef; img: Img; label: string; uploaded: boolean }
