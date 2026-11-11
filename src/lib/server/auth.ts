import crypto from 'node:crypto'
import { getSetting, setSetting } from './db'

/** Senha inicial do painel; troque em /admin → Senha. */
const DEFAULT_PASSWORD = 'brazaforte@2026'
export const COOKIE = 'braza_admin'
const SESSION_DAYS = 7

const scrypt = (password: string, salt: Buffer) => crypto.scryptSync(password, salt, 64)

function hash(password: string) {
  const salt = crypto.randomBytes(16)
  return `${salt.toString('hex')}:${scrypt(password, salt).toString('hex')}`
}

function ensureSetup() {
  if (!getSetting('admin_password')) setSetting('admin_password', hash(DEFAULT_PASSWORD))
  if (!getSetting('session_secret')) setSetting('session_secret', crypto.randomBytes(32).toString('hex'))
  if (!getSetting('session_version')) setSetting('session_version', '1')
}

export function checkPassword(password: string): boolean {
  ensureSetup()
  const [saltHex, hashHex] = getSetting('admin_password')!.split(':')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scrypt(password, Buffer.from(saltHex, 'hex'))
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

/** Troca a senha e derruba todas as sessões abertas (inclusive a atual, que é renovada pelo chamador). */
export function changePassword(next: string) {
  ensureSetup()
  setSetting('admin_password', hash(next))
  setSetting('session_version', String(Number(getSetting('session_version')) + 1))
}

const sign = (payload: string) =>
  crypto.createHmac('sha256', getSetting('session_secret')!).update(payload).digest('base64url')

export function createSession(): { value: string; maxAge: number } {
  ensureSetup()
  const maxAge = SESSION_DAYS * 24 * 3600
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + maxAge * 1000, v: getSetting('session_version') })).toString('base64url')
  return { value: `${payload}.${sign(payload)}`, maxAge }
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false
  ensureSetup()
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const good = Buffer.from(sign(payload))
  const got = Buffer.from(sig)
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return false
  try {
    const { exp, v } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return exp > Date.now() && v === getSetting('session_version')
  } catch {
    return false
  }
}

// Freio contra chute de senha: 5 erros por IP bloqueiam por 2 minutos.
const fails = new Map<string, { n: number; until: number }>()
export function loginBlocked(ip: string): number {
  const f = fails.get(ip)
  return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0
}
export function loginFailed(ip: string) {
  const f = fails.get(ip) ?? { n: 0, until: 0 }
  f.n += 1
  if (f.n >= 5) {
    f.until = Date.now() + 2 * 60 * 1000
    f.n = 0
  }
  fails.set(ip, f)
}
export function loginOk(ip: string) {
  fails.delete(ip)
}
