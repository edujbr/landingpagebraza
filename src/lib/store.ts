export const STORE = {
  name: 'BRAZA FORTE',
  phone: '5565920012601', // padrão; o número em uso é o do painel /admin → WhatsApp
  orderUrl: 'https://pedido.brendi.com.br/braza-forte',
  menuUrl: 'https://menu.brendi.com.br/braza-forte/',
  instagramUrl: 'https://www.instagram.com/brazaforte/',
  instagramHandle: '@brazaforte',
  address: 'Avenida Rotary Internacional, 210, Centro, Sapezal - MT',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+Rotary+Internacional,+210,+Centro,+Sapezal-MT',
  mapsEmbedUrl: 'https://www.google.com/maps?q=Avenida+Rotary+Internacional,+210,+Centro,+Sapezal+-+MT&output=embed',
  googleReviewUrl: 'https://g.page/r/CUlJPIaR52eXEAE/review',
  spotifyUrl: 'https://open.spotify.com/playlist/4nuwmC5L2wR4E8OmXmxFtt?si=e89e8aa1b2324194',
} as const

export const whatsappUrl = (phone: string, message: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`

/** Links dos botões; o WhatsApp vem do painel /admin (número e mensagem). */
export function buildLinks(contact: { whatsapp: string; message: string }) {
  const whatsapp = whatsappUrl(contact.whatsapp, contact.message)
  return {
    order: STORE.orderUrl || whatsapp,
    menu: STORE.menuUrl || STORE.orderUrl || whatsapp,
    whatsapp,
    instagram: STORE.instagramUrl,
    maps: STORE.mapsUrl,
    googleReview: STORE.googleReviewUrl || whatsapp,
    spotify: STORE.spotifyUrl,
  }
}

export type Links = ReturnType<typeof buildLinks>
export type LinkKey = keyof Links

/** Links padrão (antes do painel salvar outro número). */
export const LINKS: Links = buildLinks({ whatsapp: STORE.phone, message: `Olá! Vim pelo site do ${STORE.name} e quero fazer um pedido.` })
