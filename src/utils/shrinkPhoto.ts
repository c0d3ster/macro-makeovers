// The long edge photos are stored at. Larger than the 1536px the generator makes, smaller than a
// phone camera's 4000px and up.
const MAX_EDGE = 2048
const JPEG_QUALITY = 0.9

const toJpegBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not shrink the photo'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })

// Shrinks a photo in the browser before upload, so a phone photo fits under the server's size
// limit. A photo already small enough comes back as it is.
export const shrinkPhoto = async (file: File): Promise<File> => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.type === 'image/jpeg') {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const name = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return new File([await toJpegBlob(canvas)], `${name}.jpg`, {
    type: 'image/jpeg',
  })
}
