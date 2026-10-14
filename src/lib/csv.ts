export type CsvCustomer = { name: string; phone: string; orders: number }

const norm = (s: string) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function detectDelimiter(line: string): string {
  return [';', ',', '\t']
    .map((d) => [d, line.split(d).length] as const)
    .sort((a, b) => b[1] - a[1])[0][0]
}

function parseRows(text: string, delim: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const pushRow = () => {
    row.push(field)
    field = ''
    if (row.some((v) => v.trim())) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === delim) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      pushRow()
    } else field += c
  }
  pushRow()
  return rows
}

const findCol = (headers: string[], patterns: RegExp[], exclude?: RegExp) =>
  headers.findIndex((h) => patterns.some((p) => p.test(h)) && !(exclude && exclude.test(h)))

/**
 * Lê o CSV de clientes ou de pedidos do Brendi.
 * Com coluna de quantidade, usa o maior valor por cliente; sem ela, cada linha conta como um pedido.
 */
export function parseCustomersCsv(raw: string): { customers: CsvCustomer[]; aggregated: boolean } {
  const text = raw.replace(/^\uFEFF/, '')
  const rows = parseRows(text, detectDelimiter(text.split(/\r?\n/, 1)[0]))
  if (rows.length < 2) throw new Error('O arquivo está vazio ou só tem cabeçalho.')

  const headers = rows[0].map(norm)
  const iName = findCol(headers, [/^nome/, /cliente/, /customer/, /^name/], /produto|item|loja/)
  const iPhone = findCol(headers, [/telefone/, /celular/, /whats/, /phone/, /fone/])
  const iOrders = findCol(headers, [
    /qtd.*pedido/, /quantidade.*pedido/, /total.*pedidos/, /n.*pedidos/, /^pedidos$/,
    /orders?\s*count/, /^orders$/, /frequencia/,
  ])
  if (iName === -1) throw new Error('Não achei a coluna de nome do cliente.')

  const byCustomer = new Map<string, CsvCustomer>()
  for (const cols of rows.slice(1)) {
    const name = (cols[iName] || '').trim()
    if (!name) continue
    const phone = iPhone > -1 ? (cols[iPhone] || '').replace(/\D/g, '') : ''
    const orders = iOrders > -1 ? parseInt(String(cols[iOrders] || '').replace(/\D/g, ''), 10) || 0 : 1
    if (orders <= 0) continue
    const key = phone || norm(name)
    const prev = byCustomer.get(key)
    if (!prev) byCustomer.set(key, { name, phone, orders })
    else if (iOrders > -1) prev.orders = Math.max(prev.orders, orders)
    else prev.orders += orders
  }

  const customers = [...byCustomer.values()].sort(
    (a, b) => b.orders - a.orders || a.name.localeCompare(b.name, 'pt-BR'),
  )
  return { customers, aggregated: iOrders === -1 }
}
