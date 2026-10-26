import { describe, expect, it } from 'vitest'

import { applySlots, hasSlots, parseSlots } from './slots'

const shared = ['a', '<!-- #slot one -->', 'default one', '<!-- #endslot one -->', 'b'].join('\n')

describe('slots', () => {
  it('detects files that have slots', () => {
    expect(hasSlots(shared)).toBe(true)
    expect(hasSlots('plain text')).toBe(false)
  })

  it('keeps the default and drops the markers when nothing replaces the slot', () => {
    const { text, used } = applySlots(shared, new Map(), 'f')

    expect(text).toBe('a\ndefault one\nb')
    expect(used.size).toBe(0)
  })

  it('swaps in the replacement', () => {
    const { text, used } = applySlots(shared, new Map([['one', ['new 1', 'new 2']]]), 'f')

    expect(text).toBe('a\nnew 1\nnew 2\nb')
    expect(Array.from(used)).toEqual(['one'])
  })

  it('lets a replacement be empty', () => {
    expect(applySlots(shared, new Map([['one', []]]), 'f').text).toBe('a\nb')
  })

  it('works inside any comment syntax', () => {
    const text = ['# #slot env', 'A=1', '# #endslot env'].join('\n')

    expect(applySlots(text, new Map([['env', ['B=2']]]), 'f').text).toBe('B=2')
  })

  it('parses a replacement file into its slots', () => {
    const slots = parseSlots(['', '<!-- #slot one -->', 'x', '<!-- #endslot one -->', ''].join('\n'), 'r')

    expect(slots.get('one')).toEqual(['x'])
  })

  it('rejects stray content in a replacement file', () => {
    expect(() => parseSlots('stray\n<!-- #slot one -->\nx\n<!-- #endslot one -->', 'r')).toThrow(/only contain/)
  })

  it('rejects the same slot defined twice', () => {
    const text = ['<!-- #slot one -->', '<!-- #endslot one -->', '<!-- #slot one -->', '<!-- #endslot one -->'].join('\n')

    expect(() => parseSlots(text, 'r')).toThrow(/defined twice/)
  })

  it('rejects unclosed, mismatched and nested slots with the file and line', () => {
    expect(() => applySlots('<!-- #slot one -->\nx', new Map(), 'f.md')).toThrow('f.md:1: #slot one is never closed')
    expect(() => applySlots('<!-- #slot a -->\n<!-- #endslot b -->', new Map(), 'f.md')).toThrow(/f.md:2/)
    expect(() => applySlots('<!-- #slot a -->\n<!-- #slot b -->', new Map(), 'f.md')).toThrow(/f.md:2/)
  })
})
