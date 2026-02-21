import type { AuthStateKey } from '@backend/domains/auth-state'
import { createAuthState } from '@backend/domains/auth-state'
import dayjs from '@backend/lib/date'
import { authStatesTable } from '@backend/schemas/auth-states'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { decode } from 'hono/jwt'
import { testClient } from 'hono/testing'

import callbackRoute from './route'

describe('GET /api/auth/callback', () => {
  const client = testClient(callbackRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('normal', () => {
    describe('signup', () => {
      let authStateKey: AuthStateKey
      let response: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        const authState = createAuthState({
          state: 'auth-state',
          nonce: 'auth-nonce',
          codeVerifier: 'auth-code-verifier',
          returnTo: '/dashboard',
          expiresAt: dayjs().add(10, 'minute'),
        })
        authStateKey = authState.key

        await db.insert(authStatesTable).values({
          key: authState.key,
          state: authState.state,
          nonce: authState.nonce,
          code_verifier: authState.codeVerifier,
          return_to: authState.returnTo,
          expires_at: authState.expiresAt.toISOString(),
        })

        response = await client.index.$get(
          {
            query: {
              code: 'auth-code-123',
              state: 'auth-state',
            },
          },
          {
            headers: {
              Cookie: `__Host-Http-auth-state-key=${authStateKey}`,
            },
          },
        )
      })

      test('return 302', () => {
        expect(response.status).toBe(302)
      })

      test('redirect to /dashboard', () => {
        expect(response.headers.get('Location')).toBe('/dashboard')
      })

      test('auth state will be cleaned up', async () => {
        const items = await db.select().from(authStatesTable)
        expect(items).toHaveLength(0)
      })

      describe('check generated session', () => {
        let sessionId: string
        let userId: string

        beforeAll(() => {
          const cookieHeaderRaw = response.headers.get('Set-Cookie')
          const sessionCookieRaw = cookieHeaderRaw
            ?.split(', ')
            .filter((header) => header.startsWith('__Host-Http-session='))
            .at(0)
            ?.replace(/^__Host-Http-session=(.+?);.+$/, '$1')

          const sessionCookie = sessionCookieRaw
            ? decode(sessionCookieRaw)
            : undefined

          sessionId = sessionCookie?.payload['sid'] as string
          userId = sessionCookie?.payload['uid'] as string
        })

        test('session id is set in JWT', () => {
          expect(sessionId).toBeDefined()
        })

        test('user id is set in JWT', () => {
          expect(userId).toBeDefined()
        })

        test('session exists', async () => {
          const actual = await db
            .select()
            .from(sessionsTable)
            .where(eq(sessionsTable.id, sessionId))
          expect(actual).toHaveLength(1)
        })

        test('user exists', async () => {
          const actual = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
          expect(actual).toHaveLength(1)
        })
      })
    })

    describe('signin', () => {
      let existingUserId: string
      let authStateKey: AuthStateKey
      let response: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        // 事前に既存ユーザーを作成
        const existingUser = {
          id: 'existing-user-id-12345678901234',
          email: 'test@example.com',
          idp_iss: 'https://tenant.region.auth0.com/',
          idp_sub: 'auth0|123456',
        }
        existingUserId = existingUser.id

        await db.insert(usersTable).values(existingUser)

        // authStateを作成
        const authState = createAuthState({
          state: 'signin-state',
          nonce: 'signin-nonce',
          codeVerifier: 'signin-code-verifier',
          returnTo: '/dashboard',
          expiresAt: dayjs().add(10, 'minute'),
        })
        authStateKey = authState.key

        await db.insert(authStatesTable).values({
          key: authState.key,
          state: authState.state,
          nonce: authState.nonce,
          code_verifier: authState.codeVerifier,
          return_to: authState.returnTo,
          expires_at: authState.expiresAt.toISOString(),
        })

        // callbackエンドポイントを呼び出す
        response = await client.index.$get(
          {
            query: {
              code: 'auth-code-456',
              state: 'signin-state',
            },
          },
          {
            headers: {
              Cookie: `__Host-Http-auth-state-key=${authStateKey}`,
            },
          },
        )
      })

      test('return 302', () => {
        expect(response.status).toBe(302)
      })

      test('redirect to /dashboard', () => {
        expect(response.headers.get('Location')).toBe('/dashboard')
      })

      test('auth state will be cleaned up', async () => {
        const items = await db.select().from(authStatesTable)
        expect(items).toHaveLength(0)
      })

      describe('check generated session', () => {
        let sessionId: string
        let userId: string

        beforeAll(() => {
          const cookieHeaderRaw = response.headers.get('Set-Cookie')
          const sessionCookieRaw = cookieHeaderRaw
            ?.split(', ')
            .filter((header) => header.startsWith('__Host-Http-session='))
            .at(0)
            ?.replace(/^__Host-Http-session=(.+?);.+$/, '$1')

          const sessionCookie = sessionCookieRaw
            ? decode(sessionCookieRaw)
            : undefined

          sessionId = sessionCookie?.payload['sid'] as string
          userId = sessionCookie?.payload['uid'] as string
        })

        test('session id is set in JWT', () => {
          expect(sessionId).toBeDefined()
        })

        test('user id is set in JWT', () => {
          expect(userId).toBeDefined()
        })

        test('user id matches existing user', () => {
          expect(userId).toBe(existingUserId)
        })

        test('session exists', async () => {
          const actual = await db
            .select()
            .from(sessionsTable)
            .where(eq(sessionsTable.id, sessionId))
          expect(actual).toHaveLength(1)
        })

        test('user count is still 1', async () => {
          const actual = await db.select().from(usersTable)
          expect(actual).toHaveLength(1)
        })
      })
    })
  })

  describe('abnormal', () => {
    describe('auth state key does not exist', () => {
      let actual: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        actual = await client.index.$get(
          {
            query: {
              code: 'auth-code-123',
              state: 'auth-state',
            },
          },
          // auth state key クッキーを送信しない
        )
      })

      test('return 302', () => {
        expect(actual.status).toBe(302)
      })

      test('redirect to root', () => {
        expect(actual.headers.get('Location')).toBe('/')
      })
    })

    describe('auth state key is invalid', () => {
      let actual: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        actual = await client.index.$get(
          {
            query: {
              code: 'auth-code-123',
              state: 'auth-state',
            },
          },
          {
            headers: {
              // 存在しない/無効な auth state key を送信
              Cookie:
                '__Host-Http-auth-state-key=invalid-key-12345678901234567890123456',
            },
          },
        )
      })

      test('return 302', () => {
        expect(actual.status).toBe(302)
      })

      test('redirect to root', () => {
        expect(actual.headers.get('Location')).toBe('/')
      })
    })

    describe('auth state has expired', () => {
      let authStateKey: AuthStateKey
      let actual: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        const authState = createAuthState({
          state: 'expired-state',
          nonce: 'expired-nonce',
          codeVerifier: 'expired-code-verifier',
          returnTo: '/dashboard',
          expiresAt: dayjs().subtract(1, 'hour'), // 有効期限切れ
        })
        authStateKey = authState.key

        await db.insert(authStatesTable).values({
          key: authState.key,
          state: authState.state,
          nonce: authState.nonce,
          code_verifier: authState.codeVerifier,
          return_to: authState.returnTo,
          expires_at: authState.expiresAt.toISOString(),
        })

        actual = await client.index.$get(
          {
            query: {
              code: 'auth-code-123',
              state: 'expired-state',
            },
          },
          {
            headers: {
              Cookie: `__Host-Http-auth-state-key=${authStateKey}`,
            },
          },
        )
      })

      test('return 302', () => {
        expect(actual.status).toBe(302)
      })

      test('redirect to root', () => {
        expect(actual.headers.get('Location')).toBe('/')
      })
    })
  })
})
