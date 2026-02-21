import { dbMiddleware } from '@backend/middlewares/db'
import { Hono } from 'hono'

import { sessionMiddleware } from '../session/middleware'
import { findUser } from './repository'

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .use(dbMiddleware)
  .get('/me', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const user = await findUser(c.get('db'))(session.userId)
    if (user === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    return c.json({
      id: user.id,
      email: user.email,
    })
  })

export default app
