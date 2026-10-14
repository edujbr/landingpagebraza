'use client'

import { useRef } from 'react'
import { FINE_POINTER, MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

/** Luz quente que segue o mouse e cresce sobre links e botões. */
export function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const el = glow.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(`${FINE_POINTER} and ${MOTION_OK}`, () => {
      const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' })
      const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' })
      const move = (e: PointerEvent) => {
        x(e.clientX)
        y(e.clientY)
        el.classList.add('is-on')
        const hot = (e.target as Element | null)?.closest?.('a, button')
        el.classList.toggle('is-hot', Boolean(hot))
      }
      const out = () => el.classList.remove('is-on')
      window.addEventListener('pointermove', move, { passive: true })
      document.documentElement.addEventListener('pointerleave', out)
      return () => {
        window.removeEventListener('pointermove', move)
        document.documentElement.removeEventListener('pointerleave', out)
        el.classList.remove('is-on', 'is-hot')
      }
    })
  })

  return <div ref={glow} className="cursor-glow" aria-hidden="true" />
}
