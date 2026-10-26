'use client'

import type { ReactNode, Ref } from 'react'

import Link from 'next/link'

type ButtonProps = {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  external?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
} & Record<string, unknown>

const baseStyles =
  'inline-block rounded font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background focus:outline-none'

const buttonStyle = 'bg-primary text-text hover:bg-primary/90'

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export const Button = ({
  size = 'md',
  href,
  external = false,
  className = '',
  children,
  onClick,
  type = 'button',
  disabled = false,
  ref,
  ...props
}: ButtonProps) => {
  const buttonClasses = `${baseStyles} ${buttonStyle} ${sizes[size]} ${className}`

  if (href) {
    // Extract only props relevant for anchor/link elements
    const {
      onClick: _onClick,
      type: _type,
      disabled: _disabled,
      ref: _ref,
      size: _size,
      external: _external,
      ...linkProps
    } = props

    if (external) {
      return (
        <a
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          className={buttonClasses}
          {...(linkProps as Record<string, unknown>)}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className={buttonClasses}
        {...(linkProps as Record<string, unknown>)}
      >
        {children}
      </Link>
    )
  }

  // Extract only props relevant for button elements
  const {
    href: _href,
    external: _external,
    size: _size,
    ...buttonProps
  } = props

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...(buttonProps as Record<string, unknown>)}
    >
      {children}
    </button>
  )
}

Button.displayName = 'Button'
