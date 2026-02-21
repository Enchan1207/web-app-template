// Worker env
interface Env {
  readonly D1: D1Database

  /** アプリケーションオリジン */
  readonly APP_ORIGIN: string

  /** Auth0 issuer URL */
  readonly AUTH0_ISSUER_URL: string

  /** Auth0 クライアントID */
  readonly AUTH0_APP_CLIENT_ID: string

  /** Auth0 クライアントシークレット */
  readonly AUTH0_APP_CLIENT_SECRET: string

  /** アプリセッションシークレット */
  readonly SESSION_SECRET: string
}

declare module 'cloudflare:test' {
  // ProvidedEnv controls the type of `import("cloudflare:test").env`
  interface ProvidedEnv extends Env {
    readonly TEST_MIGRATIONS: D1Migration[]
  }
}
