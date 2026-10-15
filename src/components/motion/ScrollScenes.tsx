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

/** Nome de cada lanche acende letra a letra, um card depois do outro. */
function signatureNames() {
  const grid = $('.sig-grid')
  if (!grid) return
  const tl = gsap.timeline({ scrollTrigger: { trigger: grid, start: 'top 75%', once: true } })
  $$('.sig-name', grid).forEach((h, i) => {
    const chars = $$('.char', h)
    tl.from(chars, {
      opacity: 0,
      yPercent: 70,
      filter: 'brightness(4) blur(5px)',
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.04,
      onStart: () => typeBurst(chars.length, 0.04),
    }, i * 0.35)
  })
}

/**
 * Faixas infinitas: andam sozinhas e aceleram com a velocidade da rolagem,
 * invertendo o sentido quando a página sobe.
 */
function marquees() {
  const tracks = $$('[data-marquee]').map((el) => ({
    el,
    dir: el.dataset.marquee === 'reverse' ? -1 : 1,
    rate: 50 / Number(el.dataset.speed || 30),
    x: 0,
  }))
  if (!tracks.length) return
  tracks.forEach((t) => t.el.classList.add('is-driven'))
  const wrap = gsap.utils.wrap(-50, 0)
  const state = { dir: 1, boost: 0, speed: 1 }
  const st = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      state.dir = self.direction
      state.boost = Math.min(Math.abs(self.getVelocity()) / 250, 8)
    },
  })
  const step = (_: number, dt: number) => {
    state.boost *= 0.93
    state.speed += (state.dir * (1 + state.boost) - state.speed) * 0.1
    const sec = Math.min(dt, 50) / 1000
    for (const t of tracks) {
      t.x = wrap(t.x - t.dir * t.rate * state.speed * sec)
      t.el.style.transform = `translate3d(${t.x}%, 0, 0)`
    }
  }
  gsap.ticker.add(step)
  return () => {
    gsap.ticker.remove(step)
    st.kill()
    tracks.forEach((t) => {
      t.el.classList.remove('is-driven')
      t.el.style.transform = ''
    })
  }
}

function headings() {
  $$('.split:not(.sig-name)').forEach((h) => {
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
      .call(() => sparkBurst(crown.parentElement!), undefined, '<0.45')
      .fromTo(crown, { filter: 'brightness(3)' }, { filter: 'brightness(1)', duration: 0.8 }, '<')
  }
  const runners = $$('.runners li')
  if (runners.length) {
    tl.from(runners, { x: -50, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .from($$('.runner-bar i'), { scaleX: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 }, '<0.2')
  }
}

/** Explosão de faíscas e onda de calor em volta do avatar do 1º lugar. */
function sparkBurst(host: HTMLElement) {
  const layer = document.createElement('span')
  layer.className = 'sparks'
  host.appendChild(layer)
  const ring = document.createElement('b')
  layer.appendChild(ring)
  gsap.fromTo(ring, { scale: 0.4, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.9, ease: 'power2.out' })
  const count = 26
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i')
    layer.appendChild(s)
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
    const dist = 70 + Math.random() * 90
    gsap.timeline()
      .fromTo(s, { x: 0, y: 0, scale: 1 + Math.random(), opacity: 1 }, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.8,
        duration: 0.7 + Math.random() * 0.4,
        ease: 'power3.out',
      })
      .to(s, { y: '+=40', opacity: 0, scale: 0.2, duration: 0.6, ease: 'power1.in' }, '-=0.2')
  }
  gsap.delayedCall(2, () => layer.remove())
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

/** "VEM PRO BRAZA" começa só no contorno e a brasa preenche até o fim da página. */
function footer() {
  const burn = $('.footer-burn')
  if (!burn) return
  gsap.fromTo(burn, { '--burn': 0 }, {
    '--burn': 1,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 },
  })
  gsap.fromTo(burn, { xPercent: 4 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } })
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
          marquees(),
        ]
        headings()
        signatureNames()
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
