import type { ReactNode } from 'react'

type CleanPageTemplateProps = {
  children: ReactNode
  title: string
  subtitle?: string
  header?: ReactNode
}

export const CleanPageTemplate = ({
  children,
  title,
  subtitle,
  header,
}: CleanPageTemplateProps) => {
  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-text'>{title}</h1>
            {subtitle && <p className='text-text-muted'>{subtitle}</p>}
          </div>
          {header}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
