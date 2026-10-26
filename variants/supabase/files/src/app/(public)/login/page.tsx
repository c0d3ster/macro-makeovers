import type { Metadata } from 'next'

import { AuthForm } from '@/components/molecules'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: `Sign in - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams

  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md rounded-lg bg-surface p-8 shadow-lg'>
        <AuthForm next={next} />
      </div>
    </main>
  )
}

export default LoginPage
