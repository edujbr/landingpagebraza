'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'
import { ScrollTrigger, gsap, prefersReducedMotion } from '@/lib/gsap'

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const offset = -(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72)
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      anchors: { offset },
      prevent: (node) => node.closest('dialog, iframe') !== null,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return null
}
