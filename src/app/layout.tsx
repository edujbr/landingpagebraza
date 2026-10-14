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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${adumu.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
