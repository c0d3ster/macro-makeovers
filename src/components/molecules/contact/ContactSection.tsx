import type { ReactElement } from 'react'

import { ContactForm } from './ContactForm'

// The makeover idea form as a page closer. The band is see-through, so the page pattern shows
// behind it while the fields stay solid.
export const ContactSection = (): ReactElement => (
  <section id='contact' className='bg-surface/25 py-10'>
    <ContactForm />
  </section>
)
