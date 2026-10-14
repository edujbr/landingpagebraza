import type { ComponentProps } from 'react'
import { LINKS, type LinkKey } from '@/lib/store'

type Props = Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel'> & { to: LinkKey }

export function ExtLink({ to, ...rest }: Props) {
  return <a href={LINKS[to]} target="_blank" rel="noopener noreferrer" {...rest} />
}
