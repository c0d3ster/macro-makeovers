import type {
  Path,
  UseFormRegister,
  UseFormReturn,
} from 'react-hook-form'

import { useFormContext } from 'react-hook-form'

import type { MacroValues } from '@/libs/recipes/recipeBuilds'
import type { RecipeImport, RecipeImportInput } from '@/validations'

type RecipeFormContext = UseFormReturn<
  RecipeImportInput,
  unknown,
  RecipeImport
>

export const useRecipeForm = (): RecipeFormContext =>
  useFormContext<RecipeImportInput, unknown, RecipeImport>()

// Blank inputs mean "not set", which the schema expects as a missing field
export const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined

const optionalNumber = (value: unknown): number | undefined =>
  value === '' || value === undefined || value === null
    ? undefined
    : Number(value)

export const numberField = (
  register: UseFormRegister<RecipeImportInput>,
  name: Path<RecipeImportInput>
): ReturnType<UseFormRegister<RecipeImportInput>> =>
  register(name, { setValueAs: optionalNumber })

// A number input being typed in can be blank, which counts as 0 until it is saved
export const toNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

type FormBuild = NonNullable<RecipeImportInput['builds']>[number]

// A build row's macros while it is being typed, with blanks read as 0
export const toBuildMacros = (
  row: Pick<FormBuild, 'calories' | 'carbsG' | 'fatG' | 'proteinG'>
): MacroValues => ({
  calories: toNumber(row.calories),
  carbsG: toNumber(row.carbsG),
  fatG: toNumber(row.fatG),
  proteinG: toNumber(row.proteinG),
})

// The featured build: the one flagged, else the first
export const featuredIndex = (builds: Pick<FormBuild, 'isDefault'>[]): number => {
  const flagged = builds.findIndex(({ isDefault }) => isDefault)
  return flagged === -1 ? 0 : flagged
}

// A key no other build has, for a build added in the editor
export const nextBuildKey = (taken: (string | undefined)[]): string => {
  const keys = new Set(taken)
  let number = taken.length + 1
  while (keys.has(`build-${number}`)) number += 1
  return `build-${number}`
}

const SCOPED_SECTIONS = ['ingredients', 'steps', 'notes'] as const
type ScopeList = string[] | undefined

// Renames a build key everywhere a line, step, or note points at it. With no new key the build
// is gone: a row only that build had goes with it, and a skip list left empty goes back to every
// build.
export const useRenameBuildKey = (): ((from: string, to?: string) => void) => {
  const { getValues, setValue } = useRecipeForm()

  return (from, to) => {
    const swap = (list: ScopeList): ScopeList => {
      if (!list?.includes(from)) return list
      const next = list.flatMap((key) => (key === from ? (to ? [to] : []) : [key]))
      return next.length > 0 ? next : undefined
    }

    SCOPED_SECTIONS.forEach((section) => {
      // A row only the deleted build had would otherwise turn into a row every build has
      if (!to) {
        const rows = getValues(section)
        const kept = rows.filter(
          (row) => !(row.onlyBuilds?.length && !swap(row.onlyBuilds))
        ) as typeof rows
        if (kept.length < rows.length) setValue(section, kept, { shouldDirty: true })
      }
      const rows = getValues(section)
      rows.forEach((row, index) => {
        const onlyBuilds = swap(row.onlyBuilds)
        const skipBuilds = swap(row.skipBuilds)
        if (onlyBuilds !== row.onlyBuilds) {
          setValue(`${section}.${index}.onlyBuilds`, onlyBuilds, {
            shouldDirty: true,
          })
        }
        if (skipBuilds !== row.skipBuilds) {
          setValue(`${section}.${index}.skipBuilds`, skipBuilds, {
            shouldDirty: true,
          })
        }
      })
    })
  }
}
