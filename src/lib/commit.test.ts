import { describe, it, expect } from 'vitest'
import { readCommit } from './commit'

describe('readCommit', () => {
  it('uses env', () => {
    expect(readCommit({ GITHUB_SHA: 'abcdef1234567', COMMIT_MESSAGE: 'hi' }, () => '')).toEqual({ message: 'hi', sha: 'abcdef1' })
  })
  it('falls back to gitLog', () => {
    expect(readCommit({}, () => 'abc1234 fix nav\n')).toEqual({ message: 'fix nav', sha: 'abc1234' })
  })
  it('returns null on failure', () => {
    expect(readCommit({}, () => { throw new Error('x') })).toBeNull()
  })
  it('cuts to first line', () => {
    expect(readCommit({ GITHUB_SHA: 'abcdef1234', COMMIT_MESSAGE: 'one\ntwo' }, () => '')?.message).toBe('one')
  })
})
