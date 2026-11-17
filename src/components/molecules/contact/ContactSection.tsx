import type { ReactElement } from 'react'

import { ContactForm } from './ContactForm'

type ContactSectionProps = {
  className?: string
}

// The makeover idea form in the same box as the email sign-up. The footer's "Suggest a makeover"
// links here, so the scroll margin keeps the heading clear of the fixed header.
export const ContactSection = ({ className = '' }: ContactSectionProps): ReactElement => (
  <section id='contact' className={`scroll-mt-24 ${className}`}>
    <div className='rounded-2xl bg-surface p-6 sm:p-8'>
      <ContactForm />
    </div>
  </section>
)
