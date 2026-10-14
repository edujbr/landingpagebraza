'use client'

import { FINE_POINTER, MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'
import { fanfare, pluck, shimmer, tick, typeBurst, whoosh } from '@/lib/sound'

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)]

/** Assinaturas: no desktop a seção prende e os cards correm na horizontal. */
function signaturesRail() {
  const section = $('.signatures')
  const rail = $('.sig-rail')
  const track = $('.sig-grid')
  if (!section || !rail || !track) return
  section.classList.add('is-rail')
  let lastCard = -1
  const distance = () => Math.max(0, track.scrollWidth - rail.clientWidth)
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance() + window.innerHeight * 0.3}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onEnter: () => whoosh(true, 0.9),
      onEnterBack: () => whoosh(false, 0.6),
      onUpdate: (self) => {
        const card = Math.round(self.progress * 3)
        if (card !== lastCard) {
          if (lastCard >= 0) whoosh(self.direction > 0, 0.25)
          lastCard = card
        }
      },
    },
  })
  return () => section.classList.remove('is-rail')
}

/** Cards inclinam em 3D e o reflexo segue o cursor. */
function cardTilt() {
  const cards = $$('.sig-card a')
  const offs = cards.map((card) => {
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      card.style.setProperty('--rx', `${(0.5 - py) * 12}deg`)
      card.style.setProperty('--ry', `${(px - 0.5) * 14}deg`)
      card.style.setProperty('--mx', `${px * 100}%`)
      card.style.setProperty('--my', `${py * 100}%`)
    }
    const leave = () => {
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
    }
    card.addEventListener('pointermove', move)
    card.addEventListener('pointerleave', leave)
    return () => {
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerleave', leave)
    }
  })
  return () => offs.forEach((fn) => fn())
}

function headings() {
  $$('.split').forEach((h) => {
    const chars = $$('.char', h)
    gsap.from(chars, {
      yPercent: 110,
      rotate: 10,
      opacity: 0,
      filter: 'brightness(3) blur(6px)',
      duration: 1,
      ease: 'expo.out',
      stagger: 0.028,
      onStart: () => typeBurst(chars.length, 0.028),
      scrollTrigger: { trigger: h, start: 'top 86%', once: true },
    })
  })
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  })
}

/** Atalhos: os anéis giram em órbita em volta do centro e espiralam até a grade. */
function storiesOrbit() {
  const list = $('.stories')
  if (!list) return
  const items = $$('li', list)
  let orbit: { x: number; y: number; a: number }[] = []
  const measure = () => {
    items.forEach((li) => { li.style.transform = '' })
    const box = list.getBoundingClientRect()
    orbit = items.map((li, i) => {
      const r = li.getBoundingClientRect()
      return {
        x: box.left + box.width / 2 - (r.left + r.width / 2),
        y: box.top + box.height / 2 - (r.top + r.height / 2),
        a: (i / items.length) * Math.PI * 2,
      }
    })
    return Math.min(box.width, 560) * 0.32
  }
  let radius = 0
  const state = { t: 0 }
  const render = () => {
    const k = 1 - state.t
    items.forEach((li, i) => {
      const o = orbit[i]
      if (!o) return
      const ang = o.a + k * Math.PI * 1.6
      const x = (o.x + Math.cos(ang) * radius) * k
      const y = (o.y + Math.sin(ang) * radius * 0.55) * k
      li.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.45 + 0.55 * state.t})`
      li.style.opacity = String(Math.min(1, state.t * 3))
    })
  }
  gsap.to(state, {
    t: 1,
    duration: 2,
    ease: 'power3.inOut',
    onStart: () => {
      radius = measure()
      shimmer()
    },
    onUpdate: render,
    onComplete: () => {
      items.forEach((li) => { li.style.transform = ''; li.style.opacity = '' })
      pluck()
    },
    scrollTrigger: { trigger: list, start: 'top 82%', once: true },
  })
  items.forEach((li) => { li.style.opacity = '0' })
  return () => items.forEach((li) => { li.style.transform = ''; li.style.opacity = '' })
}

/** Ranking: blocos sobem do 3º ao 1º, números contam até o valor real, coroa desce brilhando. */
function podium() {
  const el = $('.podium')
  if (!el || !$('.podium-spot', el)) return
  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true } })
  for (const pos of [3, 2, 1]) {
    const spot = $(`.pos-${pos}`, el)
    if (!spot) continue
    const at = pos === 3 ? 0 : '<0.25'
    tl.from($('.podium-block', spot), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.8, ease: 'back.out(1.5)' }, at)
    tl.from($$('.podium-avatar, .podium-name, .podium-meta', spot), { y: 34, opacity: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' }, '<0.15')
    const count = $('.podium-count', spot)
    if (count) {
      let shown = ''
      tl.from(count, {
        innerText: 0,
        snap: { innerText: 1 },
        duration: 1.3,
        ease: 'power2.out',
        onUpdate: () => {
          if (count.innerText === shown) return
          shown = count.innerText
          tick(Number(shown) || 0)
        },
      }, '<')
    }
  }
  const crown = $('.crown', el)
  if (crown) {
    tl.from(crown, { y: -140, opacity: 0, scale: 1.8, rotate: -25, duration: 1, ease: 'bounce.out', onStart: fanfare }, '-=0.4')
      .fromTo(crown, { filter: 'brightness(3)' }, { filter: 'brightness(1)', duration: 0.8 }, '<0.6')
  }
  const runners = $$('.runners li')
  if (runners.length) tl.from(runners, { x: -50, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.6')
}

/** Galeria: colunas em velocidades diferentes; fotos entram por uma máscara diagonal. */
function gallery(wide: boolean) {
  const grid = $('.g-grid')
  if (!grid) return
  const movers = wide ? $$('.g-col', grid) : $$('.g-pair', grid)
  const speeds = wide ? [-70, 50, -110, 30] : [-30, 40]
  movers.forEach((m, i) => {
    const s = speeds[i % speeds.length]
    gsap.fromTo(m, { y: -s }, { y: s, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } })
  })
  const tiles = $$('.tile', grid)
  gsap.set(tiles, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%)' })
  ScrollTrigger.batch(tiles, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      whoosh(true, 0.3)
      gsap.to(batch, { clipPath: 'polygon(0% 0%, 200% 0%, 0% 200%)', duration: 1.2, ease: 'power3.out', stagger: 0.09 })
    },
  })
  return () => gsap.set(tiles, { clearProps: 'clipPath' })
}

function footer() {
  const tag = $('.footer-hashtag')
  if (!tag) return
  gsap.fromTo(tag, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: tag, start: 'top bottom', end: 'bottom top', scrub: true } })
}

export function ScrollScenes() {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(
      { motion: MOTION_OK, desktop: '(min-width: 1025px)', wide: '(min-width: 761px)', fine: FINE_POINTER },
      (ctx) => {
        const { motion, desktop, wide, fine } = ctx.conditions as Record<string, boolean>
        if (!motion) return
        const cleanups = [
          desktop ? signaturesRail() : undefined,
          fine ? cardTilt() : undefined,
          storiesOrbit(),
          gallery(wide),
        ]
        headings()
        podium()
        footer()
        const refresh = () => ScrollTrigger.refresh()
        window.addEventListener('load', refresh)
        document.fonts?.ready.then(refresh)
        return () => {
          window.removeEventListener('load', refresh)
          cleanups.forEach((fn) => fn?.())
        }
      },
    )
  })

  return null
}
