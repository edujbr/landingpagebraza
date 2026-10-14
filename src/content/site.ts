import type { StaticImageData } from 'next/image'
import type { LinkKey } from '@/lib/store'

import heroMelt from '@/assets/img/hero-melt.jpg'
import sigBacon from '@/assets/img/sig-bacon.jpg'
import sigBaconnator from '@/assets/img/sig-baconnator.jpg'
import sigSmash from '@/assets/img/sig-smash.jpg'
import sigTita from '@/assets/img/sig-tita.jpg'
import vibe01 from '@/assets/img/vibe-01.jpg'
import vibe02 from '@/assets/img/vibe-02.jpg'
import vibe03 from '@/assets/img/vibe-03.jpg'
import vibe04 from '@/assets/img/vibe-04.jpg'
import vibe05 from '@/assets/img/vibe-05.jpg'
import vibe06 from '@/assets/img/vibe-06.jpg'
import vibe07 from '@/assets/img/vibe-07.jpg'
import vibe08 from '@/assets/img/vibe-08.jpg'
import vibe09 from '@/assets/img/vibe-09.jpg'
import vibe10 from '@/assets/img/vibe-10.jpg'
import vibe11 from '@/assets/img/vibe-11.jpg'
import vibe12 from '@/assets/img/vibe-12.jpg'
import food01 from '@/assets/img/food-01.jpg'
import food02 from '@/assets/img/food-02.jpg'
import food03 from '@/assets/img/food-03.jpg'
import food04 from '@/assets/img/food-04.jpg'
import food05 from '@/assets/img/food-05.jpg'
import food06 from '@/assets/img/food-06.jpg'
import strip01 from '@/assets/img/strip-01.jpg'
import strip02 from '@/assets/img/strip-02.jpg'
import strip03 from '@/assets/img/strip-03.jpg'
import strip04 from '@/assets/img/strip-04.jpg'
import strip05 from '@/assets/img/strip-05.jpg'
import strip06 from '@/assets/img/strip-06.jpg'
import strip07 from '@/assets/img/strip-07.jpg'
import strip08 from '@/assets/img/strip-08.jpg'
import strip09 from '@/assets/img/strip-09.jpg'
import strip10 from '@/assets/img/strip-10.jpg'

export type Photo = { src: StaticImageData; alt: string }

export const hero = { src: heroMelt, alt: 'Burger com bacon, queijo derretido e cebolinha sobre tábua de madeira' }
export const rankingBackdrop = vibe07

export type Story = { label: string; hint: string; image: StaticImageData; link?: LinkKey; href?: string }

export const stories: Story[] = [
  { label: 'Cardápio', hint: 'Todos os lanches', image: sigBacon, link: 'menu' },
  { label: 'Pedir', hint: 'Delivery ou retirada', image: food04, link: 'order' },
  { label: 'WhatsApp', hint: 'Fale com a gente', image: vibe03, link: 'whatsapp' },
  { label: 'Instagram', hint: '@brazaforte', image: vibe07, link: 'instagram' },
  { label: 'Ranking', hint: 'Quem mais pediu', image: vibe05, href: '#ranking' },
  { label: 'Avaliar', hint: 'Nota no Google', image: vibe01, link: 'googleReview' },
  { label: 'Como chegar', hint: 'Centro, Sapezal', image: vibe11, link: 'maps' },
  { label: 'Som da casa', hint: 'Playlist no Spotify', image: vibe06, link: 'spotify' },
]

export const reel: Photo[] = [
  { src: strip01, alt: 'Burger com bacon e cheddar sobre tábua de madeira' },
  { src: strip02, alt: 'Burger com fritas e balde de gelo ao fundo' },
  { src: strip03, alt: 'Cheeseburger segurado com as duas mãos' },
  { src: strip04, alt: 'Burger com bacon em tronco de madeira' },
  { src: strip05, alt: 'Burger servido em prato de inox com bandeirinha da casa' },
  { src: strip06, alt: 'Burger cortado ao meio mostrando o recheio' },
  { src: strip07, alt: 'Burger alto com bacon sobre madeira' },
  { src: strip08, alt: 'Burger com fritas na tábua' },
  { src: strip09, alt: 'Burger com fritas e bebida gelada' },
  { src: strip10, alt: 'Burger com cheddar derretido' },
]

export const ticker = [
  'Pão selado na hora', 'Burger 180g', 'Bacon crocante', 'Sapezal · MT',
  'Combos pra dividir', 'Cheddar derretendo', 'Fritas do Braza', '#VEMPROBRAZA',
]

export type Signature = { name: string; tag: string; description: string; image: Photo }

export const signatures: Signature[] = [
  {
    name: 'Braza Bacon',
    tag: 'O mais pedido',
    description: 'O queridinho da casa: burger suculento, cheddar e bacon crocante.',
    image: { src: sigBacon, alt: 'Braza Bacon com cheddar, bacon e maionese da casa' },
  },
  {
    name: 'Baconnator',
    tag: 'O rei das vendas',
    description: 'Pão australiano, bacon, mussarela, cebola caramelizada e crispy, com BBQ.',
    image: { src: sigBaconnator, alt: 'Baconnator com camadas de bacon e cheddar' },
  },
  {
    name: 'Braza Smash',
    tag: 'Viciante',
    description: 'Dois smash de 80g, cheddar, cebola, picles e mostarda no brioche.',
    image: { src: sigSmash, alt: 'Smash burger com cheddar derretido' },
  },
  {
    name: 'Titã',
    tag: 'Pra quem tem fome',
    description: 'Duas carnes de 180g, bacon, Catupiry®, alho e cebola crispy.',
    image: { src: sigTita, alt: 'Titã, burger alto com duas carnes e bacon' },
  },
]

export const gallery: Photo[] = [
  { src: vibe02, alt: 'Cliente sorrindo com um burger na mesa' },
  { src: food01, alt: 'Burger com bacon e balde de fritas' },
  { src: vibe04, alt: 'Cliente segurando burger com cheddar' },
  { src: food04, alt: 'Mesa vista de cima com burger, fritas e refrigerante' },
  { src: vibe08, alt: 'Drink de limão em copo com a marca da casa' },
  { src: food03, alt: 'Burger cortado ao meio e porção de fritas' },
  { src: vibe01, alt: 'Cliente com batata frita, burger e Coca-Cola' },
  { src: food02, alt: 'Burger alto com bacon em tronco de madeira' },
  { src: vibe09, alt: 'Cliente segurando o burger com as duas mãos' },
  { src: food06, alt: 'Mesa de madeira com burger, fritas e molho' },
  { src: vibe10, alt: 'Cliente comendo fritas no salão' },
  { src: food05, alt: 'Burger com cheddar no prato de inox' },
  { src: vibe12, alt: 'Cliente com drink e o logo da casa ao fundo' },
]
