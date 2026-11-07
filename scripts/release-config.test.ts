import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const read = (p: string) => readFileSync(p, 'utf8') // vitest runs from the repo root
const pkg = JSON.parse(read('package.json')) as { version: string }
const manifest = JSON.parse(read('.release-please-manifest.json')) as Record<string, string>
const config = JSON.parse(read('release-please-config.json')) as {
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
