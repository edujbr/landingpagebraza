import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import {
  COOKIE, changePassword, checkPassword, createSession, loginBlocked, loginFailed, loginOk, verifySession,
} from '@/lib/server/auth'
import { getContent, isInvalid, isSection, library, resetSection, resolveImage, saveSection } from '@/lib/server/content'
import { saveUpload } from '@/lib/server/media'
import { RankingError, createAndPublish, deleteRanking, listRankings, publishRanking } from '@/lib/server/ranking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (data: unknown, status = 200) => Response.json(data, { status })
const fail = (error: string, status = 400) => json({ ok: false, error }, status)

const clientIp = (req: Request) =>
  req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'

/** Cookie `Secure` só quando a página veio por HTTPS (na VPS o nginx avisa via X-Forwarded-Proto). */
async function setSessionCookie(req: Request) {
  const { value, maxAge } = createSession()
  const https = (req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '')) === 'https'
  ;(await cookies()).set(COOKIE, value, { httpOnly: true, sameSite: 'lax', secure: https, path: '/', maxAge })
}

async function authed() {
  return verifySession((await cookies()).get(COOKIE)?.value)
}

/** Tudo que o painel precisa para desenhar as seções. */
function state() {
  const content = getContent()
  const refs = new Set<string>()
  for (const v of Object.values(content)) for (const item of [v].flat()) refs.add((item as { image: string }).image)
  const images = Object.fromEntries([...refs].map((r) => [r, resolveImage(r)]))
  return { content, images }
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  if (!(await authed())) return fail('Faça login.', 401)
  switch (action) {
    case 'state':
      return json({ ok: true, ...state() })
    case 'library':
      return json({ ok: true, items: library() })
    case 'rankings':
      return json({ ok: true, items: await listRankings() })
  }
  return fail('Ação desconhecida.', 404)
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params

  if (action === 'login') {
    const ip = clientIp(req)
    const wait = loginBlocked(ip)
    if (wait) return fail(`Muitas tentativas. Tente de novo em ${wait}s.`, 429)
    const { password } = await req.json().catch(() => ({}))
    if (typeof password !== 'string' || !checkPassword(password)) {
      loginFailed(ip)
      return fail('Senha incorreta.', 401)
    }
    loginOk(ip)
    await setSessionCookie(req)
    return json({ ok: true })
  }

  if (action === 'logout') {
    ;(await cookies()).delete(COOKIE)
    return json({ ok: true })
  }

  if (!(await authed())) return fail('Sua sessão expirou. Entre de novo.', 401)

  try {
    switch (action) {
      case 'upload': {
        const form = await req.formData()
        const file = form.get('file')
        if (!(file instanceof File)) return fail('Nenhum arquivo enviado.')
        return json({ ok: true, ...(await saveUpload(file)) })
      }

      case 'save': {
        const { section, value } = await req.json()
        if (!isSection(section)) return fail('Seção desconhecida.')
        saveSection(section, value)
        revalidatePath('/')
        return json({ ok: true, ...state() })
      }

      case 'reset': {
        const { section } = await req.json()
        if (!isSection(section)) return fail('Seção desconhecida.')
        resetSection(section)
        revalidatePath('/')
        return json({ ok: true, ...state() })
      }

      case 'password': {
        const { current, next } = await req.json()
        if (typeof current !== 'string' || !checkPassword(current)) return fail('A senha atual está errada.')
        if (typeof next !== 'string' || next.length < 8) return fail('A nova senha precisa ter pelo menos 8 caracteres.')
        changePassword(next)
        await setSessionCookie(req) // as outras sessões caem; esta continua
        return json({ ok: true })
      }

      case 'ranking-create': {
        const id = createAndPublish(await req.json())
        revalidatePath('/')
        return json({ ok: true, id })
      }

      case 'ranking-publish': {
        const { id } = await req.json()
        publishRanking(Number(id))
        revalidatePath('/')
        return json({ ok: true })
      }

      case 'ranking-delete': {
        const { id } = await req.json()
        deleteRanking(Number(id))
        revalidatePath('/')
        return json({ ok: true })
      }
    }
  } catch (err) {
    if (isInvalid(err) || err instanceof RankingError) return fail((err as Error).message)
    const msg = (err as Error).message
    // Erros de upload já vêm com mensagem amigável; o resto é inesperado.
    if (action === 'upload') return fail(msg)
    console.error(`[admin:${action}]`, err)
    return fail('Erro inesperado no servidor. Tente de novo.', 500)
  }
  return fail('Ação desconhecida.', 404)
}
