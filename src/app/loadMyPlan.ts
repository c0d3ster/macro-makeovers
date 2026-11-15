import 'reflect-metadata'

import type { PlanSummary } from '@/services/BillingService'

import { logger } from '@/libs/Logger'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import { isOwner } from '@/libs/supabase/owner'
import { getAuthId } from '@/libs/supabase/server'
import { services } from '@/services'

export type MyPlan =
  | { signedIn: false }
  | { signedIn: true; plan: PlanSummary | undefined }

// The signed-in visitor's plan for server-rendered pages (pricing, account). A failed lookup
// shows as an unknown plan rather than breaking the page.
export const loadMyPlan = async (): Promise<MyPlan> => {
  if (!isSupabaseConfigured()) return { signedIn: false }
  const authId = await getAuthId()
  if (!authId) return { signedIn: false }

  try {
    const plan = await services.billingService.getPlanForAuthId(
      authId,
      await isOwner()
    )
    return { signedIn: true, plan }
  } catch (error) {
    logger.error('Could not load the plan', { error: String(error) })
    return { signedIn: true, plan: undefined }
  }
}
