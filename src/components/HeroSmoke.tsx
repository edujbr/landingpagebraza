'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/gsap'

type Puff = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; grow: number; seed: number }

const COUNT = 22

function makeSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255, 238, 220, .5)')
  grad.addColorStop(0.45, 'rgba(235, 220, 205, .2)')
  grad.addColorStop(1, 'rgba(220, 205, 190, 0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return c
}

/** Fumaça subindo do lanche: poucos sprites em meia resolução, pausada fora da tela. */
export function HeroSmoke() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || prefersReducedMotion()) return
    const sprite = makeSprite()
    let w = 0
    let h = 0
    const resize = () => {
      w = canvas.width = Math.max(1, Math.round(canvas.clientWidth / 2))
      h = canvas.height = Math.max(1, Math.round(canvas.clientHeight / 2))
    }
    const spawn = (age = 0): Puff => ({
      x: w * (0.3 + Math.random() * 0.45),
      y: h * (0.2 + Math.random() * 0.12),
      vx: (Math.random() - 0.5) * w * 0.012,
      vy: -h * (0.035 + Math.random() * 0.03),
      life: age,
      max: 5 + Math.random() * 4,
      size: w * (0.12 + Math.random() * 0.08),
      grow: w * (0.04 + Math.random() * 0.04),
      seed: Math.random() * 10,
    })
    resize()
    const puffs = Array.from({ length: COUNT }, () => {
      const p = spawn()
      p.life = Math.random() * p.max
      return p
    })

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < puffs.length; i++) {
        let p = puffs[i]
        p.life += dt
        if (p.life >= p.max) p = puffs[i] = spawn()
        const k = p.life / p.max
        const x = p.x + p.vx * p.life + Math.sin(p.life * 0.7 + p.seed) * w * 0.02
        const y = p.y + p.vy * p.life
        const s = p.size + p.grow * p.life
        ctx.globalAlpha = Math.sin(Math.PI * k) * 0.4
        ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s)
      }
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
    }
  }, [])

  return <canvas ref={ref} className="hero-smoke" />
}
