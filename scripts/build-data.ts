// Usage: node scripts/build-data.ts [sourceDir]  (default docs/reference/firestore-export)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { toList, imageName } from '../src/lib/normalize.ts'

const src = resolve(process.argv[2] ?? 'docs/reference/firestore-export')
const out = resolve('src/data')
interface RawItem {
  id?: string
  image?: string
  photo?: string
  imageFileName?: string
  photoFileName?: string
  [key: string]: unknown
}
// JSON.parse returns any; the export file is our own one-off Firestore dump, so trust its shape here.
const read = (n: string): RawItem[] => JSON.parse(readFileSync(join(src, `${n}.json`), 'utf8')) as RawItem[]
const LISTS = ['technologies', 'skills', 'subjects', 'languages']

function clean(item: RawItem): RawItem {
  const o = { ...item }
  for (const k of LISTS) if (k in o) o[k] = toList(o[k] as string | string[] | null) // raw export mixes strings and arrays
  if (o.image) o.image = `/img/${imageName(o.imageFileName, o.image)}.webp`
  if (o.photo) o.photo = `/img/${imageName(o.photoFileName, o.photo)}.webp`
  delete o.imageFileName
  delete o.photoFileName
  return o
}

const write = (n: string, data: unknown) => writeFileSync(join(out, `${n}.json`), JSON.stringify(data, null, 2) + '\n')
mkdirSync(out, { recursive: true })
const about = read('portfolio').find((d) => d.id === 'about-me')
if (!about) throw new Error('about-me not found in portfolio.json')
write('about', clean(about))
for (const n of ['experience', 'projects', 'education', 'certificates', 'organizations']) write(n, read(n).map(clean))
