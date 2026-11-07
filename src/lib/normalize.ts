export function toList(value: string | string[] | null | undefined): string[] {
  if (value == null) return []
  const parts = Array.isArray(value) ? value : value.split(/(?<!\\),/).map((s) => s.replaceAll('\\,', ','))
  return parts.map((s) => String(s).trim()).filter(Boolean)
}

// Chips that fit a rough character budget (about two rows on a card), in order, plus how many are left
// for a "+k" chip. Cost per chip = length + 4 (padding, gap); room for the "+k" chip (6) is kept while
// tags remain. The first tag always shows.
export function fitTags(tags: string[], budget: number): { shown: string[]; more: number } {
  const shown: string[] = []
  let used = 0
  for (const [i, t] of tags.entries()) {
    const reserve = i < tags.length - 1 ? 6 : 0
    if (shown.length && used + t.length + 4 + reserve > budget) break
    shown.push(t)
    used += t.length + 4
  }
  return { shown, more: tags.length - shown.length }
}

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const month = (d: string): string => fmt.format(new Date(d))

export function formatPeriod(start: string, end: string, isPresent: boolean): string {
  if (!start) return ''
  const to = isPresent ? 'Present' : end ? month(end) : ''
  return to ? `${month(start)} - ${to}` : month(start)
}

// Local image basename; some items lack *FileName, so fall back to the (url-encoded) Storage URL path.
export function imageName(fileName: string | undefined, url: string): string {
  const f = fileName || decodeURIComponent(new URL(url).pathname.split('/o/')[1])
  return (f.split('/').pop() ?? f).replace(/\.[^.]+$/, '')
}
