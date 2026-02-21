import type { AuthState, AuthStateKey } from '@backend/domains/auth-state'
import type { User, UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import { InvalidAuthStateException, OAuthFlowException } from './exception'
import type { IdPUserInfo } from './types'
import type { HandleLoginCallbackWorkflowCommand } from './workflow'
import { buildHandleLoginCallbackWorkflow } from './workflow'

describe('buildHandleLoginCallbackWorkflow', () => {
  describe('正常系 - 既存ユーザーでログイン成功', () => {
    const mockAuthState: AuthState = {
      key: 'test-auth-state-key' as AuthStateKey,
      state: 'test-state',
      nonce: 'test-nonce',
      codeVerifier: 'test-code-verifier',
      returnTo: '/dashboard',
      expiresAt: dayjs('2026-02-23T12:00:00Z'),
    }

    const mockUser: User = {
      id: 'existing-user-id' as UserId,
      email: 'existing@example.com',
      idpIssuer: 'https://idp.example.com',
      idpSubject: 'existing-subject',
    }

    const mockUserInfo: IdPUserInfo = {
      iss: 'https://idp.example.com',
      sub: 'existing-subject',
      email: 'existing@example.com',
      sid: 'session-id-123',
    }

    const command: HandleLoginCallbackWorkflowCommand = {
      input: {
        requestUri: new URL(
          'https://app.example.com/auth/callback?code=auth-code&state=test-state',
        ),
      },
      context: {
        authStateKey: 'test-auth-state-key',
      },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildHandleLoginCallbackWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildHandleLoginCallbackWorkflow({
        findAuthState: () => Promise.resolve(Result.succeed(mockAuthState)),
        exchangeCodeForUserInfo: () =>
          Promise.resolve(Result.succeed(mockUserInfo)),
        findUserByClaims: () => Promise.resolve(mockUser),
      })

      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('イベントタイプがexistingであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.type).toBe('existing')
    })

    test('既存ユーザー情報が含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      if (actual.value.type !== 'existing') throw new Error('Expected existing')
      expect(actual.value.user).toStrictEqual(mockUser)
    })

    test('authStateが含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.authState).toStrictEqual(mockAuthState)
    })

    test('セッションIDが含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.sid).toBe('session-id-123')
    })
  })

  describe('正常系 - 新規ユーザーでログイン成功', () => {
    const mockAuthState: AuthState = {
      key: 'test-auth-state-key' as AuthStateKey,
      state: 'test-state',
      nonce: 'test-nonce',
      codeVerifier: 'test-code-verifier',
      returnTo: '/dashboard',
      expiresAt: dayjs('2026-02-23T12:00:00Z'),
    }

    const mockUserInfo: IdPUserInfo = {
      iss: 'https://idp.example.com',
      sub: 'new-subject',
      email: 'new@example.com',
      sid: 'session-id-456',
    }

    const command: HandleLoginCallbackWorkflowCommand = {
      input: {
        requestUri: new URL(
          'https://app.example.com/auth/callback?code=auth-code&state=test-state',
        ),
      },
      context: {
        authStateKey: 'test-auth-state-key',
      },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildHandleLoginCallbackWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildHandleLoginCallbackWorkflow({
        findAuthState: () => Promise.resolve(Result.succeed(mockAuthState)),
        exchangeCodeForUserInfo: () =>
          Promise.resolve(Result.succeed(mockUserInfo)),
        findUserByClaims: () => Promise.resolve(undefined),
      })

      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('イベントタイプがcreate_newであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.type).toBe('create_new')
    })

    test('新規ユーザー情報が含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      if (actual.value.type !== 'create_new')
        throw new Error('Expected create_new')
      expect(actual.value.user).toStrictEqual({
        email: 'new@example.com',
        idpIssuer: 'https://idp.example.com',
        idpSubject: 'new-subject',
      })
    })

    test('authStateが含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.authState).toStrictEqual(mockAuthState)
    })

    test('セッションIDが含まれること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.sid).toBe('session-id-456')
    })
  })

  describe('異常系 - authStateKeyが未定義', () => {
    const command: HandleLoginCallbackWorkflowCommand = {
      input: {
        requestUri: new URL(
          'https://app.example.com/auth/callback?code=auth-code&state=test-state',
        ),
      },
      context: {
        authStateKey: undefined,
      },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildHandleLoginCallbackWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildHandleLoginCallbackWorkflow({
        findAuthState: () => {
          throw new Error('Should not be called')
        },
        exchangeCodeForUserInfo: () => {
          throw new Error('Should not be called')
        },
        findUserByClaims: () => {
          throw new Error('Should not be called')
        },
      })

      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラー名がValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.name).toBe('ValidationException')
    })

    test('エラーメッセージにauthStateKeyが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('authStateKey')
    })
  })

  describe('異常系 - authStateの解決に失敗', () => {
    const mockInvalidAuthStateException = new InvalidAuthStateException(
      'AuthState not found or expired',
      undefined,
    )

    const command: HandleLoginCallbackWorkflowCommand = {
      input: {
        requestUri: new URL(
          'https://app.example.com/auth/callback?code=auth-code&state=test-state',
        ),
      },
      context: {
        authStateKey: 'invalid-key',
      },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildHandleLoginCallbackWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildHandleLoginCallbackWorkflow({
        findAuthState: () =>
          Promise.resolve(Result.fail(mockInvalidAuthStateException)),
        exchangeCodeForUserInfo: () => {
          throw new Error('Should not be called')
        },
        findUserByClaims: () => {
          throw new Error('Should not be called')
        },
      })

      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラー名がInvalidAuthStateExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.name).toBe('InvalidAuthStateException')
    })

    test('エラーメッセージが正しいこと', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toBe('AuthState not found or expired')
    })

    test('authStateがundefinedであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      if (!(actual.error instanceof InvalidAuthStateException)) {
        throw new Error('Expected InvalidAuthStateException')
      }
      expect(actual.error.authState).toBeUndefined()
    })
  })

  describe('異常系 - トークン交換に失敗', () => {
    const mockAuthState: AuthState = {
      key: 'test-auth-state-key' as AuthStateKey,
      state: 'test-state',
      nonce: 'test-nonce',
      codeVerifier: 'test-code-verifier',
      returnTo: '/dashboard',
      expiresAt: dayjs('2026-02-23T12:00:00Z'),
    }

    const mockOAuthFlowException = new OAuthFlowException(
      'Token exchange failed: invalid_grant',
    )

    const command: HandleLoginCallbackWorkflowCommand = {
      input: {
        requestUri: new URL(
          'https://app.example.com/auth/callback?code=invalid-code&state=test-state',
        ),
      },
      context: {
        authStateKey: 'test-auth-state-key',
      },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildHandleLoginCallbackWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildHandleLoginCallbackWorkflow({
        findAuthState: () => Promise.resolve(Result.succeed(mockAuthState)),
        exchangeCodeForUserInfo: () =>
          Promise.resolve(Result.fail(mockOAuthFlowException)),
        findUserByClaims: () => {
          throw new Error('Should not be called')
        },
      })

      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラー名がOAuthFlowExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.name).toBe('OAuthFlowException')
    })

    test('エラーメッセージが正しいこと', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toBe('Token exchange failed: invalid_grant')
    })
  })
})
