'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Photo } from '@/content/site'
import { whoosh } from '@/lib/sound'

/** 4 colunas no desktop; no celular cada par vira uma coluna (A+B, C+D). */
const COLS = 4
const PAIRS = [[0, 1], [2, 3]]

export function Gallery({ photos }: { photos: Photo[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState(0)
  const touchX = useRef<number | null>(null)

  const go = (i: number) => {
    if (dialog.current?.open) whoosh(i > current, 0.35)
    setCurrent((i + photos.length) % photos.length)
  }
  const open = (i: number) => {
    go(i)
    dialog.current?.showModal()
    whoosh(true, 0.6)
  }
  const photo = photos[current]

  return (
    <>
      <div className="g-grid">
        {PAIRS.map((pair) => (
          <div key={pair.join()} className="g-pair">
            {pair.map((col) => (
              <div key={col} className="g-col">
                {photos.map((p, i) => i % COLS === col && (
                  <button key={i} className="tile" type="button" onClick={() => open(i)} aria-label={`Ampliar foto: ${p.alt}`}>
                    <Image src={p.src} alt={p.alt} placeholder="blur" sizes="(max-width: 760px) 50vw, 25vw" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label="Foto ampliada"
        onClick={(e) => { if (e.target === dialog.current) dialog.current?.close() }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(current - 1)
          if (e.key === 'ArrowRight') go(current + 1)
        }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1))
          touchX.current = null
        }}
      >
        <button type="button" className="lightbox-close" aria-label="Fechar" onClick={() => dialog.current?.close()}>×</button>
        <button type="button" className="lightbox-nav prev" aria-label="Foto anterior" onClick={() => go(current - 1)}>‹</button>
        <Image key={current} src={photo.src} alt={photo.alt} sizes="(max-width: 760px) 92vw, 720px" />
        <button type="button" className="lightbox-nav next" aria-label="Próxima foto" onClick={() => go(current + 1)}>›</button>
      </dialog>
    </>
  )
}
