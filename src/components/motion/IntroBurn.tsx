'use client'

import { useEffect, useRef } from 'react'
import { BURST_EVENT, type BurstDetail } from '@/components/Embers'
import { ignite, whoosh } from '@/lib/sound'

/** Momento (desde o início da navegação) em que a abertura começa a queimar; o hero entra junto. */
export const BURN_AT = 1.2
const BURN_DURATION = 1.15
const SCALE = 3 // o canvas roda em 1/4 da resolução; o navegador amplia e suaviza a borda (vira brilho)

const BG: [number, number, number] = [23, 22, 19]

/** Ruído de valor com 3 oitavas, em grade pequena: dá a borda irregular de papel queimando. */
function field(cw: number, ch: number) {
  const octave = (cell: number) => {
    const gw = Math.ceil(cw / cell) + 2
    const gh = Math.ceil(ch / cell) + 2
    const g = new Float32Array(gw * gh).map(() => Math.random())
    return (x: number, y: number) => {
      const fx = x / cell
      const fy = y / cell
      const ix = Math.floor(fx)
      const iy = Math.floor(fy)
      const tx = fx - ix
      const ty = fy - iy
      const sx = tx * tx * (3 - 2 * tx)
      const sy = ty * ty * (3 - 2 * ty)
      const a = g[iy * gw + ix]
      const b = g[iy * gw + ix + 1]
      const c = g[(iy + 1) * gw + ix]
      const d = g[(iy + 1) * gw + ix + 1]
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
    }
  }
  const o1 = octave(Math.max(10, cw / 6))
  const o2 = octave(Math.max(6, cw / 16))
  const o3 = octave(Math.max(4, cw / 40))
  const f = new Float32Array(cw * ch)
  const cx = cw / 2
  const cy = ch * 0.45
  const maxD = Math.hypot(Math.max(cx, cw - cx), Math.max(cy, ch - cy))
  let min = Infinity
  let max = -Infinity
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const n = o1(x, y) * 0.62 + o2(x, y) * 0.28 + o3(x, y) * 0.1
      const v = (Math.hypot(x - cx, y - cy) / maxD) * 0.72 + n * 0.42
      f[y * cw + x] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  for (let i = 0; i < f.length; i++) f[i] = (f[i] - min) / (max - min)
  return f
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Saída da abertura: o logo dá um clarão e a tela queima do centro para fora,
 * com borda incandescente, revelando o hero por baixo. Sem JS, o CSS some com a abertura sozinho.
 */
export function IntroBurn() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const pre = canvas?.closest<HTMLElement>('.preloader')
    const ctx = canvas?.getContext('2d')
    if (!canvas || !pre || !ctx) return
    // Abertura não exibida (já vista na sessão / movimento reduzido) ou já encerrada pelo failsafe do CSS.
    if (getComputedStyle(pre).display === 'none' || getComputedStyle(pre).visibility === 'hidden') return
    pre.classList.add('is-js')

    const cw = Math.ceil(window.innerWidth / SCALE)
    const ch = Math.ceil(window.innerHeight / SCALE)
    canvas.width = cw
    canvas.height = ch
    const f = field(cw, ch)
    const img = ctx.createImageData(cw, ch)
    const px = img.data

    const paint = (t: number) => {
      for (let i = 0, j = 0; i < f.length; i++, j += 4) {
        const d = f[i] - t
        let r: number, g: number, b: number, a: number
        if (d < -0.045) {
          r = g = b = a = 0
        } else if (d < 0) {
          // borda incandescente do lado já queimado: some em direção ao buraco
          const k = (d + 0.045) / 0.045
          r = 255; g = lerp(200, 244, k); b = lerp(90, 200, k); a = 255 * k * k
        } else if (d < 0.03) {
          const k = d / 0.03
          r = lerp(255, 236, k); g = lerp(236, 110, k); b = lerp(190, 40, k); a = 255
        } else if (d < 0.11) {
          // carvão: vermelho escurecendo até a cor de fundo
          const k = (d - 0.03) / 0.08
          r = lerp(200, BG[0], k); g = lerp(70, BG[1], k); b = lerp(32, BG[2], k); a = 255
        } else {
          r = BG[0]; g = BG[1]; b = BG[2]; a = 255
        }
        px[j] = r; px[j + 1] = g; px[j + 2] = b; px[j + 3] = a
      }
      ctx.putImageData(img, 0, 0)
    }
    paint(-0.2)

    let raf = 0
    let t0 = 0
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / (BURN_DURATION * 1000))
      const eased = p * p * (1.6 - 0.6 * p) // começa devagar e acelera
      paint(lerp(-0.12, 1.16, eased))
      if (p < 1) raf = requestAnimationFrame(frame)
      else pre.classList.add('is-done')
    }

    const begin = () => {
      pre.classList.add('is-burning')
      whoosh(true, 1)
      ignite()
      window.dispatchEvent(new CustomEvent<BurstDetail>(BURST_EVENT, {
        detail: { x: window.innerWidth / 2, y: window.innerHeight * 0.45 },
      }))
      t0 = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const wait = Math.max(0, BURN_AT * 1000 - performance.now())
    const timer = window.setTimeout(begin, wait)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={ref} className="pre-burn" aria-hidden="true" />
}
