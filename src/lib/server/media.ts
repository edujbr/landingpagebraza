import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp, { type OutputInfo } from 'sharp'
import { addMedia } from './content'
import { UPLOADS_DIR } from './db'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const MEDIA_ID = /^[a-f0-9]{24}\.webp$/

/**
 * Recebe a foto do painel e guarda uma versão otimizada:
 * gira conforme o EXIF do celular, limita a 2400px, converte para WebP e gera o desfoque de carregamento.
 */
export async function saveUpload(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Envie um arquivo de imagem (JPG, PNG, WebP ou HEIC).')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Foto muito grande: o limite é 20 MB.')
  const input = Buffer.from(await file.arrayBuffer())

  let out: { data: Buffer; info: OutputInfo }
  let blur: Buffer
  try {
    const base = sharp(input, { failOn: 'none' }).rotate()
    out = await base.clone()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    blur = await base.clone().resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()
  } catch {
    throw new Error('Não consegui ler essa imagem. Tente salvar como JPG e enviar de novo.')
  }

  const id = `${crypto.randomBytes(12).toString('hex')}.webp`
  await fs.writeFile(path.join(UPLOADS_DIR, id), out.data)
  const name = file.name.replace(/\.[^.]+$/, '').slice(0, 60)
  return addMedia({ id, width: out.info.width, height: out.info.height, blur: `data:image/webp;base64,${blur.toString('base64')}`, name })
}
