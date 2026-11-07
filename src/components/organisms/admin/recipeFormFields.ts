import type {
  Path,
  UseFormRegister,
  UseFormReturn,
} from 'react-hook-form'

import { useFormContext } from 'react-hook-form'

import type { NutritionBuild } from '@/libs/recipes/recipeDetail'
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

export const toNutritionBuild = (
  row: RecipeImportInput['nutrition'][number]
): NutritionBuild => ({
  kind: row.kind,
  label: row.label,
  isDefault: row.isDefault ?? false,
  calories: toNumber(row.calories),
  carbsG: toNumber(row.carbsG),
  fatG: toNumber(row.fatG),
  proteinG: toNumber(row.proteinG),
})
