import type { Metadata } from 'next'

import { Env } from '@/libs/Env'
import { ProvidersWrapper } from '@/providers'
import { getBaseUrl } from '@/utils/Env'
import '@/styles/global.css'

export const metadata: Metadata = {
  // Resolves relative share-image and canonical URLs against the deployed origin
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: Env.NEXT_PUBLIC_BRAND_NAME,
    template: `%s | ${Env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: 'High-protein, lower-fat versions of foods people love.',
}

// Runs before first paint so a saved or system-preferred light theme never flashes dark
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- fixed string, no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#0c0b0a' />
        <link rel='icon' href='/favicon.ico' sizes='48x48' />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon-16x16.png'
        />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
      </head>
      <body>
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  )
}
