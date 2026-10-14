import Image from 'next/image'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { rankingBackdrop } from '@/content/site'
import { displayName, ordersLabel, phoneTail } from '@/lib/format'
import type { PublishedRanking } from '@/lib/ranking'

export function Ranking({ ranking }: { ranking: PublishedRanking | null }) {
  const entries = ranking?.entries ?? []
  const podium = entries.slice(0, 3)
  const runners = entries.slice(3)

  return (
    <section id="ranking" className="ranking">
      <div className="ranking-bg" aria-hidden="true">
        <Image src={rankingBackdrop} alt="" fill sizes="100vw" />
      </div>
      <div className="shell">
        <header className="section-head">
          <p className="eyebrow" data-reveal>Ranking BRAZA FORTE</p>
          <SplitHeading text="Quem mais" accent="pediu" />
          <p className="section-lead" data-reveal>
            {ranking?.period_label
              ? `Os clientes que mais pediram em ${ranking.period_label}. Será que você está aqui?`
              : 'Os clientes que mais pediram no período. Será que você está aqui?'}
          </p>
        </header>

        <div className="podium">
          {podium.length === 0 && <p className="ranking-empty">Ranking em breve. Quem será o Rei do Braza?</p>}
          {podium.map((e) => {
            const name = displayName(e.customer_name)
            return (
              <div key={e.position} className={`podium-spot pos-${e.position}`}>
                <div className="podium-avatar" aria-hidden="true">
                  {e.position === 1 && <span className="crown"><i /></span>}
                  {name.charAt(0)}
                </div>
                <div className="podium-name">{name}</div>
                <div className="podium-meta">{phoneTail(e.phone_last_four)}</div>
                <div className="podium-block">
                  <span className="podium-count">{e.order_count}</span>
                  <span className="podium-count-label">{ordersLabel(e.order_count)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {runners.length > 0 && (
          <ol className="runners">
            {runners.map((e) => (
              <li key={e.position}>
                <span className="runner-pos">{e.position}º</span>
                <span className="runner-name">
                  {displayName(e.customer_name)}
                  <small>{phoneTail(e.phone_last_four)}</small>
                </span>
                <span className="runner-count">{e.order_count} {ordersLabel(e.order_count)}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="ranking-note">
          Por privacidade, mostramos o primeiro nome, a inicial do sobrenome e os 4 últimos dígitos do telefone.
        </p>
      </div>
    </section>
  )
}
