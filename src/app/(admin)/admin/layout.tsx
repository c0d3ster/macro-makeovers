import type { ReactNode } from 'react'

import { notFound } from 'next/navigation'

import { isOwner } from '@/libs/supabase/owner'

type AdminLayoutProps = {
  children: ReactNode
}

// proxy.ts sends signed-out visitors to /login. This catches everyone else who is not the
// owner, so the admin area does not even reveal that it exists.
const AdminLayout = async ({ children }: AdminLayoutProps) => {
  if (!(await isOwner())) notFound()

  return <>{children}</>
}

export default AdminLayout
