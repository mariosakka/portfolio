import { describe, it, expect } from 'vitest'
import { toList, formatPeriod, fitTags } from './normalize'

describe('toList', () => {
  it('splits on unescaped commas and honors escaped commas', () => {
    expect(toList('React, Node.js, C\\, C++')).toEqual(['React', 'Node.js', 'C, C++'])
  })
  it('trims arrays', () => expect(toList(['a', ' b '])).toEqual(['a', 'b']))
  it('handles null', () => expect(toList(null)).toEqual([]))
  it('drops empties', () => expect(toList('a,, ,b')).toEqual(['a', 'b']))
})

describe('fitTags', () => {
  // cost per chip = text length + 4 (padding and gap); a "+k" chip costs 6 and is reserved while tags remain
  it('keeps everything within the budget', () => expect(fitTags(['ab', 'cd'], 12)).toEqual({ shown: ['ab', 'cd'], more: 0 }))
  it('stops early and reserves room for the +k chip', () => {
    expect(fitTags(['aaaa', 'bbbb', 'cccc', 'dddd'], 21)).toEqual({ shown: ['aaaa'], more: 3 })
    expect(fitTags(['aaaa', 'bbbb', 'cccc', 'dddd'], 22)).toEqual({ shown: ['aaaa', 'bbbb'], more: 2 })
    expect(fitTags(['aaaa', 'bbbb', 'cccc'], 24)).toEqual({ shown: ['aaaa', 'bbbb', 'cccc'], more: 0 })
  })
  it('keeps order and never skips a tag to fit a later one', () => {
    expect(fitTags(['a', 'a-very-long-tag', 'b'], 20)).toEqual({ shown: ['a'], more: 2 })
  })
  it('always shows at least one tag', () => expect(fitTags(['a-tag-longer-than-budget', 'x'], 5)).toEqual({ shown: ['a-tag-longer-than-budget'], more: 1 }))
  it('handles none', () => expect(fitTags([], 10)).toEqual({ shown: [], more: 0 }))
})

describe('formatPeriod', () => {
  it('present', () => expect(formatPeriod('2025-09-29', '', true)).toBe('Sep 2025 - Present'))
  it('range', () => expect(formatPeriod('2018-09-03', '2022-07-20', false)).toBe('Sep 2018 - Jul 2022'))
  it('empty', () => expect(formatPeriod('', '', false)).toBe(''))
})
