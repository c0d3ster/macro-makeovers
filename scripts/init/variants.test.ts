import { describe, expect, it } from 'vitest'

import { getModules, isVariantId, resolveVariant, variantIds } from './variants'

describe('resolveVariant', () => {
  it('defaults to clerk-neon', () => {
    expect(resolveVariant(undefined, ['database', 'auth'])).toBe('clerk-neon')
  })

  it('is implied by features that only one variant has', () => {
    expect(resolveVariant(undefined, ['auth', 'realtime'])).toBe('supabase')
  })

  it('lets an explicit choice win', () => {
    expect(resolveVariant('supabase', ['auth'])).toBe('supabase')
    expect(resolveVariant('clerk-neon', ['email'])).toBe('clerk-neon')
  })

  it('rejects unknown variants and names the valid ones', () => {
    expect(() => resolveVariant('firebase', [])).toThrow('Choose one of: clerk-neon, supabase')
  })
})

describe('isVariantId', () => {
  it('accepts known ids only', () => {
    expect(variantIds.every((id) => isVariantId(id))).toBe(true)
    expect(isVariantId('firebase')).toBe(false)
  })
})

describe('getModules', () => {
  it('returns the base manifest for clerk-neon', () => {
    const defs = getModules('clerk-neon')

    expect(defs.auth.packages).toContain('@clerk/nextjs')
    expect(defs.database.scripts).toContain('db:migrate')
  })

  it('applies the supabase overrides without touching other fields', () => {
    const defs = getModules('supabase')

    expect(defs.auth.packages).toEqual(
      expect.arrayContaining(['@supabase/supabase-js', '@supabase/ssr', 'react-hook-form'])
    )
    expect(defs.auth.packages).not.toContain('@clerk/nextjs')
    expect(defs.auth.requires).toEqual(['database'])
    expect(defs.database.scripts).toContain('db:push')
    expect(defs.database.scripts).not.toContain('db:migrate')
    expect(defs.realtime.paths).toContain('src/hooks')
  })

  it('does not leak one variant into the other', () => {
    getModules('supabase')

    expect(getModules('clerk-neon').auth.packages).toContain('@clerk/nextjs')
  })
})
