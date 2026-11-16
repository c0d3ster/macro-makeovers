/* eslint-disable react-refresh/only-export-components -- Next requires these route exports beside the component */
import { ImageResponse } from 'next/og'
import { Buffer } from 'node:buffer'

import { loadRecipe } from './loadRecipe'
import { NotFoundCard, ShareCard } from './shareCard'

export const alt = 'Recipe preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type ImageProps = {
  params: Promise<{ slug: string }>
}

// The share image renderer only reads JPEG and PNG
const PHOTO_TYPES = ['image/jpeg', 'image/png']

// The photo as a data URL, or nothing when it is missing, unreadable, or a format the renderer
// can't draw, so a bad photo falls back to the text card instead of breaking the preview
const loadPhoto = async (url?: string): Promise<string | undefined> => {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    const type = res.headers.get('content-type')?.split(';')[0] ?? ''
    if (!res.ok || !PHOTO_TYPES.includes(type)) return undefined
    const data = Buffer.from(await res.arrayBuffer()).toString('base64')
    return `data:${type};base64,${data}`
  } catch {
    return undefined
  }
}

const Image = async ({ params }: ImageProps): Promise<ImageResponse> => {
  const { slug } = await params
  const recipe = await loadRecipe(slug)

  if (!recipe) return new ImageResponse(<NotFoundCard />, size)

  const { title, featured, imageUrl } = recipe
  const photo = await loadPhoto(featured.imageUrl ?? imageUrl)

  return new ImageResponse(
    <ShareCard title={title} macros={featured} imageUrl={photo} />,
    size
  )
}

export default Image
