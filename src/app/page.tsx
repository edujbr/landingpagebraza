import Image from 'next/image'
import logo from '@/assets/logo.jpeg'
import { ExtLink } from '@/components/ExtLink'
import { Gallery } from '@/components/Gallery'
import { Ranking } from '@/components/Ranking'
import { CursorGlow } from '@/components/motion/CursorGlow'
import { Magnetic } from '@/components/motion/Magnetic'
import { ScrollScenes } from '@/components/motion/ScrollScenes'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { AssemblyHero } from '@/components/three/AssemblyHero'
import { SoundFx } from '@/components/sound/SoundFx'
import { Topbar } from '@/components/Topbar'
import { gallery, reel, signatures, stories, ticker } from '@/content/site'
import { getPublishedRanking } from '@/lib/ranking'
import { STORE } from '@/lib/store'

export const revalidate = 300

export default async function Home() {
  const ranking = await getPublishedRanking()

  return (
    <>
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      <Topbar />

      <main id="conteudo">
        <AssemblyHero />

        <section id="atalhos" className="links">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow" data-reveal>Tudo em um toque</p>
              <SplitHeading text="Onde você quer" accent="ir?" />
            </header>
            <ul className="stories">
              {stories.map((s) => {
                const inner = (
                  <>
                    <span className="story-ring"><Image src={s.image} alt="" sizes="132px" /></span>
                    <span className="story-label">{s.label}</span>
                    <span className="story-hint">{s.link === 'instagram' ? STORE.instagramHandle : s.hint}</span>
                  </>
                )
                return (
                  <li key={s.label}>
                    {s.link
                      ? <ExtLink to={s.link} className="story">{inner}</ExtLink>
                      : <a href={s.href} className="story">{inner}</a>}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="reel" aria-label="Fotos dos lanches">
          <div className="reel-track">
            {[...reel, ...reel].map((p, i) => (
              <Image
                key={i}
                src={p.src}
                alt={i < reel.length ? p.alt : ''}
                aria-hidden={i >= reel.length || undefined}
                sizes="240px"
                className={i >= reel.length ? 'reel-clone' : undefined}
              />
            ))}
          </div>
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[...ticker, ...ticker].map((t, i) => <span key={i}>{t}</span>)}
            </div>
          </div>
        </section>

        <section id="assinaturas" className="signatures">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow" data-reveal>Da montagem à primeira mordida</p>
              <SplitHeading text="Os que fazem" accent="fila" />
              <p className="section-lead" data-reveal>
                Quatro clássicos da casa. Preços, combos e o cardápio completo ficam no cardápio digital, sempre atualizados.
              </p>
            </header>
            <div className="sig-rail">
              <div className="sig-grid">
                {signatures.map((s) => (
                  <article key={s.name} className="sig-card">
                    <ExtLink to="menu">
                      <figure>
                        <Image src={s.image.src} alt={s.image.alt} placeholder="blur" sizes="(max-width: 760px) 78vw, (max-width: 1024px) 50vw, 340px" />
                      </figure>
                      <div className="sig-body">
                        <span className="sig-tag">{s.tag}</span>
                        <h3>{s.name}</h3>
                        <p>{s.description}</p>
                        <span className="sig-cta">Ver no cardápio</span>
                      </div>
                    </ExtLink>
                  </article>
                ))}
              </div>
            </div>
            <div className="center sig-cta-wrap" data-reveal>
              <ExtLink to="menu" className="btn">Abrir cardápio completo</ExtLink>
            </div>
          </div>
        </section>

        <Ranking ranking={ranking} />

        <section id="galeria" className="gallery">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow" data-reveal>Noite de Braza</p>
              <SplitHeading text="Mesa cheia," accent="casa quente" />
            </header>
            <Gallery photos={gallery} />
          </div>
        </section>

        <section className="cta-band">
          <div className="shell cta-inner">
            <SplitHeading text="Bateu a fome?" accent="A brasa tá acesa." />
            <div className="hero-actions" data-reveal>
              <ExtLink to="order" className="btn">Pedir agora</ExtLink>
              <ExtLink to="whatsapp" className="btn btn-ghost">Chamar no WhatsApp</ExtLink>
            </div>
          </div>
        </section>

        <section id="visite" className="visit">
          <div className="shell visit-grid">
            <div className="visit-info" data-reveal>
              <p className="eyebrow">Visite o salão</p>
              <SplitHeading text="Vem pro" accent="Braza" />
              <address>
                <strong>Avenida Rotary Internacional, 210</strong><br />
                Centro · Sapezal - MT
              </address>
              <p className="visit-hours">
                Abrimos à noite. Horários do dia e status em tempo real no <ExtLink to="menu">cardápio digital</ExtLink>.
              </p>
              <div className="hero-actions">
                <ExtLink to="maps" className="btn">Traçar rota</ExtLink>
                <ExtLink to="googleReview" className="btn btn-ghost">Avaliar no Google</ExtLink>
              </div>
            </div>
            <div className="visit-map" data-reveal>
              <iframe
                title="Mapa do BRAZA FORTE em Sapezal"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={STORE.mapsEmbedUrl}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <Image src={logo} alt="Logo BRAZA FORTE" width={88} height={88} />
            <p>Hambúrguer artesanal em Sapezal-MT.</p>
          </div>
          <div className="footer-links">
            <ExtLink to="menu">Cardápio</ExtLink>
            <ExtLink to="order">Pedir</ExtLink>
            <ExtLink to="whatsapp">WhatsApp</ExtLink>
            <ExtLink to="instagram">Instagram</ExtLink>
            <ExtLink to="googleReview">Avaliar</ExtLink>
          </div>
          <ExtLink to="spotify" className="spotify">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.86-1.75-6.46-2.14-10.7-1.17a.75.75 0 1 1-.33-1.46c4.64-1.06 8.62-.6 11.8 1.35.36.22.47.69.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.27-2-8.26-2.6-12.13-1.42a.94.94 0 1 1-.55-1.8c4.42-1.34 9.92-.69 13.66 1.62.44.27.58.85.31 1.29Zm.13-3.4C15.18 8.3 8.71 8.08 4.97 9.22a1.12 1.12 0 1 1-.65-2.15c4.3-1.3 11.43-1.05 15.94 1.63a1.12 1.12 0 0 1-1.16 1.93Z" />
            </svg>
            <span><small>Som da casa</small>Ouça no Spotify</span>
          </ExtLink>
        </div>
        <div className="footer-hashtag" aria-hidden="true">#VEMPROBRAZA</div>
        <div className="shell footer-bottom">
          <p>© {new Date().getFullYear()} BRAZA FORTE. Todos os direitos reservados.</p>
        </div>
      </footer>

      <SmoothScroll />
      <ScrollScenes />
      <Magnetic />
      <CursorGlow />
      <SoundFx />
    </>
  )
}
