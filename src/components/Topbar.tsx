'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import logo from '@/assets/logo.jpeg'
import { ExtLink } from './ExtLink'
import { SoundToggle } from './sound/SoundFx'

export function Topbar() {
  const [solid, setSolid] = useState(false)
  const [dock, setDock] = useState(false)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 40)
      const max = document.documentElement.scrollHeight - window.innerHeight
      bar.current?.style.setProperty('--p', String(max > 0 ? Math.min(1, window.scrollY / max) : 0))
      const next = document.getElementById('atalhos')?.getBoundingClientRect().top ?? 0
      setDock(next < window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`topbar${solid ? ' is-solid' : ''}`}>
        <div className="shell topbar-inner">
          <a href="#inicio" className="brand" aria-label="BRAZA FORTE, voltar ao início">
            <Image src={logo} alt="" width={44} height={44} priority />
            <span>BRAZA FORTE</span>
          </a>
          <nav className="nav" aria-label="Principal">
            <a href="#atalhos">Atalhos</a>
            <a href="#assinaturas">Cardápio</a>
            <a href="#ranking">Ranking</a>
            <a href="#galeria">Galeria</a>
            <a href="#visite">Visite</a>
          </nav>
          <div className="topbar-actions">
            <SoundToggle />
            <ExtLink to="order" className="btn btn-sm">Pedir agora</ExtLink>
          </div>
        </div>
        <span className="scroll-progress" ref={bar} aria-hidden="true"><i /></span>
      </header>

      <nav className={`dock${dock ? ' is-visible' : ''}`} aria-label="Ações rápidas">
        <ExtLink to="menu">Cardápio</ExtLink>
        <ExtLink to="order" className="dock-main">Pedir agora</ExtLink>
        <ExtLink to="whatsapp">WhatsApp</ExtLink>
      </nav>
    </>
  )
}
