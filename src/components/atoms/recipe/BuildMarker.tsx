import type { ReactElement } from 'react'

// Marks an ingredient line or step that only some builds of a recipe have
export const BuildMarker = (): ReactElement => (
  <span className='inline-flex shrink-0 rounded-full border border-primary/50 px-2 py-0.5 text-[11px] leading-none font-medium whitespace-nowrap text-primary'>
    This build
  </span>
)
