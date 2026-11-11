'use client'

import Image from 'next/image'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Embers } from '@/components/Embers'
import { ExtLink } from '@/components/ExtLink'
import { HeroSmoke } from '@/components/HeroSmoke'
import { BURN_AT } from '@/components/motion/IntroBurn'
import type { Img } from '@/lib/content-types'
import { imgProps } from '@/lib/img'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'
import { setAmbient, typeBurst, welcome, whoosh } from '@/lib/sound'

function Chars({ word }: { word: string }) {
  return [...word].map((ch, i) => (
    <span key={i} className="hc" style={{ '--i': i, '--n': word.length - 1 } as CSSProperties}>{ch}</span>
  ))
}

export function Hero({ image, alt }: { image: Img; alt: string }) {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setAmbient(entry.isIntersecting))
    io.observe(el)
    return () => {
      io.disconnect()
      setAmbient(false)
    }
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const q = gsap.utils.selector(section)
      const media = q('.hero-media')
      const lines = q('.hero-title .line')
      const seen = document.documentElement.dataset.intro === 'seen'

      // Com abertura: o lanche já está aceso por baixo quando o fogo abre a tela (horário desde a navegação).
      // Sem abertura (já vista na sessão): entra pela cortina lateral.
      const delay = seen ? 0.15 : Math.max(0.05, BURN_AT - 0.25 - performance.now() / 1000)
      const mediaIn = seen
        ? { from: { opacity: 1, clipPath: 'inset(0 0 0 100%)', scale: 1.25 }, to: { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 1.4, ease: 'power3.inOut', clearProps: 'clipPath,scale' } }
        : { from: { opacity: 1, scale: 1.22, filter: 'brightness(1.9) saturate(1.3)' }, to: { scale: 1, filter: 'brightness(1) saturate(1)', duration: 1.8, ease: 'power3.out', clearProps: 'scale,filter' } }

      gsap.set(lines, { clipPath: 'inset(-40% -10% 0 -10%)' })
      gsap.timeline({ delay })
        .fromTo(media, mediaIn.from, {
          ...mediaIn.to,
          onStart: () => {
            welcome()
            whoosh(true, 0.7)
          },
        })
        .fromTo(q('.hc'),
          { opacity: 1, yPercent: 115, rotate: 8 },
          { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045, onStart: () => typeBurst(10, 0.045) }, seen ? 0.3 : 0.5)
        .set(lines, { clearProps: 'clipPath' })
        .fromTo(q('.hero-content .eyebrow, .hero-sub, .hero-actions, .hero-facts'),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.7)

      gsap.timeline({ scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom top', scrub: true } })
        .fromTo(media, { yPercent: 0, filter: 'brightness(1)' }, { yPercent: 18, filter: 'brightness(.35)', ease: 'none' }, 0)
        .fromTo(q('.hero-content'), { y: 0, opacity: 1 }, { y: -90, opacity: 0, ease: 'none' }, 0)
    })
    return () => mm.revert()
  }, { scope: section })

  return (
    <section id="inicio" ref={section} className="hero">
      <div className="hero-stage">
        <div className="hero-media" aria-hidden="true" data-slot="hero" title={alt}>
          <Image {...imgProps(image, true)} alt="" fill priority sizes="(max-width: 760px) 100vw, 58vw" />
          <HeroSmoke />
        </div>
        <Embers />

        <div className="shell hero-content">
          <p className="eyebrow">Sapezal · Mato Grosso</p>
          <h1 className="hero-title" aria-label="Braza Forte">
            <span className="line" aria-hidden="true"><Chars word="Braza" /></span>
            <span className="line ember-text" aria-hidden="true"><Chars word="Forte" /></span>
          </h1>
          <p className="hero-sub">Hambúrguer artesanal em Sapezal. Seu próximo favorito começa aqui.</p>
          <div className="hero-actions">
            <ExtLink to="order" className="btn">Fazer pedido</ExtLink>
            <ExtLink to="menu" className="btn btn-ghost">Ver cardápio</ExtLink>
          </div>
          <ul className="hero-facts">
            <li><strong>Delivery</strong> e salão</li>
            <li><strong>Burger</strong> 180g artesanal</li>
            <li><strong>#VEMPROBRAZA</strong></li>
          </ul>
        </div>

        <a href="#atalhos" className="scroll-cue" aria-label="Rolar para os atalhos"><span /></a>
      </div>
    </section>
  )
}
