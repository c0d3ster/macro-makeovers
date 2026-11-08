import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'

type HomeHeroProps = {
  title: string
  tagline: string
}

export const HomeHero = ({ title, tagline }: HomeHeroProps): ReactElement => (
  <header className='max-w-3xl'>
    <h1 className='mb-4 text-4xl font-bold text-text sm:text-5xl'>{title}</h1>
    <p className='mb-3 text-lg text-text sm:text-xl'>{tagline}.</p>
    <p className='mb-8 text-base text-text-muted sm:text-lg'>
      Every recipe starts from a dish worth eating and gets rebuilt ingredient
      by ingredient: a leaner base, more protein, and the flavor put back with
      spice and technique. The traditional numbers sit next to the makeover, so
      you see exactly what changed.
    </p>
    <div className='flex flex-wrap gap-3'>
      <Button href='/recipes'>Browse recipes</Button>
      <Button href='/guides/nutrition' variant='outline'>
        How the macros work
      </Button>
    </div>
  </header>
)
