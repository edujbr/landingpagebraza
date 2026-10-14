'use client'

import { FINE_POINTER, MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

const TARGETS = '.btn, .spotify'

/** Botões puxam o cursor de leve quando ele chega perto (só mouse, sem movimento reduzido). */
export function Magnetic() {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(`${FINE_POINTER} and ${MOTION_OK}`, () => {
      const cleanups = [...document.querySelectorAll<HTMLElement>(TARGETS)].map((el) => {
        const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
        const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
        const strength = 0.3
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          x((e.clientX - (r.left + r.width / 2)) * strength)
          y((e.clientY - (r.top + r.height / 2)) * strength)
        }
        const leave = () => { x(0); y(0) }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        return () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', leave)
          gsap.set(el, { x: 0, y: 0 })
        }
      })
      return () => cleanups.forEach((fn) => fn())
    })
  })

  return null
}
