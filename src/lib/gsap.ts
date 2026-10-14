'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const REDUCED = '(prefers-reduced-motion: reduce)'
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED).matches
}

export { gsap, ScrollTrigger, useGSAP }
