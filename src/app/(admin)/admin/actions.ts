'use server'

import { revalidatePath } from 'next/cache'

import type { RecipeStatus } from '@/libs/recipes'

import { setRecipeStatus } from '@/libs/recipes'
import { revalidateRecipePages } from '@/libs/recipes/revalidateRecipePages'
import { createAdminClient } from '@/libs/supabase/admin'
import { isOwner } from '@/libs/supabase/owner'

const isStatus = (value: unknown): value is RecipeStatus =>
  value === 'draft' || value === 'published'

// Checks who is asking before touching the service role client, which bypasses RLS
export const setStatusAction = async (formData: FormData): Promise<void> => {
  if (!(await isOwner())) throw new Error('Only the site owner can publish.')

  const id = formData.get('id')
  const status = formData.get('status')
  if (typeof id !== 'string' || !isStatus(status)) {
    throw new Error('Unknown recipe or status.')
  }

  const slug = await setRecipeStatus(createAdminClient(), id, status)
  revalidateRecipePages(slug)
  revalidatePath('/admin')
  // The editor shows the recipe's status too
  revalidatePath('/admin/recipes/[id]/edit', 'page')
}
