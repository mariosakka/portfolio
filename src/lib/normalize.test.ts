import { describe, it, expect } from 'vitest'
import { toList, formatPeriod } from './normalize'

describe('toList', () => {
  it('splits on unescaped commas and honors escaped commas', () => {
    expect(toList('React, Node.js, C\\, C++')).toEqual(['React', 'Node.js', 'C, C++'])
  })
  it('trims arrays', () => expect(toList(['a', ' b '])).toEqual(['a', 'b']))
  it('handles null', () => expect(toList(null)).toEqual([]))
  it('drops empties', () => expect(toList('a,, ,b')).toEqual(['a', 'b']))
})

describe('formatPeriod', () => {
  it('present', () => expect(formatPeriod('2025-09-29', '', true)).toBe('Sep 2025 - Present'))
  it('range', () => expect(formatPeriod('2018-09-03', '2022-07-20', false)).toBe('Sep 2018 - Jul 2022'))
  it('empty', () => expect(formatPeriod('', '', false)).toBe(''))
})
