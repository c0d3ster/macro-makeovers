import type { ReactElement } from 'react'

import Image from 'next/image'

type RecipeImageProps = {
  imageUrl?: string
  title: string
  // Where the image is shown, so the optimizer sends the right size
  sizes?: string
  // Load right away. Leave off for images below the fold.
  priority?: boolean
  // Square the corners when the image fills the top of a rounded card
  rounded?: boolean
  // Slowly zoom in while the parent with the `group` class is hovered
  zoomOnHover?: boolean
  // What the placeholder says while there is no photo
  placeholderText?: string
  // A thumbnail: the placeholder shows a small logo and no text
  thumbnail?: boolean
}

// The placeholder photos are 3:2
const frameFor = (rounded: boolean): string =>
  `aspect-[3/2] w-full ${rounded ? 'rounded-xl' : ''}`

// Scales inside the clipped frame. Skipped for people who ask for less motion.
const ZOOM =
  'transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'

// Matches the recipe page's right column: 24rem from the large breakpoint, full width below
const DEFAULT_SIZES = '(min-width: 1024px) 384px, 100vw'

// The recipe photo, or a placeholder with the logo mark when there is none
export const RecipeImage = ({
  imageUrl,
  title,
  sizes = DEFAULT_SIZES,
  priority = true,
  rounded = true,
  zoomOnHover = false,
  placeholderText = 'Photo coming soon',
  thumbnail = false,
}: RecipeImageProps): ReactElement => {
  const frame = frameFor(rounded)
  const zoom = zoomOnHover ? ZOOM : ''

  // Photos live in R2 and go through the image optimizer, so a phone never loads the full-size
  // original. The R2 host is allowed in next.config.ts (R2_PUBLIC_URL).
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${frame}`}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${zoom}`}
        />
      </div>
    )
  }

  return (
    <div
      role='img'
      aria-label={
        placeholderText === 'Photo coming soon'
          ? `Photo of ${title} coming soon`
          : placeholderText
      }
      className={`${frame} flex flex-col items-center justify-center gap-3 border border-header-muted/30 bg-header`}
    >
      <Image
        src='/logo.png'
        alt=''
        width={411}
        height={554}
        className={thumbnail ? 'h-8 w-auto' : 'h-20 w-auto'}
      />
      {!thumbnail && (
        <span className='text-xs text-header-muted'>{placeholderText}</span>
      )}
    </div>
  )
}
