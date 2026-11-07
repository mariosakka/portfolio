import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CommitBadge from './CommitBadge.vue'

afterEach(() => vi.unstubAllGlobals())

describe('CommitBadge', () => {
  it('renders sha and message', () => {
    vi.stubGlobal('__LATEST_COMMIT__', { sha: 'abc1234', message: 'fix nav' })
    const t = mount(CommitBadge).text()
    expect(t).toContain('abc1234')
    expect(t).toContain('fix nav')
  })
  it('renders nothing when null', () => {
    vi.stubGlobal('__LATEST_COMMIT__', null)
    expect(mount(CommitBadge).html()).toBe('<!--v-if-->')
  })
})
