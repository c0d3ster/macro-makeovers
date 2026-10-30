import type { ReactElement } from 'react'

import Image from 'next/image'

type RecipeImageProps = {
  imageUrl?: string
  title: string
}

const frame = 'aspect-[4/3] w-full rounded-xl'

// The recipe photo, or a placeholder with the logo mark until one is uploaded
export const RecipeImage = ({
  imageUrl,
  title,
}: RecipeImageProps): ReactElement => {
  if (imageUrl) {
    return (
      // Photos come from storage we don't control yet, so skip the image optimizer
      <img src={imageUrl} alt={title} className={`${frame} object-cover`} />
    )
  }

  return (
    <div
      role='img'
      aria-label={`Photo of ${title} coming soon`}
      className={`${frame} flex flex-col items-center justify-center gap-3 border border-text-muted/30 bg-surface`}
    >
      <Image
        src='/logo.png'
        alt=''
        width={411}
        height={554}
        className='h-20 w-auto opacity-40'
      />
      <span className='text-xs text-text-muted'>Photo coming soon</span>
    </div>
  )
}
