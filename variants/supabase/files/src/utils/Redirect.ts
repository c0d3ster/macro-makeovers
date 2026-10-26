// Only allow same-origin relative paths so ?next= cannot be used as an open redirect
export const getSafeRedirectPath = (
  next: string | null | undefined,
  fallback = '/profile'
): string => {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback
  if (next.includes('\\')) return fallback
  return next
}
