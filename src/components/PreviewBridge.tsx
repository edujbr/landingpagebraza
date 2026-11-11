'use client'

import { useEffect } from 'react'

export type PreviewMessage = { type: 'braza:focus'; slot: string } | { type: 'braza:scroll'; anchor: string }

/**
 * Só age quando o site está aberto dentro do pré-visualizador do /admin (`?preview=1` num iframe).
 * O painel manda o "slot" de uma foto (ex.: `gallery.3`) e a página rola até ela e acende um contorno.
 */
export function PreviewBridge() {
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('preview') || window.parent === window) return

    let timer = 0
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return
      if (e.data.type === 'braza:scroll') {
        const el = document.getElementById(e.data.anchor)
        el?.scrollIntoView({ block: 'start' })
        return
      }
      if (e.data.type !== 'braza:focus') return
      document.querySelectorAll('.slot-focus').forEach((el) => el.classList.remove('slot-focus'))
      const el = document.querySelector<HTMLElement>(`[data-slot="${CSS.escape(e.data.slot)}"]`)
      if (!el) return
      el.scrollIntoView({ block: 'center', inline: 'center' })
      el.classList.add('slot-focus')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => el.classList.remove('slot-focus'), 2600)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'braza:ready' }, location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return null
}
