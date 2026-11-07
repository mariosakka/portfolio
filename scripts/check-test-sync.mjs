#!/usr/bin/env node
// Fails when src/ code changes without a test change, or tests/sources are removed out of step.
// Usage: node scripts/check-test-sync.mjs [baseRef=origin/main]
// Rules: src/ code (not src/data/*.json, *.test.js, src/assets, src/style.css) added/modified needs a *.test.js
//   added/modified in the same range; a deleted source must not leave a test with the same path stem;
//   a test deleted without its source needs a reason.
// Bypass: a "Tests-Not-Applicable: <reason>" line (same line, non-empty) in the LAST paragraph (trailer block)
//   of any commit message in the range, or env TEST_SYNC_BYPASS=<reason>. Commits by the exact identity
//   dependabot[bot] (noreply email) are exempt when every commit in the range is such a commit.
// Base: an unresolvable base ref FAILS loudly (fetch more history or pass a base). Set TEST_SYNC_ALLOW_ROOT=1
//   to diff from the root commit instead (first-ever push of a brand-new repo only).
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const isTest = (p) => p.endsWith('.test.js')
const isSource = (p) =>
  p.startsWith('src/') && !isTest(p) && !/^src\/data\/.*\.json$/.test(p) && !p.startsWith('src/assets/') && p !== 'src/style.css'
// Full-path stem: src/a/index.js and src/a/index.test.js pair; src/b/index.test.js does not.
const stem = (p) => p.replace(/\.test\.js$/, '').replace(/\.[^./]+$/, '')

export function evaluate({ changes, bypass = null, existingTests = [] }) {
  if (bypass) return { ok: true, problems: [] }
  const problems = []
  const touched = changes.filter((x) => x.status !== 'D')
  const srcTouched = touched.filter((x) => isSource(x.path))
  if (srcTouched.length && !touched.some((x) => isTest(x.path))) {
    problems.push(`source changed without a test change: ${srcTouched.map((x) => x.path).join(', ')}`)
  }
  const deletedSrc = changes.filter((x) => x.status === 'D' && isSource(x.path))
  for (const s of deletedSrc) {
    const t = existingTests.find((p) => stem(p) === stem(s.path))
    if (t) problems.push(`${s.path} was deleted but ${t} still exists`)
  }
  for (const t of changes.filter((x) => x.status === 'D' && isTest(x.path))) {
    if (!deletedSrc.some((s) => stem(s.path) === stem(t.path))) problems.push(`test deleted without its source: ${t.path} (add a Tests-Not-Applicable trailer with a reason)`)
  }
  return { ok: problems.length === 0, problems }
}

export function resolveBase(arg, { resolves, rootCommit, allowRoot = false }) {
  if (resolves(arg)) return arg
  if (allowRoot) return rootCommit()
  throw new Error(`base ref "${arg}" does not resolve. Fetch more history (git fetch --unshallow / --depth) or pass an existing base ref; set TEST_SYNC_ALLOW_ROOT=1 only for a brand-new repo.`)
}

export function findBypass(messages) {
  for (const m of messages) {
    const last = m.trim().split(/\r?\n[ \t]*\r?\n/).pop()
    const hit = last.match(/^Tests-Not-Applicable:[ \t]*(\S.*?)[ \t]*$/m)
    if (hit) return hit[1]
  }
  return null
}

export const isBot = (name, email) => name === 'dependabot[bot]' && email.endsWith('@users.noreply.github.com')

const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', ...a], { encoding: 'utf8' }).trim()
const resolves = (ref) => { try { git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`); return true } catch { return false } }

function main() {
  let base
  try {
    base = resolveBase(process.argv[2] || 'origin/main', {
      resolves,
      rootCommit: () => git('rev-list', '--max-parents=0', 'HEAD').split('\n')[0],
      allowRoot: process.env.TEST_SYNC_ALLOW_ROOT === '1',
    })
  } catch (e) {
    console.error(`check-test-sync: ${e.message}`)
    process.exit(2)
  }
  const range = `${base}...HEAD`
  const changes = git('diff', '--name-status', '--no-renames', '-z', range)
    .split('\0').filter(Boolean).reduce((acc, tok, i, all) => (i % 2 === 0 ? acc.concat({ status: tok[0], path: all[i + 1] }) : acc), [])
  const ids = git('log', '--format=%an|%ae', `${base}..HEAD`).split('\n').filter(Boolean).map((l) => l.split('|'))
  const msgs = git('log', '-z', '--format=%B', `${base}..HEAD`).split('\0').filter(Boolean)
  const bot = ids.length > 0 && ids.every(([n, e]) => isBot(n, e))
  const bypass = process.env.TEST_SYNC_BYPASS || findBypass(msgs) || (bot ? 'bot commits' : null)
  const existingTests = git('ls-files', '*.test.js').split('\n').filter(Boolean)
  const { ok: pass, problems } = evaluate({ changes, bypass, existingTests })
  if (!pass) {
    console.error(`check-test-sync (${range}):\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`check-test-sync: ok (${range}${bypass ? `, bypass: ${bypass}` : ''})`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
