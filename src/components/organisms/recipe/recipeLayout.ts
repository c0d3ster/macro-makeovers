// The recipe page's grid, shared with the editor so the two always line up
export const RECIPE_PAGE_LAYOUT =
  'mx-auto flex max-w-6xl flex-col gap-12 px-3 py-10 sm:px-6 lg:px-8'

export const RECIPE_HERO_GRID =
  'grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-5 md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem]'
export const RECIPE_HERO_TITLE = 'md:col-start-1 md:row-start-1'
// The editor's facts block, above the photo
export const RECIPE_HERO_FACTS =
  'flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted md:col-start-2 md:row-start-1 md:self-center'
// Course and time, then the cost, difficulty, and heat scales, beside the title on wider screens.
// The scales stay side by side on a phone too, wrapping only if the screen is very narrow.
export const RECIPE_HERO_FACT_STACK =
  'flex flex-col gap-2 md:col-start-2 md:row-start-1 md:self-center'
export const RECIPE_HERO_FACT_LINE =
  'flex flex-wrap items-baseline gap-x-2 text-base text-text-muted'
export const RECIPE_HERO_SCALE_LINE =
  'flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted sm:gap-x-6'
export const RECIPE_HERO_BODY =
  'flex flex-col gap-5 md:col-start-1 md:row-start-2'
export const RECIPE_HERO_PHOTO = 'md:col-start-2 md:row-start-2'

// Nutrition and steps share the left column, with ingredients on the right. On a phone they
// stack in cooking order: nutrition, ingredients, steps.
export const RECIPE_BODY_GRID =
  'grid grid-cols-1 gap-y-12 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-x-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-10'
export const RECIPE_BODY_NUTRITION = 'md:col-start-1 md:row-start-1'
export const RECIPE_BODY_INGREDIENTS =
  'md:col-start-2 md:row-span-2 md:row-start-1 md:self-start'
export const RECIPE_BODY_STEPS = 'md:col-start-1 md:row-start-2'
