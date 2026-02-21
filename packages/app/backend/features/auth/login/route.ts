import { createAuthState } from '@backend/domains/auth-state'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { setSecureCookie } from '@backend/lib/cookie'
import dayjs from '@backend/lib/date'
import { dbMiddleware } from '@backend/middlewares/db'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import z from 'zod'

import { authConfigMiddleware } from '../middleware'
import { buildAuthorizationUrl, createAuthContext } from './infra'
import { registerAuthState } from './repository'

const app = new Hono<{ Bindings: Env }>()
  .use(dbMiddleware)
  .use(authConfigMiddleware)
  .use(sessionMiddleware)
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        return_to: z.string().min(1),
      }),
    ),
    async (c) => {
      // ログイン済みなら落とす
      if (c.get('session') !== undefined) {
        return c.json({ message: 'Bad Request' }, 400)
      }

      const body = c.req.valid('json')

      const { state, nonce, codeChallenge, codeVerifier } =
        await createAuthContext()

      const now = dayjs()
      const aushStateAgeSeconds = 600

      const authState = createAuthState({
        state,
        nonce,
        codeVerifier,
        returnTo: body.return_to,
        expiresAt: now.add(aushStateAgeSeconds, 'second'),
      })

      const authorizationUrl = buildAuthorizationUrl(c.get('authConfig'))({
        redirectUri: `${env(c).APP_ORIGIN}/api/auth/callback`,
        codeChallenge,
        state,
        nonce,
      })

      await registerAuthState(c.get('db'))(authState)

      setSecureCookie(c, {
        name: 'auth-state-key',
        value: authState.key,
        now,
        maxAge: aushStateAgeSeconds,
      })

      return c.json({
        redirect_to: authorizationUrl.toString(),
      })
    },
  )

export default app
