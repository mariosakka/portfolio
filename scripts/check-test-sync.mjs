#!/usr/bin/env node
// Fails when src/ code changes without a test change, or tests/sources are removed out of step.
// Usage: node scripts/check-test-sync.mjs [baseRef=origin/main]
// Bypass: "Tests-Not-Applicable: <reason>" trailer in any commit in range, or env TEST_SYNC_BYPASS=<reason>.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const isTest = (p) => p.endsWith('.test.js')
const isSource = (p) =>
  p.startsWith('src/') && !isTest(p) && !/^src\/data\/.*\.json$/.test(p) && !p.startsWith('src/assets/') && p !== 'src/style.css'
const stem = (p) => p.split('/').pop().replace(/\.test\.js$/, '').replace(/\.[^.]+$/, '')

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

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const ok = (...a) => { try { git(...a); return true } catch { return false } }

function main() {
  const arg = process.argv[2] || 'origin/main'
  const base = ok('rev-parse', '--verify', '--quiet', `${arg}^{commit}`) ? arg : git('rev-list', '--max-parents=0', 'HEAD').split('\n')[0]
  const range = `${base}...HEAD`
  const changes = git('diff', '--name-status', '--no-renames', range)
    .split('\n').filter(Boolean).map((l) => { const [status, path] = l.split('\t'); return { status: status[0], path } })
  const authors = git('log', '--format=%an', `${base}..HEAD`).split('\n').filter(Boolean)
  const msgs = git('log', '--format=%B', `${base}..HEAD`)
  const trailer = msgs.match(/^Tests-Not-Applicable:\s*(\S.*)$/m)
  const bot = authors.length > 0 && authors.every((a) => /dependabot/i.test(a))
  const bypass = process.env.TEST_SYNC_BYPASS || trailer?.[1] || (bot ? 'bot commits' : null)
  const existingTests = git('ls-files', '*.test.js').split('\n').filter(Boolean)
  const { ok: pass, problems } = evaluate({ changes, bypass, existingTests })
  if (!pass) {
    console.error(`check-test-sync (${range}):\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`check-test-sync: ok (${range}${bypass ? `, bypass: ${bypass}` : ''})`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
