import { createClient } from './server'

// Whether the signed-in user is the site owner, decided by the database (public.is_owner),
// the same check the RLS policies use. Signed-out visitors and members get false.
// Call this before any write that uses the service role client.
export const isOwner = async (): Promise<boolean> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_owner')
  return !error && data === true
}
