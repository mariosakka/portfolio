// Usage: node scripts/fetch-images.mjs [sourceDir]  (default docs/reference/firestore-export)
// Downloads the Storage images referenced in the raw export and writes optimized webp to public/img.
import { readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import sharp from 'sharp'
import { imageName } from '../src/lib/normalize.js'

const src = resolve(process.argv[2] ?? 'docs/reference/firestore-export')
const out = resolve('public/img')
mkdirSync(out, { recursive: true })

const items = readdirSync(src).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(join(src, f), 'utf8')))
for (const it of items) {
  for (const [field, width] of [['image', 960], ['photo', 600]]) {
    if (!it[field]) continue
    const name = imageName(it[`${field}FileName`], it[field])
    const res = await fetch(it[field])
    if (!res.ok) throw new Error(`${res.status} fetching ${name}`)
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(out, `${name}.webp`))
    console.log('wrote', `${name}.webp`)
  }
}
