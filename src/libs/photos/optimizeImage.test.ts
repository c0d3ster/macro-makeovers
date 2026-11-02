import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { toWebJpeg } from './optimizeImage'

const makePng = async (): Promise<Uint8Array<ArrayBuffer>> => {
  const png = await sharp({
    create: {
      width: 96,
      height: 64,
      channels: 3,
      background: { r: 200, g: 90, b: 40 },
    },
  })
    .png()
    .toBuffer()
  return Uint8Array.from(png)
}

describe('toWebJpeg', () => {
  it('returns a JPEG with the same pixel size', async () => {
    const jpeg = await toWebJpeg(await makePng())
    const meta = await sharp(jpeg).metadata()

    expect(meta.format).toBe('jpeg')
    expect(meta.width).toBe(96)
    expect(meta.height).toBe(64)
  })

  it('writes a progressive file', async () => {
    const meta = await sharp(await toWebJpeg(await makePng())).metadata()

    expect(meta.isProgressive).toBe(true)
  })

  it('rejects bytes that are not an image', async () => {
    await expect(toWebJpeg(new Uint8Array([1, 2, 3]))).rejects.toThrow()
  })
})
