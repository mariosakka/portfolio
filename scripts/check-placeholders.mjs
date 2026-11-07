#!/usr/bin/env node
// Usage: node scripts/check-placeholders.mjs [dataDir]  (default src/data). Warns only, always exits 0.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'src/data'
const JUNK = /^(aaa|aaaa|lorem)$/i
const MUST_FILL = ['longDescription', 'image']

function walk(v, path, out) {
  if (typeof v === 'string') {
    const key = path.match(/(\w+)$/)?.[1]
    if (JUNK.test(v.trim()) || (v === '' && MUST_FILL.includes(key))) out.push(path)
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out))
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`, out)
}

let n = 0
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const out = []
  walk(JSON.parse(readFileSync(join(dir, f), 'utf8')), f.slice(0, -5), out)
  for (const p of out) console.log(`warn ${p}`)
  n += out.length
}
console.log(`${n} placeholder warning(s)`)
