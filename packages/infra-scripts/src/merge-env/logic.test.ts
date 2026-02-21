import { beforeAll, describe, expect, test } from 'vitest'

import { mergeEnvLines } from './logic'

describe('mergeEnvLines', () => {
  describe('正常系', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(
        ['KEY1=old_value', 'KEY2=value2', '# comment', 'KEY3=value3'],
        { KEY1: 'new_value', KEY3: 'new_value3' },
      )
    })

    test('指定されたキーが更新されること', () => {
      expect(actual[0]).toBe('KEY1=new_value')
    })

    test('未指定のキーは変更されないこと', () => {
      expect(actual[1]).toBe('KEY2=value2')
    })

    test('コメント行は保持されること', () => {
      expect(actual[2]).toBe('# comment')
    })

    test('複数のキーが更新されること', () => {
      expect(actual[3]).toBe('KEY3=new_value3')
    })
  })

  describe('正常系 - 空の更新', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=value1', 'KEY2=value2'], {})
    })

    test('全ての行が変更されないこと', () => {
      expect(actual).toStrictEqual(['KEY1=value1', 'KEY2=value2'])
    })
  })

  describe('正常系 - 新規キーを追加', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=value1', 'KEY2=value2'], {
        KEY3: 'new_value',
      })
    })

    test('新しいキーが末尾に追加されること', () => {
      expect(actual[2]).toBe('KEY3=new_value')
    })

    test('既存のキーは変更されないこと', () => {
      expect(actual[0]).toBe('KEY1=value1')
      expect(actual[1]).toBe('KEY2=value2')
    })

    test('配列の長さが増えること', () => {
      expect(actual.length).toBe(3)
    })
  })

  describe('正常系 - 空行を含む', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=value1', '', 'KEY2=value2'], {
        KEY1: 'new_value',
      })
    })

    test('空行は保持されること', () => {
      expect(actual[1]).toBe('')
    })

    test('指定されたキーは更新されること', () => {
      expect(actual[0]).toBe('KEY1=new_value')
    })
  })

  describe('正常系 - 値に特殊文字を含む', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=old'], {
        KEY1: 'https://example.com?foo=bar&baz=qux',
      })
    })

    test('特殊文字を含む値が正しく設定されること', () => {
      expect(actual[0]).toBe('KEY1=https://example.com?foo=bar&baz=qux')
    })
  })

  describe('正常系 - 既存キーの上書きと新規キーの追加', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=old_value', 'KEY2=value2'], {
        KEY1: 'updated_value',
        KEY3: 'new_value',
        KEY4: 'another_new_value',
      })
    })

    test('既存のキーが更新されること', () => {
      expect(actual[0]).toBe('KEY1=updated_value')
    })

    test('既存の未指定キーは保持されること', () => {
      expect(actual[1]).toBe('KEY2=value2')
    })

    test('新規キーが末尾に追加されること', () => {
      expect(actual[2]).toBe('KEY3=new_value')
      expect(actual[3]).toBe('KEY4=another_new_value')
    })

    test('配列の長さが正しいこと', () => {
      expect(actual.length).toBe(4)
    })
  })

  describe('正常系 - 複数の新規キーのみを追加', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=value1'], {
        KEY2: 'value2',
        KEY3: 'value3',
      })
    })

    test('既存のキーは保持されること', () => {
      expect(actual[0]).toBe('KEY1=value1')
    })

    test('新規キーが順番に追加されること', () => {
      expect(actual[1]).toBe('KEY2=value2')
      expect(actual[2]).toBe('KEY3=value3')
    })

    test('配列の長さが正しいこと', () => {
      expect(actual.length).toBe(3)
    })
  })

  describe('正常系 - 数値型の値を含む', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['KEY1=old', 'KEY2=value2'], {
        KEY1: 8080,
        KEY3: 3000,
      })
    })

    test('数値が文字列に変換されて設定されること', () => {
      expect(actual[0]).toBe('KEY1=8080')
    })

    test('既存の未指定キーは保持されること', () => {
      expect(actual[1]).toBe('KEY2=value2')
    })

    test('新規の数値キーが追加されること', () => {
      expect(actual[2]).toBe('KEY3=3000')
    })
  })

  describe('正常系 - 文字列と数値の混在', () => {
    let actual: string[]

    beforeAll(() => {
      actual = mergeEnvLines(['PORT=8080'], {
        PORT: 3000,
        HOST: 'localhost',
        DEBUG: 'true',
      })
    })

    test('数値型のキーが更新されること', () => {
      expect(actual[0]).toBe('PORT=3000')
    })

    test('文字列型の新規キーが追加されること', () => {
      expect(actual[1]).toBe('HOST=localhost')
      expect(actual[2]).toBe('DEBUG=true')
    })
  })
})
