import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'

type Variables = {
  db: DrizzleDatabase
}

export const dbMiddleware = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>((c, next) => {
  const db = drizzle(env(c).D1)
  c.set('db', db)

  return next()
})
