import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'

import { signSessionJwt } from './jwt'
import { sessionMiddleware } from './middleware'

/**
 * テスト用のHonoアプリ
 * sessionMiddlewareを適用し、ハンドラからセッション情報を返す
 */
const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/test', (c) => c.json({ session: c.get('session') ?? null }))

type SessionResponse = {
  session: { id: string; userId: string } | null
}

describe('sessionMiddleware', () => {
  const client = testClient(app, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('正常系 - Cookieなし', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse

    beforeAll(async () => {
      response = await client.test.$get()
      body = await response.json()
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionがnullであること', () => {
      expect(body.session).toBeNull()
    })
  })

  describe('正常系 - 有効なJWT（期限内）', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse
    let userId: string
    let sessionId: string

    beforeAll(async () => {
      const user = createUser({
        email: 'valid-jwt@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|valid-jwt',
      })
      userId = user.id

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      const now = dayjs()
      const session = createSession({
        user,
        expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
        idpSessionId: 'idp-session-valid',
      })
      sessionId = session.id

      await db.insert(sessionsTable).values({
        id: session.id,
        user_id: session.userId,
        issued_at: session.issuedAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        idp_session_id: session.idpSessionId,
      })

      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: session.id,
        userId: user.id,
        now,
        expiresIn: SESSION_JWT_AGE,
      })

      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      body = await response.json()
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionにセッションIDがセットされていること', () => {
      expect(body.session?.id).toBe(sessionId)
    })

    test('sessionにユーザIDがセットされていること', () => {
      expect(body.session?.userId).toBe(userId)
    })

    test('Set-Cookieヘッダが付与されないこと', () => {
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeNull()
    })
  })

  describe('異常系 - 不正なJWT', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse

    beforeAll(async () => {
      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: '__Host-Http-session=invalid-token-value',
          },
        },
      )
      body = await response.json()
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionがnullであること', () => {
      expect(body.session).toBeNull()
    })
  })

  describe('異常系 - 署名が異なるJWT', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse

    beforeAll(async () => {
      const user = createUser({
        email: 'wrong-secret@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|wrong-secret',
      })

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      const now = dayjs()
      const session = createSession({
        user,
        expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
        idpSessionId: 'idp-session-wrong-secret',
      })

      await db.insert(sessionsTable).values({
        id: session.id,
        user_id: session.userId,
        issued_at: session.issuedAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        idp_session_id: session.idpSessionId,
      })

      // 別のシークレットでJWTを署名
      const sessionJwt = await signSessionJwt('wrong_secret')({
        sessionId: session.id,
        userId: user.id,
        now,
        expiresIn: SESSION_JWT_AGE,
      })

      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      body = await response.json()
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionがnullであること', () => {
      expect(body.session).toBeNull()
    })
  })

  describe('正常系 - JWTのexp超過＋DBに有効セッションあり', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse
    let userId: string
    let sessionId: string

    beforeAll(async () => {
      // JWT発行時の時刻を基準にする
      const jwtIssuedAt = dayjs('2022-11-01T17:00:00Z')
      vi.setSystemTime(jwtIssuedAt.toDate())

      const user = createUser({
        email: 'jwt-exp-db-valid@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|jwt-exp-db-valid',
      })
      userId = user.id

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // DBセッションはCookie寿命に合わせて十分長い期限
      const session = createSession({
        user,
        expiresAt: jwtIssuedAt.add(SESSION_COOKIE_AGE, 'second'),
        idpSessionId: 'idp-session-jwt-exp-db-valid',
      })
      sessionId = session.id

      await db.insert(sessionsTable).values({
        id: session.id,
        user_id: session.userId,
        issued_at: session.issuedAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        idp_session_id: session.idpSessionId,
      })

      // JWT発行（この時点ではJWTは有効）
      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: session.id,
        userId: user.id,
        now: jwtIssuedAt,
        expiresIn: SESSION_JWT_AGE,
      })

      // 時刻を進めてJWTのexpを超過させる（SESSION_JWT_AGE + 1秒）
      // ただしDBセッションはまだ有効
      const afterJwtExpiry = jwtIssuedAt.add(SESSION_JWT_AGE + 1, 'second')
      vi.setSystemTime(afterJwtExpiry.toDate())

      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      body = await response.json()
    })

    afterAll(() => {
      vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionにセッションIDがセットされていること', () => {
      expect(body.session?.id).toBe(sessionId)
    })

    test('sessionにユーザIDがセットされていること', () => {
      expect(body.session?.userId).toBe(userId)
    })

    test('Set-Cookieヘッダに新しいJWTが付与されること', () => {
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeTruthy()
      expect(setCookieHeader).toContain('__Host-Http-session=')
    })

    test('Set-CookieヘッダにMax-Ageが設定されていること', () => {
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain(`Max-Age=${SESSION_COOKIE_AGE}`)
    })
  })

  describe('異常系 - JWTのexp超過＋DBにセッションなし', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse

    beforeAll(async () => {
      const jwtIssuedAt = dayjs('2022-11-01T16:00:00Z')
      vi.setSystemTime(jwtIssuedAt.toDate())

      const user = createUser({
        email: 'jwt-exp-no-db@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|jwt-exp-no-db',
      })

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // DBにはセッションを挿入しない
      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: 'fake-session-id-00000000000' as never,
        userId: user.id,
        now: jwtIssuedAt,
        expiresIn: SESSION_JWT_AGE,
      })

      // 時刻を進めてJWTのexpを超過させる
      const afterExpiry = jwtIssuedAt.add(SESSION_JWT_AGE + 1, 'second')
      vi.setSystemTime(afterExpiry.toDate())

      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      body = await response.json()
    })

    afterAll(() => {
      vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionがnullであること', () => {
      expect(body.session).toBeNull()
    })
  })

  describe('異常系 - JWTのexp超過＋DBセッションも期限切れ', () => {
    let response: Awaited<ReturnType<typeof client.test.$get>>
    let body: SessionResponse

    beforeAll(async () => {
      const jwtIssuedAt = dayjs('2022-11-01T15:00:00Z')
      vi.setSystemTime(jwtIssuedAt.toDate())

      const user = createUser({
        email: 'jwt-exp-db-expired@example.com',
        idpIssuer: 'https://tenant.region.auth0.com/',
        idpSubject: 'auth0|jwt-exp-db-expired',
      })

      await db.insert(usersTable).values({
        id: user.id,
        email: user.email,
        idp_iss: user.idpIssuer,
        idp_sub: user.idpSubject,
      })

      // DBセッションは30分後に期限切れ
      const session = createSession({
        user,
        expiresAt: jwtIssuedAt.add(30, 'minute'),
        idpSessionId: 'idp-session-jwt-exp-db-expired',
      })

      await db.insert(sessionsTable).values({
        id: session.id,
        user_id: session.userId,
        issued_at: session.issuedAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        idp_session_id: session.idpSessionId,
      })

      const sessionJwt = await signSessionJwt(env.SESSION_SECRET)({
        sessionId: session.id,
        userId: user.id,
        now: jwtIssuedAt,
        expiresIn: SESSION_JWT_AGE,
      })

      // 時刻をJWTとDBセッション両方の期限を超える位置まで進める
      const afterAllExpiry = jwtIssuedAt.add(2, 'hour')
      vi.setSystemTime(afterAllExpiry.toDate())

      response = await client.test.$get(
        {},
        {
          headers: {
            Cookie: `__Host-Http-session=${sessionJwt}`,
          },
        },
      )
      body = await response.json()
    })

    afterAll(() => {
      vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
    })

    test('200が返ること', () => {
      expect(response.status).toBe(200)
    })

    test('sessionがnullであること', () => {
      expect(body.session).toBeNull()
    })
  })
})
