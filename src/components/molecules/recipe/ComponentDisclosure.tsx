import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeComponent } from '@/libs/recipes/recipeDetail'

import { BuildMarker, Markdown } from '@/components/atoms'
import { groupIngredients, scaleIngredient } from '@/libs/recipes/ingredients'
import { buildHref } from '@/libs/recipes/recipeBuilds'

type ComponentDisclosureProps = {
  component: RecipeComponent
  // The dish's scale from its stepper. The component prints as written at the dish's own servings.
  factor: number
  // Flags a component only some of the dish's builds use
  marked?: boolean
}

// A side or sauce inside the dish's ingredient card. Closed it reads as one line with how much
// the dish uses. Open it lists the component's ingredients, scaled with the dish, and its steps,
// so nobody has to leave the page to make it. Native details, so it works without JavaScript.
export const ComponentDisclosure = ({
  component,
  factor,
  marked = false,
}: ComponentDisclosureProps): ReactElement => {
  const { slug, title, linked, amount, note, servingsPerServing, build } =
    component
  const calories = Math.round(build.calories * servingsPerServing)

  return (
    <details className='group/component'>
      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 hover:bg-background/40 [&::-webkit-details-marker]:hidden'>
        <span className='flex min-w-0 flex-col gap-0.5'>
          <span className='text-xs font-semibold tracking-wide text-primary uppercase'>
            {title}
          </span>
          <span className='text-sm text-text-muted'>
            {[amount, `~${calories} cal per serving`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className='flex shrink-0 items-center gap-2'>
          {marked && <BuildMarker />}
          <svg
            aria-hidden='true'
            viewBox='0 0 16 16'
            className='size-4 text-text-muted transition-transform group-open/component:rotate-180 motion-reduce:transition-none'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M4 6l4 4 4-4' />
          </svg>
          <span className='sr-only'>Show the {title} recipe</span>
        </span>
      </summary>

      <div className='flex flex-col gap-3 border-t border-text-muted/30 bg-background/30 px-4 py-3'>
        {note && (
          <div className='text-sm text-text-muted'>
            <Markdown>{note}</Markdown>
          </div>
        )}
        {groupIngredients(component.ingredients).map(
          ({ name, ingredients: lines }) => (
            <div key={name ?? 'ungrouped'} className='flex flex-col gap-1'>
              {name && (
                <h4 className='text-xs font-semibold tracking-wide text-text-muted uppercase'>
                  {name}
                </h4>
              )}
              <ul className='flex list-disc flex-col gap-1 pl-5 text-sm text-text'>
                {lines.map((line) => (
                  <li key={line.raw}>
                    <Markdown>{scaleIngredient(line.raw, factor)}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
        {component.steps.length > 0 && (
          <ol className='flex list-decimal flex-col gap-1 pl-5 text-sm text-text-muted'>
            {component.steps.map(({ body }) => (
              <li key={body}>
                <Markdown>{body}</Markdown>
              </li>
            ))}
          </ol>
        )}
        {linked && (
          <Link
            href={buildHref(slug, build)}
            className='self-start text-sm text-primary underline hover:no-underline'
          >
            Full recipe
          </Link>
        )}
      </div>
    </details>
  )
}
