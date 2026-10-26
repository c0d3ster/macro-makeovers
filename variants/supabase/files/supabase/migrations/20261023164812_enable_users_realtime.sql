-- Broadcast changes to public.users over Supabase Realtime.
-- Subscribers only receive rows their RLS select policy allows (their own row).
alter publication supabase_realtime add table public.users;
