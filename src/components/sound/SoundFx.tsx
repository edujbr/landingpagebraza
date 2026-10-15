'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { click, getEnabled, hover, initSound, setSound, subscribe } from '@/lib/sound'

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, getEnabled, () => false)
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h3.5L12 5v14l-4.5-4H4z" />
      {on ? (
        <>
          <path className="wave" d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path className="wave" d="M18 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <path className="wave" d="M16 9.5l5 5m0-5l-5 5" />
      )}
    </svg>
  )
}

export function SoundToggle() {
  const on = useSoundEnabled()
  return (
    <button
      type="button"
      className={`sound-toggle${on ? ' is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Desligar efeitos sonoros' : 'Ligar efeitos sonoros'}
      onClick={() => setSound(!on)}
    >
      <SpeakerIcon on={on} />
      <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span>
    </button>
  )
}

/** Liga o som (padrão) e adiciona os sons de clique e hover em links e botões. */
export function SoundFx() {
  useEffect(() => {
    initSound()
  }, [])

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    let last: Element | null = null
    let lastAt = 0
    const onOver = (e: PointerEvent) => {
      if (!fine.matches) return
      const el = (e.target as Element | null)?.closest?.('a, button')
      if (!el || el === last) return
      last = el
      const now = performance.now()
      if (now - lastAt < 70) return
      lastAt = now
      hover()
    }
    const onOut = (e: PointerEvent) => {
      if (last && !last.contains(e.relatedTarget as Node | null)) last = null
    }
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a, button')
      if (el && !el.closest('.sound-toggle')) click()
    }
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
