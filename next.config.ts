import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Só vale no `next dev`: permite abrir por 127.0.0.1 sem bloquear o recarregamento automático.
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    agentUpgrade: 'security',
  },
}

export default nextConfig
