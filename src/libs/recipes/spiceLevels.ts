// Heat runs 1 to 5 for a typical eater. A recipe with no level is not spicy and shows nothing.
export const MAX_SPICE_LEVEL = 5

const SPICE_LABELS = ['Mild', 'Medium', 'Hot', 'Very hot', 'Extra hot'] as const

export const spiceLabel = (level: number): string =>
  SPICE_LABELS[Math.min(Math.max(level, 1), MAX_SPICE_LEVEL) - 1] ?? 'Mild'

// The book's markdown writes heat as a run of these, one per level
export const CHILI_MARK = '🌶'

// One chili on a 24 by 24 grid: the pod is filled, the stem and cap are stroked. Shared by the
// SpiceLevel atom and the printed book, so both draw the same icon.
export const CHILI_POD_PATH =
  'M14.5 8.2c3.4-.4 5.6 2.3 4.6 5.6-1.3 4.4-6.6 7.6-14.6 7.2-.6 0-.7-.7-.2-.9 4.6-1.9 6.8-4.5 7.4-8.4.3-2 1.2-3.3 2.8-3.5z'
export const CHILI_STEM_PATH = 'M15 8.4c0-2.2.9-3.8 2.8-4.6M12.6 9.6c.8-1.6 3.4-2.3 5.6-.9'
