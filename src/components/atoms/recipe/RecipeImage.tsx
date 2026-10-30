import type { ReactElement } from 'react'

import Image from 'next/image'

type RecipeImageProps = {
  imageUrl?: string
  title: string
}

// The placeholder photos are 3:2
const frame = 'aspect-[3/2] w-full rounded-xl'

// Matches the recipe page's right column: 24rem from the large breakpoint, full width below
const PHOTO_SIZES = '(min-width: 1024px) 384px, 100vw'

// The recipe photo, or a placeholder with the logo mark when there is none
export const RecipeImage = ({
  imageUrl,
  title,
}: RecipeImageProps): ReactElement => {
  // Photos in public/ go through the image optimizer, so a 2.5MB PNG is not what a phone loads
  if (imageUrl?.startsWith('/')) {
    return (
      <div className={`relative overflow-hidden ${frame}`}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes={PHOTO_SIZES}
          className='object-cover'
        />
      </div>
    )
  }

  if (imageUrl) {
    return (
      // Uploaded photos come from storage we have not configured for the optimizer yet
      <img src={imageUrl} alt={title} className={`${frame} object-cover`} />
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
