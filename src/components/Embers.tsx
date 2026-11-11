'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/gsap'

/** Evento disparado pela abertura quando o fogo "rasga" a tela: as brasas explodem do ponto indicado. */
export const BURST_EVENT = 'braza:burst'
export type BurstDetail = { x: number; y: number; count?: number }

type P = {
  x: number; y: number; vx: number; vy: number
  life: number; max: number; size: number; seed: number
  spark: boolean; heat: number; bokeh: boolean
}

/** Glow pré-renderizado: núcleo quase branco, corpo dourado e borda laranja. */
function sprite(stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  stops.forEach(([o, col]) => grad.addColorStop(o, col))
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return c
}

/**
 * Brasas do hero em canvas: sobem com o calor, balançam, cintilam e esfriam (dourado → vermelho).
 * Algumas viram faíscas rápidas com rastro. O mouse empurra as brasas próximas.
 * Fica parado fora da tela e com movimento reduzido.
 */
export function Embers() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || prefersReducedMotion()) return

    const hot = sprite([[0, 'rgba(255,250,230,1)'], [0.14, 'rgba(255,224,140,1)'], [0.32, 'rgba(255,160,64,.75)'], [0.6, 'rgba(233,100,40,.22)'], [1, 'rgba(233,100,40,0)']])
    const cool = sprite([[0, 'rgba(255,200,130,1)'], [0.2, 'rgba(240,110,45,.85)'], [0.5, 'rgba(198,66,38,.3)'], [1, 'rgba(184,64,41,0)']])
    const soft = sprite([[0, 'rgba(255,170,80,.55)'], [0.55, 'rgba(233,110,45,.22)'], [0.85, 'rgba(233,110,45,.06)'], [1, 'rgba(233,110,45,0)']])

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0
    let h = 0
    let mobile = false
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mobile = w < 760
    }
    resize()

    const target = () => (mobile ? 70 : 150)
    const ps: P[] = []

    /** Nasce no pé da tela, com mais brasas embaixo do lanche (lado direito no desktop). */
    const spawn = (warm = false): P => {
      const r = Math.random()
      const spark = r < 0.16
      const bokeh = !spark && r > 0.9
      const nearFood = Math.random() < (mobile ? 0.5 : 0.62)
      const x = nearFood
        ? (mobile ? w * (0.15 + Math.random() * 0.7) : w * (0.52 + Math.random() * 0.44))
        : Math.random() * w
      return {
        x,
        y: warm ? Math.random() * h : h + 10 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 20,
        vy: spark ? -(170 + Math.random() * 180) : bokeh ? -(18 + Math.random() * 30) : -(35 + Math.random() * 80),
        life: warm ? Math.random() * 4 : 0,
        max: spark ? 1.2 + Math.random() * 1.3 : 4.5 + Math.random() * 5,
        size: spark ? 1.5 + Math.random() * 1.3 : bokeh ? 9 + Math.random() * 14 : 2.2 + Math.random() * Math.random() * 7,
        seed: Math.random() * 100,
        spark,
        heat: bokeh ? 0.35 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2,
        bokeh,
      }
    }
    for (let i = 0; i < target(); i++) ps.push(spawn(true))

    const burst = (e: Event) => {
      const d = (e as CustomEvent<BurstDetail>).detail
      const r = canvas.getBoundingClientRect()
      const bx = d.x - r.left
      const by = d.y - r.top
      const n = d.count ?? (mobile ? 40 : 80)
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7
        const sp = 180 + Math.random() * 520
        const spark = Math.random() < 0.6
        ps.push({
          x: bx + (Math.random() - 0.5) * 40,
          y: by + (Math.random() - 0.5) * 40,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 0.9 + Math.random() * 1.6,
          size: spark ? 1.3 + Math.random() * 1.4 : 2 + Math.random() * 4,
          seed: Math.random() * 100,
          spark,
          heat: 1,
          bokeh: false,
        })
      }
    }
    window.addEventListener(BURST_EVENT, burst)

    // Mouse empurra as brasas (só ponteiro fino; no toque não faz sentido).
    let mx = -1e4
    let my = -1e4
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = canvas.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    window.addEventListener('pointermove', move, { passive: true })

    let raf = 0
    let last = performance.now()
    let time = 0
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      time += dt
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.life += dt
        const k = p.life / p.max
        if (k >= 1 || p.y < -40 || p.x < -60 || p.x > w + 60) {
          if (ps.length > target()) ps.splice(i, 1)
          else ps[i] = spawn()
          continue
        }

        // Correntes de ar quente: balanço lento + turbulência que muda com a altura.
        const sway = Math.sin(time * 0.9 + p.seed) * 14 + Math.sin(p.y * 0.012 + time * 1.7 + p.seed) * 26
        p.vx += (sway - p.vx * 0.9) * dt * (p.spark ? 0.6 : 1.6)
        p.vy += (p.spark ? 60 : -14) * dt // faísca perde força; brasa ainda acelera subindo
        if (p.spark) p.vx *= 1 - dt * 0.8

        const dx = p.x - mx
        const dy = p.y - my
        const d2 = dx * dx + dy * dy
        if (d2 < 120 * 120) {
          const f = (1 - Math.sqrt(d2) / 120) * 900 * dt
          const inv = 1 / (Math.sqrt(d2) + 1)
          p.vx += dx * inv * f
          p.vy += dy * inv * f
        }

        p.x += p.vx * dt
        p.y += p.vy * dt

        const fade = Math.min(1, k * 6) * (1 - k) ** 1.4
        const flick = 0.65 + 0.35 * Math.sin(time * (8 + (p.seed % 7)) + p.seed)
        const alpha = Math.min(1, fade * flick * p.heat * 1.25)
        if (alpha < 0.02) continue

        if (p.spark) {
          const len = Math.min(0.05, 0.035 + k * 0.02)
          ctx.globalAlpha = alpha
          ctx.strokeStyle = k < 0.5 ? '#FFE7AE' : '#FF9A4A'
          ctx.lineWidth = p.size * (1 - k * 0.6)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len)
          ctx.stroke()
          ctx.globalAlpha = alpha * 0.6
          const s = p.size * 7
          ctx.drawImage(hot, p.x - s / 2, p.y - s / 2, s, s)
        } else if (p.bokeh) {
          const s = p.size * 6
          ctx.globalAlpha = alpha
          ctx.drawImage(soft, p.x - s / 2, p.y - s / 2, s, s)
        } else {
          const s = p.size * (1 - k * 0.4) * 8
          ctx.globalAlpha = alpha
          ctx.drawImage(k < 0.5 ? hot : cool, p.x - s / 2, p.y - s / 2, s, s)
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    let visible = true
    const sync = () => (visible && !document.hidden ? start() : stop())
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('resize', resize)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('resize', resize)
      window.removeEventListener(BURST_EVENT, burst)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  return <canvas ref={ref} className="embers" aria-hidden="true" />
}
