// Where Supabase may send an authorization code. Dynamic client registration lets anyone
// register an OAuth client, so the consent step only approves apps that return to one of these
// origins. If approving Claude is refused, the consent page shows the address it saw, and that
// origin belongs here.
export const ALLOWED_REDIRECT_ORIGINS: readonly string[] = [
  'https://claude.ai',
  'https://claude.com',
]

export const isAllowedRedirectUri = (redirectUri: string): boolean => {
  try {
    return ALLOWED_REDIRECT_ORIGINS.includes(new URL(redirectUri).origin)
  } catch {
    return false
  }
}
