import { sessionMiddleware } from '@backend/features/session/middleware'
import { deleteSecureCookie } from '@backend/lib/cookie'
import { dbMiddleware } from '@backend/middlewares/db'
import { findValidSession } from '@backend/repositories/session'
import { Hono } from 'hono'
import { env } from 'hono/adapter'

import { authConfigMiddleware } from '../middleware'
import { buildLogoutUrl } from './infra'
import { expireSession } from './repository'

const app = new Hono<{ Bindings: Env }>()
  .use(dbMiddleware)
  .use(authConfigMiddleware)
  .use(sessionMiddleware)
  .post('/', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    // セッションテーブルからsidを取得
    const fullSession = await findValidSession(c.get('db'))({
      id: session.id,
      userId: session.userId,
    })

    if (fullSession === undefined) {
      return c.json({ message: 'Session not found' }, 404)
    }

    await expireSession(c.get('db'))(session.id)

    deleteSecureCookie(c, 'session')

    const logoutUrl = buildLogoutUrl(c.get('authConfig'))({
      redirectTo: env(c).APP_ORIGIN,
      idPSessionId: fullSession.idpSessionId,
    })
    return c.redirect(logoutUrl, 302)
  })

export default app
