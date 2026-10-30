import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import Link from 'next/link'

import { Button } from '@/components/atoms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { listAdminRecipes } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'

import { setStatusAction } from './actions'

export const metadata: Metadata = {
  title: `Recipes - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// The layout has already checked the owner, so the service role client is safe to use here
const AdminPage = async (): Promise<ReactElement> => {
  const recipes = await listAdminRecipes(createAdminClient())

  return (
    <CleanPageTemplate
      title='Recipes'
      subtitle='Drafts and published recipes. Publishing goes live right away.'
      header={
        <div className='flex gap-2'>
          <Button size='sm' href='/admin/recipes/new'>
            New
          </Button>
          <Button size='sm' href='/admin/import'>
            Import
          </Button>
        </div>
      }
    >
      {recipes.length === 0 ? (
        <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
          No recipes yet. Import one to get started.
        </p>
      ) : (
        <ul className='divide-y divide-text-muted/20 rounded-xl bg-surface'>
          {recipes.map(({ id, title, status, updatedAt }) => (
            <li
              key={id}
              className='flex flex-wrap items-center justify-between gap-3 p-4'
            >
              <div className='min-w-0'>
                <Link
                  href={`/admin/recipes/${id}/edit`}
                  className='font-medium text-text hover:underline'
                >
                  {title}
                </Link>
                <p className='text-xs text-text-muted'>
                  {status === 'published' ? 'Published' : 'Draft'}
                  {' · '}
                  Edited {formatDate(updatedAt)}
                </p>
              </div>
              <form action={setStatusAction}>
                <input type='hidden' name='id' value={id} />
                <input
                  type='hidden'
                  name='status'
                  value={status === 'published' ? 'draft' : 'published'}
                />
                <Button type='submit' size='sm'>
                  {status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </CleanPageTemplate>
  )
}

export default AdminPage
