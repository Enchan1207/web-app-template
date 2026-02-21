import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
import * as oidc_client from 'openid-client'

type Variables = {
  authConfig: oidc_client.Configuration
}

// NOTE: ミドルウェアが複数回useされてもよいよう、リクエスト内でキャッシュしておく
let config: oidc_client.Configuration | undefined

export const authConfigMiddleware = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>(async (c, next) => {
  if (config === undefined) {
    config = await oidc_client.discovery(
      new URL(env(c).AUTH0_ISSUER_URL),
      env(c).AUTH0_APP_CLIENT_ID,
      env(c).AUTH0_APP_CLIENT_SECRET,
    )
  }

  c.set('authConfig', config)

  return next()
})
