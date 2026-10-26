import { describe, expect, it } from 'vitest'

import { hasMarkers, stripText } from './strip'

const on = (...ids: string[]): ReadonlySet<string> => new Set(ids)

describe('stripText', () => {
  describe('line tags', () => {
    it('keeps a tagged line and removes only the tag when the module is on', () => {
      const input = "export * from './contact' // @module:email"

      expect(stripText(input, on('email'))).toBe("export * from './contact'")
    })

    it('drops a tagged line when the module is off', () => {
      const input = ['a', "export * from './contact' // @module:email", 'b'].join('\n')

      expect(stripText(input, on())).toBe('a\nb')
    })

    it('supports hash and html comment tags', () => {
      expect(stripText('KEY=1 # @module:email', on('email'))).toBe('KEY=1')
      expect(stripText('<li>x</li> <!-- @module:email -->', on('email'))).toBe('<li>x</li>')
      expect(stripText('x /* @module:email */', on('email'))).toBe('x')
    })

    it('keeps a negated line only when the module is off', () => {
      const input = 'export const schemas = {} // @module:!auth'

      expect(stripText(input, on())).toBe('export const schemas = {}')
      expect(stripText(input, on('auth'))).toBe('')
    })
  })

  describe('regions', () => {
    const input = [
      'before',
      '// #region @module:email',
      'inside',
      '// #endregion @module:email',
      'after',
    ].join('\n')

    it('keeps region content and removes the markers when on', () => {
      expect(stripText(input, on('email'))).toBe('before\ninside\nafter')
    })

    it('removes the whole region when off', () => {
      expect(stripText(input, on())).toBe('before\nafter')
    })

    it('works with JSX and HTML comment markers', () => {
      const jsx = [
        '<div>',
        '  {/* #region @module:email */}',
        '  <ContactForm />',
        '  {/* #endregion @module:email */}',
        '</div>',
      ].join('\n')

      expect(stripText(jsx, on())).toBe('<div>\n</div>')
      expect(stripText(jsx, on('email'))).toBe('<div>\n  <ContactForm />\n</div>')
    })

    it('handles negated regions', () => {
      const negated = [
        '# #region @module:!database',
        'fallback',
        '# #endregion @module:!database',
      ].join('\n')

      expect(stripText(negated, on())).toBe('fallback')
      expect(stripText(negated, on('database'))).toBe('')
    })

    it('combines modules with + (AND), including negated terms', () => {
      const text = [
        '// #region @module:email+auth',
        'both',
        '// #endregion @module:email+auth',
        '// #region @module:email+!auth',
        'email only',
        '// #endregion @module:email+!auth',
        'x // @module:!email+auth',
      ].join('\n')

      expect(stripText(text, on('email', 'auth'))).toBe('both')
      expect(stripText(text, on('email'))).toBe('email only')
      expect(stripText(text, on('auth'))).toBe('x')
      expect(stripText(text, on())).toBe('')
    })

    it('handles nested regions independently', () => {
      const nested = [
        '// #region @module:auth',
        'a',
        '// #region @module:email',
        'b',
        '// #endregion @module:email',
        'c',
        '// #endregion @module:auth',
      ].join('\n')

      expect(stripText(nested, on('auth', 'email'))).toBe('a\nb\nc')
      expect(stripText(nested, on('auth'))).toBe('a\nc')
      expect(stripText(nested, on('email'))).toBe('')
    })

    it('ignores line tags inside a removed region', () => {
      const text = [
        '// #region @module:auth',
        'x // @module:email',
        '// #endregion @module:auth',
      ].join('\n')

      expect(stripText(text, on('email'))).toBe('')
    })
  })

  describe('errors', () => {
    it('throws on a region that is never closed', () => {
      expect(() => stripText('// #region @module:email\nx', on(), 'file.ts')).toThrow(
        'file.ts:1: #region @module:email is never closed'
      )
    })

    it('throws on a mismatched end marker', () => {
      const text = '// #region @module:email\n// #endregion @module:auth'

      expect(() => stripText(text, on(), 'file.ts')).toThrow('does not match')
    })

    it('throws on an end marker with no region', () => {
      expect(() => stripText('// #endregion @module:email', on(), 'file.ts')).toThrow(
        'does not match any open region'
      )
    })
  })

  it('returns text without markers unchanged', () => {
    const text = 'const a = 1\n\nconst b = 2\n'

    expect(stripText(text, on())).toBe(text)
  })
})

describe('hasMarkers', () => {
  it('detects marker text', () => {
    expect(hasMarkers('x // @module:email')).toBe(true)
    expect(hasMarkers('plain')).toBe(false)
  })
})
