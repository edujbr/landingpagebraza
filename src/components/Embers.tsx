'use client'

import { useEffect, useState, type CSSProperties } from 'react'

type Ember = { left: string; style: CSSProperties }

export function Embers() {
  const [embers, setEmbers] = useState<Ember[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const count = window.innerWidth < 760 ? 14 : 26
    setEmbers(Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      style: {
        '--s': `${2 + Math.random() * 5}px`,
        '--d': `${7 + Math.random() * 8}s`,
        '--delay': `${-Math.random() * 12}s`,
        '--x': `${(Math.random() - 0.5) * 160}px`,
      } as CSSProperties,
    })))
  }, [])

  return (
    <div className="embers" aria-hidden="true">
      {embers.map((e, i) => <i key={i} style={{ left: e.left, ...e.style }} />)}
    </div>
  )
}
