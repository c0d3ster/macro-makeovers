import { describe, expect, it } from 'vitest'

import { resolveSelection } from './select'
import { getModules } from './variants'

const clerk = getModules('clerk-neon')
const supabase = getModules('supabase')

const sorted = (set: ReadonlySet<string>): string[] => Array.from(set).sort()

describe('resolveSelection', () => {
  it('keeps only the requested module and what it derives', () => {
    const { enabled, added } = resolveSelection(['email'], clerk, 'clerk-neon')

    expect(sorted(enabled)).toEqual(['email', 'graphql'])
    expect(added).toEqual([])
  })

  it('pulls in required modules and reports them', () => {
    const { enabled, added } = resolveSelection(['auth'], clerk, 'clerk-neon')

    expect(sorted(enabled)).toEqual(['auth', 'database', 'graphql'])
    expect(added).toEqual(['database'])
  })

  it('does not report a requirement that was already selected', () => {
    const { added } = resolveSelection(['auth', 'database'], clerk, 'clerk-neon')

    expect(added).toEqual([])
  })

  it('keeps the database without GraphQL when nothing needs GraphQL', () => {
    const { enabled } = resolveSelection(['database'], clerk, 'clerk-neon')

    expect(sorted(enabled)).toEqual(['database'])
  })

  it('keeps file uploads on its own in either variant', () => {
    ;(['clerk-neon', 'supabase'] as const).forEach((variant) => {
      const { enabled, added } = resolveSelection(['file_uploads'], getModules(variant), variant)

      expect(sorted(enabled)).toEqual(['file_uploads'])
      expect(added).toEqual([])
    })
  })

  it('keeps nothing for an empty request', () => {
    expect(sorted(resolveSelection([], clerk, 'clerk-neon').enabled)).toEqual([])
  })

  it('ignores features that have no template code', () => {
    const { enabled, ignored } = resolveSelection(['seo', 'custom_design', 'email'], clerk, 'clerk-neon')

    expect(sorted(enabled)).toEqual(['email', 'graphql'])
    expect(ignored).toEqual(['seo', 'custom_design'])
  })

  it('does not let callers pick derived or tooling modules directly', () => {
    const { enabled, ignored } = resolveSelection(['graphql', 'init'], clerk, 'clerk-neon')

    expect(sorted(enabled)).toEqual([])
    expect(ignored).toEqual(['graphql', 'init'])
  })

  describe('realtime', () => {
    it('needs auth, the database and GraphQL in the supabase variant', () => {
      const { enabled, added } = resolveSelection(['realtime'], supabase, 'supabase')

      expect(sorted(enabled)).toEqual(['auth', 'database', 'graphql', 'realtime'])
      expect(added).toEqual(['auth', 'database'])
    })

    it('is rejected by the clerk-neon variant', () => {
      expect(() => resolveSelection(['realtime'], clerk, 'clerk-neon')).toThrow(
        '"realtime" is only available with --variant=supabase'
      )
    })
  })
})
