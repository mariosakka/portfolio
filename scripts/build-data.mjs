// Usage: node scripts/build-data.mjs [sourceDir]  (default docs/reference/firestore-export)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join, basename, extname } from 'node:path'
import { toList } from '../src/lib/normalize.js'

const src = resolve(process.argv[2] ?? 'docs/reference/firestore-export')
const out = resolve('src/data')
const read = (n) => JSON.parse(readFileSync(join(src, `${n}.json`), 'utf8'))
const LISTS = ['technologies', 'skills', 'subjects', 'languages']
const localPath = (fileName) => `/img/${basename(fileName, extname(fileName))}.webp`

// some items lack *FileName; the Storage URL path holds it (url-encoded)
export const fileNameFromUrl = (u) => decodeURIComponent(new URL(u).pathname.split('/o/')[1])

function clean(item) {
  const o = { ...item }
  for (const k of LISTS) if (k in o) o[k] = toList(o[k])
  if (o.image) o.image = localPath(o.imageFileName || fileNameFromUrl(o.image))
  if (o.photo) o.photo = localPath(o.photoFileName || fileNameFromUrl(o.photo))
  delete o.imageFileName
  delete o.photoFileName
  return o
}

const write = (n, data) => writeFileSync(join(out, `${n}.json`), JSON.stringify(data, null, 2) + '\n')
mkdirSync(out, { recursive: true })
const about = read('portfolio').find((d) => d.id === 'about-me')
if (!about) throw new Error('about-me not found in portfolio.json')
write('about', clean(about))
for (const n of ['experience', 'projects', 'education', 'certificates', 'organizations']) write(n, read(n).map(clean))
