'use client'

import { createContext, use } from 'react'
import { useWatch } from 'react-hook-form'

import { appliesToBuild } from '@/libs/recipes/recipeBuilds'

import { featuredIndex, useRecipeForm } from './recipeFormFields'

type ScopedSection = 'ingredients' | 'steps' | 'notes'

export type BuildPreviewValue = {
  // The build the editor shows. Undefined means the featured build.
  selectedKey?: string
  select: (key: string | undefined) => void
  // Each build's own photo by key, saved or waiting for the next save
  buildImages: Record<string, string>
  // Keeps the preview and a build's photo with it when its key is renamed
  renameKey: (from: string, to: string) => void
  // Whether the database has this build yet, so a photo can be saved to it now
  isBuildSaved: (key: string) => boolean
}

const noop = (): void => {}

export const BuildPreviewContext = createContext<BuildPreviewValue>({
  select: noop,
  buildImages: {},
  renameKey: noop,
  isBuildSaved: () => false,
})

type PreviewBuild = {
  key?: string
  index: number
  isFeatured: boolean
  // More than one build, so previews and scopes matter
  hasBuilds: boolean
}

// The build being previewed: the one picked in the nutrition table, else the featured build.
// A pick that no longer exists, like a removed build, reads as the featured build.
export const usePreviewBuild = (): PreviewBuild & BuildPreviewValue => {
  const preview = use(BuildPreviewContext)
  const { control } = useRecipeForm()
  const builds = useWatch({ control, name: 'builds' }) ?? []
  const featured = featuredIndex(builds)
  const picked = builds.findIndex(({ key }) => key === preview.selectedKey)
  const index = picked === -1 ? featured : picked

  return {
    ...preview,
    key: builds[index]?.key,
    index,
    isFeatured: index === featured,
    hasBuilds: builds.length > 1,
  }
}

// False when the previewed build leaves this line, step, or note out
export const useInPreview = (section: ScopedSection, index: number): boolean => {
  const { key, hasBuilds } = usePreviewBuild()
  const { control } = useRecipeForm()
  const onlyBuilds = useWatch({ control, name: `${section}.${index}.onlyBuilds` })
  const skipBuilds = useWatch({ control, name: `${section}.${index}.skipBuilds` })
  if (!hasBuilds || !key) return true
  return appliesToBuild({ onlyBuilds, skipBuilds }, key)
}

// How a row the previewed build leaves out looks: faded, still editable
export const OUT_OF_PREVIEW = 'opacity-50'
