import fs from 'node:fs/promises'
import path from 'node:path'
import { UPLOADS_DIR } from '@/lib/server/db'
import { MEDIA_ID } from '@/lib/server/media'

export const runtime = 'nodejs'

/** Serve as fotos enviadas pelo painel (o nome é aleatório e nunca muda, então dá para guardar em cache para sempre). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!MEDIA_ID.test(id)) return new Response('Not found', { status: 404 })
  try {
    const data = await fs.readFile(path.join(UPLOADS_DIR, id))
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
