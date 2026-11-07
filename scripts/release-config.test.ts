import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// vitest runs from the repo root; normalize CRLF so the regexes pass on Windows checkouts too
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const pkg = JSON.parse(read('package.json')) as { version: string }
const manifest = JSON.parse(read('.release-please-manifest.json')) as Record<string, string>
const config = JSON.parse(read('release-please-config.json')) as {
  'initial-version'?: string
  packages: Record<string, { 'release-type': string }>
}
const workflow = read('.github/workflows/release-please.yml')

test('package.json version is plain semver', () => {
  expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)
})

test('manifest root version equals package.json version', () => {
  expect(manifest['.']).toBe(pkg.version)
})

test('config releases the root package as node', () => {
  expect(config.packages['.']?.['release-type']).toBe('node')
})

test('first release starts at 0.1.0, not the default 1.0.0', () => {
  expect(config['initial-version']).toBe('0.1.0')
})

test('workflow pins release-please to a 40-hex SHA with a v5.0.0 comment', () => {
  expect(workflow).toMatch(/uses: googleapis\/release-please-action@[0-9a-f]{40} # v5\.0\.0\n/)
})

test('workflow: top-level read, write permissions only on the job', () => {
  const [top, jobs] = workflow.split(/^jobs:/m)
  expect(top).toMatch(/^permissions:\n {2}contents: read\n/m)
  expect(top).not.toMatch(/write/)
  expect(jobs).toMatch(/permissions:\n {6}contents: write\n {6}pull-requests: write/)
  expect(jobs).toMatch(/timeout-minutes:/)
})
