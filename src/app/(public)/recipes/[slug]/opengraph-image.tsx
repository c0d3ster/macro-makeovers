/* eslint-disable react-refresh/only-export-components -- Next requires these route exports beside the component */
import type { ReactElement } from 'react'

import { ImageResponse } from 'next/og'

import { Env } from '@/libs/Env'
import { toMacroRatios } from '@/libs/recipes'

import { loadRecipe } from './loadRecipe'

export const alt = 'Recipe preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Same palette as the site theme (see global.css)
const COLORS = {
  background: '#111827',
  surface: '#1f2937',
  text: '#ffffff',
  muted: '#9ca3af',
  accent: '#10b981',
}

type ImageProps = {
  params: Promise<{ slug: string }>
}

type StatProps = {
  value: string
  label: string
  highlight?: boolean
}

type CardProps = {
  title: string
  // Title font size, so long names still fit on two lines
  titleSize?: number
  children?: ReactElement
}

const Stat = ({ value, label, highlight = false }: StatProps): ReactElement => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 36px',
      borderRadius: 24,
      background: highlight ? 'rgba(16, 185, 129, 0.2)' : COLORS.surface,
      color: highlight ? COLORS.accent : COLORS.text,
    }}
  >
    <span style={{ fontSize: 64, fontWeight: 700 }}>{value}</span>
    <span style={{ fontSize: 28, color: COLORS.muted }}>{label}</span>
  </div>
)

const Card = ({ title, titleSize = 96, children }: CardProps): ReactElement => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      background: COLORS.background,
      color: COLORS.text,
    }}
  >
    <div style={{ display: 'flex', fontSize: 32, color: COLORS.accent }}>
      {Env.NEXT_PUBLIC_BRAND_NAME}
    </div>
    <div
      style={{
        display: 'flex',
        fontSize: titleSize,
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {title}
    </div>
    <div style={{ display: 'flex', gap: 24 }}>{children}</div>
  </div>
)

const Image = async ({ params }: ImageProps): Promise<ImageResponse> => {
  const { slug } = await params
  const recipe = await loadRecipe(slug)

  // An unknown slug still gets a clean branded card instead of a broken preview
  if (!recipe) return new ImageResponse(<Card title='Recipe not found' />, size)

  const { title, featured } = recipe
  const { proteinPct, carbsPct, fatPct } = toMacroRatios(featured)

  return new ImageResponse(
    <Card title={title} titleSize={title.length > 28 ? 76 : 96}>
      <>
        <Stat value={String(featured.calories)} label='cal' />
        <Stat
          value={`${proteinPct}%`}
          label={`protein ${featured.proteinG}g`}
          highlight
        />
        <Stat value={`${carbsPct}%`} label={`carbs ${featured.carbsG}g`} />
        <Stat value={`${fatPct}%`} label={`fat ${featured.fatG}g`} />
      </>
    </Card>,
    size
  )
}

export default Image
