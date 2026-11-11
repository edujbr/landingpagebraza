'use client'

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { LINKS, type LinkKey, type Links } from '@/lib/store'

const LinksContext = createContext<Links>(LINKS)

/** Entrega para a página os links atuais (o WhatsApp vem do painel /admin). */
export function LinksProvider({ links, children }: { links: Links; children: ReactNode }) {
  return <LinksContext.Provider value={links}>{children}</LinksContext.Provider>
}

type Props = Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel'> & { to: LinkKey }

export function ExtLink({ to, ...rest }: Props) {
  const links = useContext(LinksContext)
  return <a href={links[to]} target="_blank" rel="noopener noreferrer" {...rest} />
}
