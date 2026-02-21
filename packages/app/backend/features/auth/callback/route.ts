import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { deleteSecureCookie, setSecureCookie } from '@backend/lib/cookie'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { dbMiddleware } from '@backend/middlewares/db'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { match } from 'ts-pattern'

import { authConfigMiddleware } from '../middleware'
import { exchangeCodeForUserInfo } from './infra'
import {
  deleteAuthState,
  findAuthState,
  findUserByClaims,
  issueSession,
  registerUser,
} from './repository'
import type { HandleLoginCallbackWorkflowCommand } from './workflow'
import { buildHandleLoginCallbackWorkflow } from './workflow'

const app = new Hono<{ Bindings: Env }>()
  .use(dbMiddleware)
  .use(authConfigMiddleware)
  .use(sessionMiddleware)
  .get('/', async (c) => {
    // ログイン済みなら何もせずに戻る
    if (c.get('session') !== undefined) {
      return c.redirect('/', 302)
    }

    const authStateKey = deleteSecureCookie(c, 'auth-state-key')
    const requestUri = new URL(c.req.url)

    const command: HandleLoginCallbackWorkflowCommand = {
      input: { requestUri },
      context: { authStateKey },
    }

    const db = c.get('db')
    const config = c.get('authConfig')

    const workflow = buildHandleLoginCallbackWorkflow({
      findAuthState: findAuthState(db),
      exchangeCodeForUserInfo: exchangeCodeForUserInfo(config),
      findUserByClaims: findUserByClaims(db),
    })

    const result = await workflow(command)

    if (Result.isFailure(result)) {
      console.error('Authentication callback failed', result.error)
      return c.redirect('/', 302)
    }

    const event = result.value

    // ユーザを解決
    const user = await match(event)
      .with({ type: 'existing' }, (event) => event.user)
      .with({ type: 'create_new' }, (event) => {
        const user = createUser(event.user)
        return registerUser(db)(user)
      })
      .exhaustive()

    await deleteAuthState(db)(event.authState.key)

    // セッション初期化
    // セッション自体の期間 > JWTの期間 とし、JWTの期間ごとにセッションテーブルをルックアップする
    const now = dayjs()
    const newSession = createSession({
      user,
      expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
      idpSessionId: event.sid,
    })
    await issueSession(db)(newSession)

    const sessionJwt = await signSessionJwt(env(c).SESSION_SECRET)({
      sessionId: newSession.id,
      userId: user.id,
      now,
      expiresIn: SESSION_JWT_AGE,
    })

    setSecureCookie(c, {
      name: 'session',
      value: sessionJwt,
      now,
      maxAge: SESSION_COOKIE_AGE,
    })

    return c.redirect(event.authState.returnTo, 302)
  })

export default app
