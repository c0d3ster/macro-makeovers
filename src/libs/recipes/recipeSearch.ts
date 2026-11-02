// Tag names become lowercase path segments, e.g. "Meal Prep" is /tags/meal%20prep
export const toTagPath = (tag: string): string =>
  `/tags/${encodeURIComponent(tag.toLowerCase())}`
