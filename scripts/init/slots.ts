// Slots let a variant replace part of a shared file without keeping a second copy of it.
//
//   In the shared file:       #slot name        default content, kept when the variant has no replacement
//                             ...
//                             #endslot name
//   In the variant's replace  #slot name        content that takes its place
//   folder (same file path):  ...
//                             #endslot name
//
// A marker can sit inside any comment syntax. Marker lines are always removed. Slots do not nest.
// A replacement for a slot the shared file does not have is an error, so the two cannot drift apart.

const SLOT_START = /#slot\s+([a-z0-9-]+)/
const SLOT_END = /#endslot\s+([a-z0-9-]+)/

export const hasSlots = (text: string): boolean => text.includes('#slot ')

type Open = { name: string; startLine: number; lines: string[] }

// Splits text into plain lines and slots. `onSlot` decides what each slot emits.
const scan = (
  text: string,
  label: string,
  onSlot: (name: string, body: string[]) => string[]
): string[] => {
  const out: string[] = []
  let open: Open | undefined

  text.split('\n').forEach((line, index) => {
    const where = `${label}:${index + 1}`
    const start = SLOT_START.exec(line)
    const end = SLOT_END.exec(line)

    if (start) {
      if (open) throw new Error(`${where}: #slot ${start[1]} starts inside #slot ${open.name}`)
      open = { name: start[1] ?? '', startLine: index + 1, lines: [] }
      return
    }

    if (end) {
      if (!open || open.name !== end[1]) {
        throw new Error(`${where}: #endslot ${end[1]} does not match ${open ? `#slot ${open.name}` : 'any open slot'}`)
      }
      out.push(...onSlot(open.name, open.lines))
      open = undefined
      return
    }

    if (open) open.lines.push(line)
    else out.push(line)
  })

  if (open) throw new Error(`${label}:${open.startLine}: #slot ${open.name} is never closed`)
  return out
}

// name -> replacement lines
export const parseSlots = (text: string, label: string): Map<string, string[]> => {
  const slots = new Map<string, string[]>()
  const body = scan(text, label, (name, lines) => {
    if (slots.has(name)) throw new Error(`${label}: #slot ${name} is defined twice`)
    slots.set(name, lines)
    return []
  })
  if (body.some((line) => line.trim() !== '')) {
    throw new Error(`${label}: replacement files may only contain #slot blocks`)
  }
  return slots
}

export const applySlots = (
  text: string,
  replacements: ReadonlyMap<string, string[]>,
  label: string
): { text: string; used: Set<string> } => {
  const used = new Set<string>()
  const lines = scan(text, label, (name, defaults) => {
    const replacement = replacements.get(name)
    if (!replacement) return defaults
    used.add(name)
    return replacement
  })
  return { text: lines.join('\n'), used }
}
