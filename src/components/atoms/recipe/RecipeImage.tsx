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
}: RecipeImageProps): ReactElement => {
  const frame = frameFor(rounded)
  const zoom = zoomOnHover ? ZOOM : ''

  // Photos in public/ go through the image optimizer, so a phone never loads the full-size original
  if (imageUrl?.startsWith('/')) {
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

  if (imageUrl) {
    return (
      // Uploaded photos come from storage we have not configured for the optimizer yet
      <div className={`overflow-hidden ${frame}`}>
        <img
          src={imageUrl}
          alt={title}
          className={`size-full object-cover ${zoom}`}
        />
      </div>
    )
  }

  return (
    <div
      role='img'
      aria-label={`Photo of ${title} coming soon`}
      className={`${frame} flex flex-col items-center justify-center gap-3 border border-header-muted/30 bg-header`}
    >
      <Image
        src='/logo.png'
        alt=''
        width={411}
        height={554}
        className='h-20 w-auto'
      />
      <span className='text-xs text-header-muted'>Photo coming soon</span>
    </div>
  )
}
