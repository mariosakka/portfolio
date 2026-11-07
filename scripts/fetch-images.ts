// Usage: node scripts/fetch-images.ts [sourceDir]  (default docs/reference/firestore-export)
// Downloads the Storage images referenced in the raw export and writes optimized webp to public/img.
import { readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import sharp from 'sharp'
import { imageName } from '../src/lib/normalize.ts'

const src = resolve(process.argv[2] ?? 'docs/reference/firestore-export')
const out = resolve('public/img')
mkdirSync(out, { recursive: true })

interface RawItem {
  image?: string
  photo?: string
  imageFileName?: string
  photoFileName?: string
}
// JSON.parse returns any; the export file is our own one-off Firestore dump.
const items: RawItem[] = readdirSync(src).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(join(src, f), 'utf8')) as RawItem[])
for (const it of items) {
  for (const [field, width] of [['image', 960], ['photo', 600]] as const) {
    const url = it[field]
    if (!url) continue
    const name = imageName(it[`${field}FileName` as const], url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} fetching ${name}`)
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(out, `${name}.webp`))
    console.log('wrote', `${name}.webp`)
  }
}
