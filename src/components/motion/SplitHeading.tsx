import { Fragment } from 'react'

type Props = {
  text: string
  accent?: string
  as?: 'h2' | 'h3'
  className?: string
}

function Chars({ text }: { text: string }) {
  return text.split(' ').map((word, w) => (
    <Fragment key={w}>
      {w > 0 && ' '}
      <span className="word">
        {[...word].map((ch, i) => <span key={i} className="char">{ch}</span>)}
      </span>
    </Fragment>
  ))
}

/** Título com letras separadas para a animação de brasa; leitores de tela recebem o texto inteiro. */
export function SplitHeading({ text, accent, as: Tag = 'h2', className }: Props) {
  const label = accent ? `${text} ${accent}` : text
  return (
    <Tag className={`split${className ? ` ${className}` : ''}`} aria-label={label}>
      <span aria-hidden="true">
        <Chars text={text} />
        {accent && (
          <>
            {' '}
            <span className="ember-text"><Chars text={accent} /></span>
          </>
        )}
      </span>
    </Tag>
  )
}
