import dayjs from '@backend/lib/date'
import { afterAll, beforeAll } from 'vitest'

import type { AuthState } from './auth-state'
import { createAuthState } from './auth-state'

describe('createAuthState', () => {
  describe('認証ステートの期限', () => {
    describe('10分後の有効期限を設定する場合', () => {
      let authState: AuthState

      beforeAll(() => {
        vi.useFakeTimers()
        const now = dayjs('2026-02-22T10:00:00Z').toDate()
        vi.setSystemTime(now)

        const expiresAt = dayjs().add(10, 'minutes')
        authState = createAuthState({
          state: 'test-state',
          nonce: 'test-nonce',
          codeVerifier: 'test-code-verifier',
          returnTo: '/dashboard',
          expiresAt,
        })
      })

      afterAll(() => {
        vi.useRealTimers()
      })

      test('expiresAtが指定した値と一致する', () => {
        const expected = dayjs('2026-02-22T10:10:00.000Z')
        expect(authState.expiresAt.isSame(expected)).toBe(true)
      })

      test('expiresAtのISO文字列が期待通りである', () => {
        expect(authState.expiresAt.toISOString()).toBe(
          '2026-02-22T10:10:00.000Z',
        )
      })
    })

    describe('30分後の有効期限を設定する場合', () => {
      let authState: AuthState

      beforeAll(() => {
        vi.useFakeTimers()
        const now = dayjs('2026-02-22T10:00:00Z').toDate()
        vi.setSystemTime(now)

        const expiresAt = dayjs().add(30, 'minutes')
        authState = createAuthState({
          state: 'test-state',
          nonce: 'test-nonce',
          codeVerifier: 'test-code-verifier',
          returnTo: '/dashboard',
          expiresAt,
        })
      })

      afterAll(() => {
        vi.useRealTimers()
      })

      test('expiresAtのISO文字列が期待通りである', () => {
        expect(authState.expiresAt.toISOString()).toBe(
          '2026-02-22T10:30:00.000Z',
        )
      })
    })
  })

  describe('returnToパスの正規化', () => {
    const baseProps: Omit<AuthState, 'key' | 'returnTo'> = {
      state: 'test-state',
      nonce: 'test-nonce',
      codeVerifier: 'test-code-verifier',
      expiresAt: dayjs().add(10, 'minutes'),
    }

    describe('正常系', () => {
      test.each([
        { input: '/', expected: '/', description: 'ルートパス' },
        {
          input: '/dashboard',
          expected: '/dashboard',
          description: '単純なパス',
        },
        {
          input: '/users/123',
          expected: '/users/123',
          description: 'パラメータ付きパス',
        },
        {
          input: '/settings?tab=profile',
          expected: '/settings?tab=profile',
          description: 'クエリパラメータ付き',
        },
        {
          input: '/dashboard/',
          expected: '/dashboard/',
          description: '末尾スラッシュ付き',
        },
        {
          input: '/posts/123/edit',
          expected: '/posts/123/edit',
          description: '深いパス',
        },
        {
          input: '/search?q=test&page=1',
          expected: '/search?q=test&page=1',
          description: '複数クエリパラメータ',
        },
        {
          input: '/items#section',
          expected: '/items#section',
          description: 'ハッシュフラグメント付き',
        },
        {
          input: '/path-with-dash',
          expected: '/path-with-dash',
          description: 'ハイフンを含むパス',
        },
        {
          input: '/path_with_underscore',
          expected: '/path_with_underscore',
          description: 'アンダースコアを含むパス',
        },
      ])('$description: "$input" -> "$expected"', ({ input, expected }) => {
        const authState = createAuthState({
          ...baseProps,
          returnTo: input,
        })

        expect(authState.returnTo).toBe(expected)
      })
    })

    describe('異常系', () => {
      test.each([
        // 不正な相対パス
        {
          input: 'dashboard',
          description: '先頭スラッシュなし',
        },
        {
          input: './dashboard',
          description: './ で始まる相対パス',
        },
        {
          input: '../admin',
          description: '../ で始まる相対パス',
        },
        {
          input: '../../settings',
          description: '複数階層の相対パス',
        },
        // Open Redirect対策
        {
          input: 'https://example.com',
          description: '完全なURL (https)',
        },
        {
          input: 'http://example.com',
          description: '完全なURL (http)',
        },
        {
          input: '//evil.com',
          description: 'プロトコル相対URL',
        },
        {
          input: '//evil.com/path',
          description: 'プロトコル相対URLとパス',
        },
        {
          input: 'javascript:alert(1)',
          description: 'JavaScriptスキーム',
        },
        {
          input: 'data:text/html,<script>alert(1)</script>',
          description: 'dataスキーム',
        },
        {
          input: 'mailto:test@example.com',
          description: 'mailtoスキーム',
        },
        {
          input: '\\\\evil.com',
          description: 'バックスラッシュによる回避試行',
        },
        {
          input: '/\\evil.com',
          description: 'スラッシュ+バックスラッシュ',
        },
        // 不正な文字列・エッジケース
        { input: '', description: '空文字列' },
        { input: ' ', description: 'スペースのみ' },
        {
          input: '   /dashboard   ',
          description: '前後の空白',
        },
        {
          input: '/path with spaces',
          description: 'スペースを含むパス',
        },
        {
          input: '/日本語/パス',
          description: '日本語を含むパス',
        },
        {
          input: '?query=only',
          description: 'クエリのみ',
        },
        {
          input: '#hash-only',
          description: 'ハッシュのみ',
        },
      ])('$description: "$input"', ({ input }) => {
        const authState = createAuthState({
          ...baseProps,
          returnTo: input,
        })

        expect(authState.returnTo).toBe('/')
      })
    })
  })
})
