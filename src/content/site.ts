import type { StaticImageData } from 'next/image'
import type { SiteContent } from '@/lib/content-types'

import food01 from '@/assets/img/food-01.jpg'
import food02 from '@/assets/img/food-02.jpg'
import food03 from '@/assets/img/food-03.jpg'
import food04 from '@/assets/img/food-04.jpg'
import food05 from '@/assets/img/food-05.jpg'
import food06 from '@/assets/img/food-06.jpg'
import heroMelt from '@/assets/img/hero-melt.jpg'
import sigBacon from '@/assets/img/sig-bacon.jpg'
import sigBaconnator from '@/assets/img/sig-baconnator.jpg'
import sigSmash from '@/assets/img/sig-smash.jpg'
import sigTita from '@/assets/img/sig-tita.jpg'
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

/** Fotos que vêm com o site; o banco se refere a elas como `static:<nome>`. */
export const STATIC_IMAGES: Record<string, StaticImageData> = {
  'food-01': food01,
  'food-02': food02,
  'food-03': food03,
  'food-04': food04,
  'food-05': food05,
  'food-06': food06,
  'hero-melt': heroMelt,
  'sig-bacon': sigBacon,
  'sig-baconnator': sigBaconnator,
  'sig-smash': sigSmash,
  'sig-tita': sigTita,
  'strip-01': strip01,
  'strip-02': strip02,
  'strip-03': strip03,
  'strip-04': strip04,
  'strip-05': strip05,
  'strip-06': strip06,
  'strip-07': strip07,
  'strip-08': strip08,
  'strip-09': strip09,
  'strip-10': strip10,
  'vibe-01': vibe01,
  'vibe-02': vibe02,
  'vibe-03': vibe03,
  'vibe-04': vibe04,
  'vibe-05': vibe05,
  'vibe-06': vibe06,
  'vibe-07': vibe07,
  'vibe-08': vibe08,
  'vibe-09': vibe09,
  'vibe-10': vibe10,
  'vibe-11': vibe11,
  'vibe-12': vibe12,
}

/** Conteúdo padrão: vale até alguém salvar a seção no painel /admin. */
export const DEFAULT_CONTENT: SiteContent = {
  hero: { image: 'static:hero-melt', alt: 'Burger com bacon, queijo derretido e cebolinha sobre tábua de madeira' },
  rankingBackdrop: { image: 'static:vibe-07', alt: '' },
  stories: [
    { label: 'Cardápio', hint: 'Todos os lanches', image: 'static:sig-bacon', link: 'menu' },
    { label: 'Pedir', hint: 'Delivery ou retirada', image: 'static:food-04', link: 'order' },
    { label: 'WhatsApp', hint: 'Fale com a gente', image: 'static:vibe-03', link: 'whatsapp' },
    { label: 'Instagram', hint: '@brazaforte', image: 'static:vibe-07', link: 'instagram' },
    { label: 'Ranking', hint: 'Quem mais pediu', image: 'static:vibe-05', href: '#ranking' },
    { label: 'Avaliar', hint: 'Nota no Google', image: 'static:vibe-01', link: 'googleReview' },
    { label: 'Como chegar', hint: 'Centro, Sapezal', image: 'static:vibe-11', link: 'maps' },
    { label: 'Som da casa', hint: 'Playlist no Spotify', image: 'static:vibe-06', link: 'spotify' },
  ],
  reel: [
    { image: 'static:strip-01', alt: 'Burger com bacon e cheddar sobre tábua de madeira' },
    { image: 'static:strip-02', alt: 'Burger com fritas e balde de gelo ao fundo' },
    { image: 'static:strip-03', alt: 'Cheeseburger segurado com as duas mãos' },
    { image: 'static:strip-04', alt: 'Burger com bacon em tronco de madeira' },
    { image: 'static:strip-05', alt: 'Burger servido em prato de inox com bandeirinha da casa' },
    { image: 'static:strip-06', alt: 'Burger cortado ao meio mostrando o recheio' },
    { image: 'static:strip-07', alt: 'Burger alto com bacon sobre madeira' },
    { image: 'static:strip-08', alt: 'Burger com fritas na tábua' },
    { image: 'static:strip-09', alt: 'Burger com fritas e bebida gelada' },
    { image: 'static:strip-10', alt: 'Burger com cheddar derretido' },
  ],
  signatures: [
    {
      name: 'Braza Bacon',
      tag: 'O mais pedido',
      seal: 'O mais pedido',
      description: 'O queridinho da casa: burger suculento, cheddar e bacon crocante.',
      image: 'static:sig-bacon',
      alt: 'Braza Bacon com cheddar, bacon e maionese da casa',
    },
    {
      name: 'Baconnator',
      tag: 'O rei das vendas',
      seal: '',
      description: 'Pão australiano, bacon, mussarela, cebola caramelizada e crispy, com BBQ.',
      image: 'static:sig-baconnator',
      alt: 'Baconnator com camadas de bacon e cheddar',
    },
    {
      name: 'Braza Smash',
      tag: 'Viciante',
      seal: '',
      description: 'Dois smash de 80g, cheddar, cebola, picles e mostarda no brioche.',
      image: 'static:sig-smash',
      alt: 'Smash burger com cheddar derretido',
    },
    {
      name: 'Titã',
      tag: 'Pra quem tem fome',
      seal: '',
      description: 'Duas carnes de 180g, bacon, Catupiry®, alho e cebola crispy.',
      image: 'static:sig-tita',
      alt: 'Titã, burger alto com duas carnes e bacon',
    },
  ],
  gallery: [
    { image: 'static:vibe-02', alt: 'Cliente sorrindo com um burger na mesa' },
    { image: 'static:food-01', alt: 'Burger com bacon e balde de fritas' },
    { image: 'static:vibe-04', alt: 'Cliente segurando burger com cheddar' },
    { image: 'static:food-04', alt: 'Mesa vista de cima com burger, fritas e refrigerante' },
    { image: 'static:vibe-08', alt: 'Drink de limão em copo com a marca da casa' },
    { image: 'static:food-03', alt: 'Burger cortado ao meio e porção de fritas' },
    { image: 'static:vibe-01', alt: 'Cliente com batata frita, burger e Coca-Cola' },
    { image: 'static:food-02', alt: 'Burger alto com bacon em tronco de madeira' },
    { image: 'static:vibe-09', alt: 'Cliente segurando o burger com as duas mãos' },
    { image: 'static:food-06', alt: 'Mesa de madeira com burger, fritas e molho' },
    { image: 'static:vibe-10', alt: 'Cliente comendo fritas no salão' },
    { image: 'static:food-05', alt: 'Burger com cheddar no prato de inox' },
    { image: 'static:vibe-12', alt: 'Cliente com drink e o logo da casa ao fundo' },
  ],
}

export const ticker = [
  'Pão selado na hora', 'Burger 180g', 'Bacon crocante', 'Sapezal · MT',
  'Combos pra dividir', 'Cheddar derretendo', 'Fritas do Braza', '#VEMPROBRAZA',
]

export const marquee = {
  main: ['Hambúrguer artesanal', 'Na brasa', '#VEMPROBRAZA', 'Sapezal · MT', 'Delivery e salão'],
  back: ['Braza Forte', 'Burger 180g', 'Feito na hora', 'Braza Forte', 'Mesa cheia'],
}
