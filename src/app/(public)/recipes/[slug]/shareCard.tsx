import type { ReactElement } from 'react'

import type { MacroValues } from '@/libs/recipes'

import { Env } from '@/libs/Env'
import { toMacroRatios } from '@/libs/recipes'

// Same palette as the site theme (see global.css)
const COLORS = {
  background: '#0c0b0a',
  surface: '#1d1b18',
  text: '#ece2d2',
  muted: '#a69b8d',
  accent: '#e6d8c4',
}

const NOTE = 'Estimated per serving. Not medical advice.'

type StatData = {
  value: string
  label: string
}

// Calories, then carbs, fat, protein
const toStats = (macros: MacroValues): StatData[] => {
  const { carbsPct, fatPct, proteinPct } = toMacroRatios(macros)
  return [
    { value: `~${macros.calories}`, label: 'cal' },
    { value: `${carbsPct}%`, label: `carbs ${macros.carbsG}g` },
    { value: `${fatPct}%`, label: `fat ${macros.fatG}g` },
    { value: `${proteinPct}%`, label: `protein ${macros.proteinG}g` },
  ]
}

type StatProps = StatData & {
  // Value size: smaller beside a photo
  size: number
  // Stretch to share a row evenly
  grow?: boolean
}

const Stat = ({
  value,
  label,
  size,
  grow = false,
}: StatProps): ReactElement => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexGrow: grow ? 1 : 0,
      flexBasis: grow ? 0 : 'auto',
      padding: grow ? '18px 12px' : '18px 32px',
      borderRadius: 24,
      background: COLORS.surface,
      color: COLORS.text,
    }}
  >
    <span style={{ fontSize: size, fontWeight: 700 }}>{value}</span>
    <span style={{ fontSize: size * 0.44, color: COLORS.muted }}>{label}</span>
  </div>
)

const Brand = (): ReactElement => (
  <div style={{ display: 'flex', fontSize: 30, color: COLORS.accent }}>
    {Env.NEXT_PUBLIC_BRAND_NAME}
  </div>
)

const Note = (): ReactElement => (
  <div style={{ display: 'flex', fontSize: 22, color: COLORS.muted }}>
    {NOTE}
  </div>
)

type ShareCardProps = {
  title: string
  macros: MacroValues
  // The recipe photo as a URL the renderer can load. Without one the card is text only.
  imageUrl?: string
}

// With a photo: the dish on the left, the title, calories, and a C/F/P row on the right
const PhotoCard = ({
  title,
  macros,
  imageUrl,
}: ShareCardProps & { imageUrl: string }): ReactElement => {
  const stats = toStats(macros)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: COLORS.background,
        color: COLORS.text,
      }}
    >
      <img
        src={imageUrl}
        alt=''
        width={500}
        height={630}
        style={{ width: 500, height: 630, objectFit: 'cover' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 700,
          padding: 52,
        }}
      >
        <Brand />
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 24 ? 54 : 66,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[stats.slice(0, 1), stats.slice(1)].map((row) => (
            <div key={row[0]?.label} style={{ display: 'flex', gap: 16 }}>
              {row.map((stat) => (
                <Stat key={stat.label} {...stat} size={50} grow />
              ))}
            </div>
          ))}
        </div>
        <Note />
      </div>
    </div>
  )
}

// Without a photo: the title centered over a row of stats
const TextCard = ({
  title,
  macros,
}: {
  title: string
  macros?: MacroValues
}): ReactElement => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      textAlign: 'center',
      padding: 72,
      background: COLORS.background,
      color: COLORS.text,
    }}
  >
    <Brand />
    <div
      style={{
        display: 'flex',
        fontSize: title.length > 28 ? 76 : 96,
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {title}
    </div>
    {macros ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          {toStats(macros).map((stat) => (
            <Stat key={stat.label} {...stat} size={64} />
          ))}
        </div>
        <Note />
      </div>
    ) : (
      <div style={{ display: 'flex' }} />
    )}
  </div>
)

export const ShareCard = ({
  title,
  macros,
  imageUrl,
}: ShareCardProps): ReactElement =>
  imageUrl ? (
    <PhotoCard title={title} macros={macros} imageUrl={imageUrl} />
  ) : (
    <TextCard title={title} macros={macros} />
  )

// An unknown slug still gets a clean branded card instead of a broken preview
export const NotFoundCard = (): ReactElement => (
  <TextCard title='Recipe not found' />
)
