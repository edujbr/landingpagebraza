import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const adumu = localFont({
  src: '../fonts/Adumu.ttf',
  variable: '--font-adumu',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'BRAZA FORTE — Hambúrguer artesanal em Sapezal',
  description: 'BRAZA FORTE — hambúrguer artesanal em Sapezal-MT. Cardápio digital, pedidos, ranking dos clientes e tudo sobre a casa.',
  openGraph: {
    title: 'BRAZA FORTE — Hambúrguer artesanal em Sapezal',
    description: 'Seu próximo favorito começa aqui. #VEMPROBRAZA',
    locale: 'pt_BR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#171613',
  viewportFit: 'cover',
}

/**
 * Roda antes da primeira pintura: `data-motion` libera os estados iniciais das animações
 * (sem JS o site aparece pronto) e `data-intro="seen"` pula a abertura do logo na mesma sessão.
 */
const bootScript = `(function(){var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches)d.dataset.motion='1';if(sessionStorage.getItem('braza-intro'))d.dataset.intro='seen';else sessionStorage.setItem('braza-intro','1')}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${adumu.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
