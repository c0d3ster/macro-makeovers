import type { ModuleDef, ModuleId, VariantId } from './modules'

import { selectableIds } from './modules'

export type Selection = {
  enabled: ReadonlySet<ModuleId>
  // Modules switched on only because another selected module requires them
  added: ModuleId[]
  // Requested ids that are not template modules (design, SEO, and so on)
  ignored: string[]
}

const isSelectable = (id: string): id is ModuleId =>
  (selectableIds as readonly string[]).includes(id)

// Turns a requested feature list into the full set of modules to keep:
// drops unknown ids, rejects modules the variant does not have, pulls in required
// modules, then applies derived modules.
export const resolveSelection = (
  requested: readonly string[],
  defs: Record<ModuleId, ModuleDef>,
  variant: VariantId
): Selection => {
  const enabled = new Set<ModuleId>()
  const added: ModuleId[] = []
  const ignored: string[] = []

  requested.forEach((id) => {
    if (!isSelectable(id)) {
      ignored.push(id)
      return
    }
    const availableIn = defs[id].availableIn
    if (availableIn && !availableIn.includes(variant)) {
      throw new Error(`"${id}" is only available with --variant=${availableIn.join(' or ')}`)
    }
    enabled.add(id)
  })

  // Pull in requirements until nothing changes (handles chains)
  let changed = true
  while (changed) {
    changed = false
    Array.from(enabled).forEach((id) => {
      defs[id].requires.forEach((required) => {
        if (enabled.has(required)) return
        enabled.add(required)
        added.push(required)
        changed = true
      })
    })
  }

  Object.values(defs).forEach((definition) => {
    if (definition.derivedFrom?.some((source) => enabled.has(source))) {
      enabled.add(definition.id)
    }
  })

  return { enabled, added, ignored }
}
