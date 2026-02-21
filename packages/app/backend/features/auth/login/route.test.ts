import dayjs from '@backend/lib/date'
import { authStatesTable } from '@backend/schemas/auth-states'
import { env } from 'cloudflare:test'
import type { InferSelectModel } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'

import loginRoute from './route'

describe('POST /api/auth/login', () => {
  const client = testClient(loginRoute, env)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('normal', () => {
    let actual: Awaited<ReturnType<typeof client.index.$post>>

    beforeAll(async () => {
      actual = await client.index.$post({
        json: { return_to: '/dashboard' },
      })
    })

    test('return 200', () => {
      expect(actual.status).toBe(200)
    })

    test('auth state cookie is set', () => {
      const setCookieValue = actual.headers.get('Set-Cookie')
      expect(
        setCookieValue?.startsWith('__Host-Http-auth-state-key='),
      ).toBeTruthy()
    })

    describe('check registered auth state', () => {
      let stored: InferSelectModel<typeof authStatesTable>[]

      beforeAll(async () => {
        const db = drizzle(env.D1)
        stored = await db.select().from(authStatesTable)
      })

      test('1 rows registered', () => {
        expect(stored).toHaveLength(1)
      })

      test('return_to is saved', () => {
        expect(stored[0]?.return_to).toBe('/dashboard')
      })

      test('expires_at is 10 minutes after from now', () => {
        expect(stored[0]?.expires_at).toBe(
          dayjs().add(10, 'minute').toISOString(),
        )
      })
    })
  })

  // NOTE: return_toの無効値に関するテストは domains/auth-state.test.ts を参照のこと
  describe.each([
    {
      name: 'abnormal - no return_to',
      body: {},
    },
    {
      name: 'abnormal - invalid return_to - blank',
      body: { return_to: '' },
    },
    {
      name: 'abnormal - invalid return_to - not string',
      body: { return_to: 123 },
    },
  ])('$name', ({ body }) => {
    let actual: Awaited<ReturnType<typeof client.index.$post>>

    beforeAll(async () => {
      actual = await client.index.$post({
        // @ts-expect-error 無効値検証のため、任意値の挿入を許容
        json: body,
      })
    })

    test('return 400', () => {
      expect(actual.status).toBe(400)
    })

    test('auth state is not registered', async () => {
      const db = drizzle(env.D1)
      const stored = await db.select().from(authStatesTable)
      expect(stored).toHaveLength(0)
    })
  })
})
