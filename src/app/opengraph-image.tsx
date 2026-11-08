/* eslint-disable react-refresh/only-export-components -- Next requires these route exports beside the component */
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Env } from '@/libs/Env'

export const alt = `${Env.NEXT_PUBLIC_BRAND_NAME} logo`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Same palette as the site theme (see global.css)
const COLORS = {
  background: '#0c0b0a',
  text: '#ece2d2',
  muted: '#a69b8d',
}

// public/logo.png is 411x554
const LOGO_HEIGHT = 380
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * 411) / 554)

// Site-wide share image. Vercel also uses it as the deployment preview, and recipe pages
// replace it with their own (recipes/[slug]/opengraph-image.tsx).
const Image = async (): Promise<ImageResponse> => {
  const logo = await readFile(join(process.cwd(), 'public/logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 72,
        padding: 72,
        background: COLORS.background,
      }}
    >
      <img src={logoSrc} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt='' />
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 620 }}>
        <span
          style={{
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            color: COLORS.text,
          }}
        >
          {Env.NEXT_PUBLIC_BRAND_NAME}
        </span>
        <span
          style={{
            marginTop: 28,
            fontSize: 40,
            lineHeight: 1.3,
            color: COLORS.muted,
          }}
        >
          High-protein, lower-fat versions of foods people love
        </span>
      </div>
    </div>,
    size
  )
}

export default Image
