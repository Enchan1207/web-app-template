import authRoute from '@backend/features/auth/route'
import userRoute from '@backend/features/user/route'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

const app = new Hono<{ Bindings: Env }>()
  .use(logger())
  .use(csrf())
  .basePath('/api')
  .route('/auth', authRoute)
  .route('/users', userRoute)

export default app
export type AppType = typeof app
