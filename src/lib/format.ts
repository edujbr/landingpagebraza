const cap = (w: string) => w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1).toLocaleLowerCase('pt-BR')

/** "MARIA DA SILVA" -> "Maria S." */
export function displayName(full: string | null | undefined): string {
  const parts = String(full ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Cliente'
  const last = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toLocaleUpperCase('pt-BR')}.` : ''
  return cap(parts[0]) + last
}

export function phoneTail(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '').slice(-4)
  return digits ? `final ${digits}` : ''
}

export const ordersLabel = (n: number) => (Number(n) === 1 ? 'pedido' : 'pedidos')
