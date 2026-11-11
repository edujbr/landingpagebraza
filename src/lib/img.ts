import type { Img } from './content-types'

/** Props do <Image> do Next para uma imagem vinda do banco (com ou sem desfoque de carregamento). */
export function imgProps(img: Img, fill = false) {
  const blur = img.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: img.blurDataURL } : {}
  return fill ? { src: img.src, ...blur } : { src: img.src, width: img.width, height: img.height, ...blur }
}
