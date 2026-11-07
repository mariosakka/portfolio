export function toList(value) {
  if (value == null) return []
  const parts = Array.isArray(value) ? value : value.split(/(?<!\\),/).map((s) => s.replaceAll('\\,', ','))
  return parts.map((s) => String(s).trim()).filter(Boolean)
}

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const month = (d) => fmt.format(new Date(d))

export function formatPeriod(start, end, isPresent) {
  if (!start) return ''
  const to = isPresent ? 'Present' : end ? month(end) : ''
  return to ? `${month(start)} - ${to}` : month(start)
}
