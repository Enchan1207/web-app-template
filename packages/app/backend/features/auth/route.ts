import { Hono } from 'hono'

import callbackRoute from './callback/route'
import loginRoute from './login/route'
import logoutRoute from './logout/route'

const app = new Hono<{ Bindings: Env }>()
  .route('/login', loginRoute)
  .route('/logout', logoutRoute)
  .route('/callback', callbackRoute)

export default app
