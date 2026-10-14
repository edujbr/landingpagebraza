import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const sb = createServerClient()
  if (!token || !sb) return Response.json({ ok: false }, { status: 401 })

  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return Response.json({ ok: false }, { status: 401 })

  revalidatePath('/')
  return Response.json({ ok: true })
}
