import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'

import userRoute from './route'

describe('GET /api/user/me', () => {
  const client = testClient(userRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('正常系', () => {
    let response: Awaited<ReturnType<typeof client.me.$get>>
    let userId: string
    let responseBody: { message: string } | { id: string; email: string }

    beforeAll(async () => {
      // ユーザーを作成
      const user = createUser({
        email: 'test@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|123456',
      })
      userId = user.id

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // セッションを作成
      const now = dayjs()
      const session = createSession({
        user,
        expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
        idpSessionId: 'idp-session-123',
      })

      await db.insert(sessionsTable).values({
        id: session.id,
        user_id: session.userId,
        issued_at: session.issuedAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        idp_session_id: session.idpSessionId,
      })

      // セッション JWT を作成
      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: session.id,
        userId: user.id,
        now,
        expiresIn: SESSION_JWT_AGE,
      })

      // ユーザー情報取得リクエストを送信
      response = await client.me.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      responseBody = await response.json()
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('ユーザーIDが返ること', () => {
      if ('message' in responseBody) {
        throw new Error('Expected user data, got error message')
      }
      expect(responseBody.id).toBe(userId)
    })

    test('メールアドレスが返ること', () => {
      if ('message' in responseBody) {
        throw new Error('Expected user data, got error message')
      }
      expect(responseBody.email).toBe('test@example.com')
    })
  })

  describe('異常系 - セッションなし', () => {
    let response: Awaited<ReturnType<typeof client.me.$get>>
    let responseBody: { message: string } | { id: string; email: string }

    beforeAll(async () => {
      // クッキーなしでリクエスト
      response = await client.me.$get({})
      responseBody = await response.json()
    })

    test('401が返ること', () => {
      expect(response.status).toBe(401)
    })

    test('エラーメッセージが返ること', () => {
      if (!('message' in responseBody)) {
        throw new Error('Expected error message, got user data')
      }
      expect(responseBody.message).toBe('Unauthorized')
    })
  })

  describe('異常系 - 無効なセッションJWT', () => {
    let response: Awaited<ReturnType<typeof client.me.$get>>
    let responseBody: { message: string } | { id: string; email: string }

    beforeAll(async () => {
      // 無効なJWTでリクエスト
      response = await client.me.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=invalid.jwt.token`,
          },
        },
      )
      responseBody = await response.json()
    })

    test('401が返ること', () => {
      expect(response.status).toBe(401)
    })

    test('エラーメッセージが返ること', () => {
      if (!('message' in responseBody)) {
        throw new Error('Expected error message, got user data')
      }
      expect(responseBody.message).toBe('Unauthorized')
    })
  })
})
