// 45 -> "45 min", 60 -> "1 hr", 70 -> "1 hr 10 min"
export const formatMinutes = (minutes: number): string => {
  const rounded = Math.round(minutes)
  if (rounded < 60) return `${rounded} min`

  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}
