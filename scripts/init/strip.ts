// Marker grammar. A marker can sit inside any comment syntax (//, #, /* */, <!-- -->, {/* */}).
//
//   Line tag:   code // @module:email        line is kept only when `email` is on
//   Negated:    code // @module:!auth        line is kept only when `auth` is off
//   Both:       code // @module:email+!auth  email on AND auth off (terms joined by +)
//   Region:     // #region @module:email     everything up to the matching
//               ...                          // #endregion @module:email
//               // #endregion @module:email  is kept only when `email` is on
//
// Marker lines themselves are always removed. Regions can nest, and an #endregion
// must repeat the exact spec of its #region.

const SPEC = '([!a-z_+]+)'
const REGION_START = new RegExp(`#region\\s+@module:${SPEC}`)
const REGION_END = new RegExp(`#endregion\\s+@module:${SPEC}`)
const LINE_TAG = new RegExp(`@module:${SPEC}`)
// Trailing comment wrapper around a line tag, in any supported comment syntax
const TRAILING_TAG =
  /\s*(?:(?:\/\/|#|\/\*|<!--|\{\/\*)\s*)?@module:[!a-z_+]+\s*(?:(?:\*\/\}?|-->)\s*)?$/

type Frame = {
  spec: string
  keep: boolean
  startLine: number
}

export const hasMarkers = (text: string): boolean => text.includes('@module:')

const isKept = (spec: string, enabled: ReadonlySet<string>, where: string): boolean =>
  spec.split('+').every((term) => {
    const negated = term.startsWith('!')
    const id = negated ? term.slice(1) : term
    if (id === '') throw new Error(`${where}: empty module name in "@module:${spec}"`)
    return negated ? !enabled.has(id) : enabled.has(id)
  })

export const stripText = (
  text: string,
  enabled: ReadonlySet<string>,
  label = 'input'
): string => {
  const lines = text.split('\n')
  const out: string[] = []
  const stack: Frame[] = []

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const where = `${label}:${lineNumber}`
    const regionStart = REGION_START.exec(line)
    const regionEnd = REGION_END.exec(line)

    if (regionStart) {
      const spec = regionStart[1] ?? ''
      stack.push({ spec, keep: isKept(spec, enabled, where), startLine: lineNumber })
      return
    }

    if (regionEnd) {
      const spec = regionEnd[1] ?? ''
      const frame = stack.pop()
      if (!frame || frame.spec !== spec) {
        throw new Error(
          `${where}: #endregion @module:${spec} does not match ${ 
            frame
              ? `#region @module:${frame.spec} (line ${frame.startLine})`
              : 'any open region'}`
        )
      }
      return
    }

    // Inside a region that is switched off
    if (stack.some((frame) => !frame.keep)) return

    const tag = LINE_TAG.exec(line)
    if (!tag) {
      out.push(line)
      return
    }

    if (!isKept(tag[1] ?? '', enabled, where)) return

    const cleaned = line.replace(TRAILING_TAG, '')
    // A line that was only a marker comment disappears with it
    if (cleaned.trim() !== '') out.push(cleaned)
  })

  const unclosed = stack.at(-1)
  if (unclosed) {
    throw new Error(
      `${label}:${unclosed.startLine}: #region @module:${unclosed.spec} is never closed`
    )
  }

  return out.join('\n')
}
