'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Component, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import logo from '@/assets/logo.jpeg'
import { Embers } from '@/components/Embers'
import { ExtLink } from '@/components/ExtLink'
import { hero } from '@/content/site'
import { ScrollTrigger, prefersReducedMotion, useGSAP } from '@/lib/gsap'
import { setAmbient, typeBurst, whoosh } from '@/lib/sound'

/** Intervalo entre letras da legenda digitada; precisa bater com `--type-step` no CSS. */
const TYPE_INTERVAL = 28

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false })

const STEPS = [
  { at: 0, n: '01', label: 'Pão brioche selado na chapa' },
  { at: 0.14, n: '02', label: 'Blend 180g direto da brasa' },
  { at: 0.34, n: '03', label: 'Cheddar derretendo por cima' },
  { at: 0.54, n: '04', label: 'Bacon crocante e cebola' },
  { at: 0.74, n: '05', label: 'Fecha com pão e gergelim' },
  { at: 0.92, n: '✦', label: 'Montado. Agora é seu.' },
]

function canRun3D() {
  if (prefersReducedMotion()) return false
  if ((navigator.hardwareConcurrency ?? 8) <= 4) return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

export function AssemblyHero() {
  const section = useRef<HTMLElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const [is3D, setIs3D] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    setMobile(window.matchMedia('(max-width: 760px)').matches)
    setIs3D(canRun3D())
  }, [])

  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [is3D])

  const lastStep = useRef(0)
  useEffect(() => {
    if (step === lastStep.current) return
    whoosh(step > lastStep.current, 0.4)
    typeBurst(STEPS[step].label.length, TYPE_INTERVAL / 1000, 0.12)
    lastStep.current = step
  }, [step])

  useEffect(() => {
    setAmbient(active)
    return () => setAmbient(false)
  }, [active])

  useGSAP(() => {
    if (!is3D) return
    ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress
        bar.current?.style.setProperty('--p', self.progress.toFixed(4))
        let i = 0
        while (i < STEPS.length - 1 && self.progress >= STEPS[i + 1].at) i++
        setStep(i)
      },
    })
    ScrollTrigger.refresh()
  }, { dependencies: [is3D], scope: section })

  const fail = () => {
    setIs3D(false)
    setReady(false)
  }

  return (
    <section
      id="inicio"
      ref={section}
      className={`hero${is3D ? ' hero-3d' : ''}${ready ? ' is-ready' : ''}`}
      data-step={step}
    >
      <div className="hero-stage">
        <div className="hero-media" aria-hidden="true">
          <Image src={hero.src} alt="" fill priority placeholder="blur" sizes="(max-width: 760px) 100vw, 58vw" />
        </div>
        {!ready && <Embers />}
        {is3D && (
          <SceneBoundary onError={fail}>
            <HeroScene progress={progress} active={active} mobile={mobile} onReady={() => setReady(true)} />
          </SceneBoundary>
        )}

        <div className="shell hero-content">
          <p className="eyebrow">Sapezal · Mato Grosso</p>
          <h1 className="hero-title">
            <span className="line">Braza</span>
            <span className="line ember-text">Forte</span>
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

        {is3D && (
          <>
            <ol className="assembly-steps" aria-hidden="true">
              {STEPS.map((s, i) => (
                <li key={s.n} className={i === step ? 'is-on' : i < step ? 'is-past' : undefined}>
                  <span>{s.n}</span>
                  {[...s.label].map((ch, k) => (
                    <b key={k} className="type-char" style={{ '--i': k } as CSSProperties}>{ch}</b>
                  ))}
                </li>
              ))}
            </ol>
            <div className="assembly-bar" ref={bar} aria-hidden="true"><i /></div>
            <div className="assembly-badge" aria-hidden="true">
              <Image src={logo} alt="" width={96} height={96} />
              <span>#VEMPROBRAZA</span>
            </div>
          </>
        )}

        <a href="#atalhos" className="scroll-cue" aria-label="Rolar para os atalhos"><span /></a>
      </div>
    </section>
  )
}
