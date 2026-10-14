export const STORE = {
  name: 'BRAZA FORTE',
  phone: '5565920012601', // DDI + DDD + número, só dígitos
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

const waText = encodeURIComponent(`Olá! Vim pelo site do ${STORE.name} e quero fazer um pedido.`)
const whatsapp = `https://wa.me/${STORE.phone}?text=${waText}`

export const LINKS = {
  order: STORE.orderUrl || whatsapp,
  menu: STORE.menuUrl || STORE.orderUrl || whatsapp,
  whatsapp,
  instagram: STORE.instagramUrl,
  maps: STORE.mapsUrl,
  googleReview: STORE.googleReviewUrl || whatsapp,
  spotify: STORE.spotifyUrl,
} as const

export type LinkKey = keyof typeof LINKS
