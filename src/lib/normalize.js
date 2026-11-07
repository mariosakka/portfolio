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

// Local image basename; some items lack *FileName, so fall back to the (url-encoded) Storage URL path.
export function imageName(fileName, url) {
  const f = fileName || decodeURIComponent(new URL(url).pathname.split('/o/')[1])
  return f.split('/').pop().replace(/\.[^.]+$/, '')
}
