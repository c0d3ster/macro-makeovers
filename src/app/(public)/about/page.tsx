import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { Button, Prose } from '@/components/atoms'
import { ContactForm } from '@/components/molecules'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { readAbout } from '@/libs/guides'

export const metadata: Metadata = {
  title: 'About',
  description: `Why ${Env.NEXT_PUBLIC_BRAND_NAME} exists: comfort food rebuilt to keep the flavor while cutting the fat and adding protein.`,
  alternates: { canonical: '/about' },
}

const AboutPage = (): ReactElement => (
  <LandingPageTemplate activeItem='about'>
    <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
      <h1 className='mb-8 text-3xl font-bold text-text sm:text-4xl'>
        About {Env.NEXT_PUBLIC_BRAND_NAME}
      </h1>
      <Prose>{readAbout()}</Prose>
      <div className='mt-10 flex flex-wrap gap-3'>
        <Button href='/recipes'>Browse recipes</Button>
        <Button href='/guides' variant='outline'>
          Read the guides
        </Button>
      </div>
    </main>

    <div id='contact' className='bg-surface py-16'>
      <ContactForm />
    </div>
  </LandingPageTemplate>
)

export default AboutPage
