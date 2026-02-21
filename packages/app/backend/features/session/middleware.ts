import type { SessionId } from '@backend/domains/session'
import type { UserId } from '@backend/domains/user'
import { getSecureCookie, setSecureCookie } from '@backend/lib/cookie'
import dayjs from '@backend/lib/date'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { dbMiddleware } from '@backend/middlewares/db'
import { findValidSession } from '@backend/repositories/session'
import { Result } from '@praha/byethrow'
import type { MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { every } from 'hono/combine'
import { createMiddleware } from 'hono/factory'

import { parseSessionJwt, signSessionJwt } from './jwt'

type SessionData = {
  id: SessionId
  userId: UserId
}

type Variables = {
  session: SessionData | undefined
  db: DrizzleDatabase
}

const sessionResolver = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>(async (c, next) => {
  // CookieからJWTを取り出してパース
  const sessionCookie = getSecureCookie(c, 'session')
  if (sessionCookie === undefined) {
    c.set('session', undefined)
    return next()
  }

  const now = dayjs()
  const jwtSecret = env(c).SESSION_SECRET

  const result = await parseSessionJwt(jwtSecret)(sessionCookie)
  if (Result.isFailure(result)) {
    c.set('session', undefined)
    return next()
  }

  const sessionJwt = result.value
  if (sessionJwt.expiresAt.isAfter(now)) {
    c.set('session', {
      id: sessionJwt.sessionId,
      userId: sessionJwt.userId,
    })
    return next()
  }

  // JWTの期限が切れている場合はセッションテーブルを再度ルックアップ
  const session = await findValidSession(c.get('db'))({
    id: sessionJwt.sessionId,
    userId: sessionJwt.userId,
  })
  if (session === undefined) {
    c.set('session', undefined)
    return next()
  }

  c.set('session', {
    id: sessionJwt.sessionId,
    userId: sessionJwt.userId,
  })
  await next()

  // ルート処理後にJWT再発行
  const newJwt = await signSessionJwt(jwtSecret)({
    sessionId: sessionJwt.sessionId,
    userId: sessionJwt.userId,
    now,
    expiresIn: SESSION_JWT_AGE,
  })

  setSecureCookie(c, {
    name: 'session',
    value: newJwt,
    now,
    maxAge: SESSION_COOKIE_AGE,
  })

  return
})

export const sessionMiddleware: MiddlewareHandler<{
  Bindings: Env
  Variables: Variables
}> = every(dbMiddleware, sessionResolver)
