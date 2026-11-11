'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import {
  AddRowButton,
  InlineInput,
  InlineTextarea,
  PlaceholderButton,
  RemoveRowButton,
} from '@/components/molecules'
import { groupIngredients } from '@/libs/recipes/ingredients'
import { appliesToBuild } from '@/libs/recipes/recipeBuilds'

import { OUT_OF_PREVIEW, usePreviewBuild } from './buildPreview'
import { BuildScopePicker } from './BuildScopePicker'
import { useRecipeForm } from './recipeFormFields'

type GroupHeadingProps = {
  name: string
  onRename: (name: string | undefined) => void
}

// Renames on blur. Renaming per keystroke would merge this group into any other whose name the
// text passes through on the way, which can't be undone.
const GroupHeading = ({ name, onRename }: GroupHeadingProps): ReactElement => {
  const [draft, setDraft] = useState(name)

  return (
    <InlineInput
      label={`Group name ${name}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim()
        if (next !== name) onRename(next || undefined)
      }}
      className='text-xs font-semibold tracking-wide text-primary uppercase'
    />
  )
}

const nextGroupName = (taken: (string | undefined)[]): string => {
  const names = new Set(taken.map((name) => name?.toLowerCase()))
  if (!names.has('new group')) return 'New group'

  let number = 2
  while (names.has(`new group ${number}`)) number += 1
  return `New group ${number}`
}

// The page's ingredient card with its lines as fields. A line stays in the group it was added
// to, and Enter starts a new line right below it.
export const RecipeIngredientsEditor = (): ReactElement => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useRecipeForm()
  const ingredients = useFieldArray({ control, name: 'ingredients' })
  const rows = useWatch({ control, name: 'ingredients' })
  const preview = usePreviewBuild()
  const inPreview = (index: number): boolean => {
    const row = rows[index]
    return !preview.hasBuilds || !preview.key || !row || appliesToBuild(row, preview.key)
  }

  const lines = ingredients.fields.map(({ id, group, raw }, index) => ({
    id,
    index,
    raw: rows[index]?.raw ?? raw,
    group: rows[index]?.group ?? group,
  }))
  const groups = groupIngredients(lines)
  const groupNames = groups.flatMap(({ name }) => (name ? [name] : []))
  const listMessage =
    errors.ingredients?.root?.message ?? errors.ingredients?.message

  const onLineKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    group: string | undefined
  ): void => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    ingredients.insert(index + 1, { raw: '', group })
  }

  return (
    <section
      aria-labelledby='ingredients-heading'
      className='flex flex-col rounded-xl bg-surface py-4'
    >
      <h2
        id='ingredients-heading'
        className='px-4 pb-3 text-xl font-semibold text-text'
      >
        Ingredients
      </h2>

      {listMessage && (
        <p role='alert' className='px-4 pb-3 text-sm text-red-400'>
          {listMessage}
        </p>
      )}

      <div className='flex flex-col divide-y divide-text-muted/30 border-t border-text-muted/30'>
        {groups.length === 0 && (
          <div className='p-4'>
            <PlaceholderButton onClick={() => ingredients.append({ raw: '' })}>
              Add the first ingredient
            </PlaceholderButton>
          </div>
        )}
        {groups.map(({ name, ingredients: groupLines }) => (
          // Keyed by its first line, so renaming a group keeps focus where the owner tabbed to
          <div key={groupLines[0]?.id}>
            {name && (
              <div className='px-4 py-2'>
                <GroupHeading
                  name={name}
                  onRename={(next) =>
                    groupLines.forEach(({ index }) =>
                      setValue(`ingredients.${index}.group`, next, {
                        shouldDirty: true,
                      })
                    )
                  }
                />
              </div>
            )}
            <ul
              className={`flex flex-col divide-y divide-text-muted/30 ${name ? 'border-t border-text-muted/30' : ''}`}
            >
              {groupLines.map(({ id, index, group }) => (
                <li
                  key={id}
                  className={`group/editable flex flex-col gap-1 py-2 pr-2 pl-4 text-sm ${inPreview(index) ? '' : OUT_OF_PREVIEW}`}
                >
                  <div className='flex items-start gap-1'>
                  <InlineTextarea
                    label={`Ingredient ${index + 1}`}
                    error={errors.ingredients?.[index]?.raw?.message}
                    fieldClassName='flex-1'
                    rows={1}
                    placeholder='2 lbs chicken breast'
                    onKeyDown={(event) => onLineKeyDown(event, index, group)}
                    className='text-sm text-text'
                    {...register(`ingredients.${index}.raw`)}
                  />
                  <RemoveRowButton
                    label={`Remove ingredient ${index + 1}`}
                    onClick={() => ingredients.remove(index)}
                  />
                  </div>
                  <BuildScopePicker section='ingredients' index={index} />
                </li>
              ))}
              <li className='px-4 py-2'>
                <AddRowButton
                  onClick={() => {
                    const last = groupLines.at(-1)
                    ingredients.insert(
                      last ? last.index + 1 : ingredients.fields.length,
                      { raw: '', group: name }
                    )
                  }}
                >
                  Add ingredient
                </AddRowButton>
              </li>
            </ul>
          </div>
        ))}
        <div className='px-4 pt-3'>
          <AddRowButton
            onClick={() =>
              ingredients.append({
                raw: '',
                group: nextGroupName(groupNames),
              })
            }
          >
            Add group
          </AddRowButton>
        </div>
      </div>
    </section>
  )
}
