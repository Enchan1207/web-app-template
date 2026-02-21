import type { SessionId } from '@backend/domains/session'
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
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import logoutRoute from './route'

describe('POST /api/auth/logout', () => {
  const client = testClient(logoutRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('正常系', () => {
    let response: Awaited<ReturnType<typeof client.index.$post>>
    let sessionId: string

    beforeAll(async () => {
      // ユーザーを作成
      const user = createUser({
        email: 'test@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|123456',
      })

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
      sessionId = session.id

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

      // ログアウトリクエストを送信
      response = await client.index.$post(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
    })

    test('302が返ること', () => {
      expect(response.status).toBe(302)
    })

    test('Auth0のログアウトURLにリダイレクトすること', () => {
      const location = response.headers.get('Location')
      expect(location).toBeTruthy()
      // buildLogoutUrl によって生成されたログアウトURL
      expect(location).toBeDefined()
    })

    test('セッションが削除されていること', async () => {
      const storedSessions = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
      expect(storedSessions).toHaveLength(0)
    })

    test('セッションクッキーが削除されていること', () => {
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeTruthy()
      expect(setCookieHeader).toContain('__Host-Http-session=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })
  })

  describe('異常系 - セッションなし', () => {
    let response: Awaited<ReturnType<typeof client.index.$post>>

    beforeAll(async () => {
      // クッキーなしでリクエスト
      response = await client.index.$post({})
    })

    test('401が返ること', () => {
      expect(response.status).toBe(401)
    })

    test('エラーメッセージが返ること', async () => {
      const body = await response.json()
      expect(body).toStrictEqual({ message: 'Unauthorized' })
    })
  })

  describe('異常系 - セッションが見つからない', () => {
    let response: Awaited<ReturnType<typeof client.index.$post>>

    beforeAll(async () => {
      // ユーザーを作成（セッションは作成しない）
      const user = createUser({
        email: 'notsession@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|notfound',
      })

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // セッションは作成せずに JWT のみ作成
      const now = dayjs()
      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: ulid() as SessionId,
        userId: user.id,
        now,
        expiresIn: SESSION_JWT_AGE,
      })

      // ログアウトリクエストを送信
      response = await client.index.$post(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
    })

    test('404が返ること', () => {
      expect(response.status).toBe(404)
    })

    test('エラーメッセージが返ること', async () => {
      const body = await response.json()
      expect(body).toStrictEqual({ message: 'Session not found' })
    })
  })

  describe('異常系 - セッションの有効期限が切れている', () => {
    let response: Awaited<ReturnType<typeof client.index.$post>>

    beforeAll(async () => {
      // ユーザーを作成
      const user = createUser({
        email: 'expired@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|expired',
      })

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // 有効期限切れのセッションを作成
      const now = dayjs()
      const session = createSession({
        user,
        expiresAt: now.subtract(1, 'hour'), // 有効期限切れ
        idpSessionId: 'idp-session-expired',
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

      // ログアウトリクエストを送信
      response = await client.index.$post(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
    })

    test('404が返ること', () => {
      expect(response.status).toBe(404)
    })

    test('エラーメッセージが返ること', async () => {
      const body = await response.json()
      expect(body).toStrictEqual({ message: 'Session not found' })
    })
  })
})
