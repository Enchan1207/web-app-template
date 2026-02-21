// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AppType } from '@routes'
import { hc } from 'hono/client'

export const client = hc<AppType>(window.location.origin, {
  init: { credentials: 'include' },
}).api
