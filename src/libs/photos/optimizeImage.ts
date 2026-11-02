import sharp from 'sharp'

// The web quality used for every stored photo
export const WEB_JPEG_QUALITY = 85

// Turns the high resolution PNG from the image model into a progressive web JPEG at quality 85.
// The pixel size is kept, so it stays the same 3:2 shape as the book photos.
export const toWebJpeg = async (
  image: Uint8Array<ArrayBuffer>
): Promise<Uint8Array<ArrayBuffer>> => {
  const jpeg = await sharp(image)
    .jpeg({ quality: WEB_JPEG_QUALITY, progressive: true, mozjpeg: true })
    .toBuffer()
  return Uint8Array.from(jpeg)
}
