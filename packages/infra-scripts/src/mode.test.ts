import { Result } from '@praha/byethrow'

import { parseMode } from './mode'

describe('parseMode', () => {
  test.each([
    { input: '', expected: undefined },
    { input: 'local', expected: undefined },
    { input: 'development', expected: 'development' },
    { input: 'staging', expected: 'staging' },
    { input: 'production', expected: 'production' },
    { input: 'Development', expected: undefined },
  ])('$input -> $expected', ({ input, expected }) => {
    const actual = Result.unwrap(parseMode(input), undefined)
    expect(actual).toBe(expected)
  })
})
