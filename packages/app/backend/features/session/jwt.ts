import type { SessionId } from '@backend/domains/session'
import type { UserId } from '@backend/domains/user'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { sign as jwtSign, verify as jwtVerify } from 'hono/jwt'
import z from 'zod'

export type SessionJwt = {
  sessionId: SessionId
  userId: UserId
  issuedAt: Dayjs
  expiresAt: Dayjs
}

const SessionJwtPayloadSchema = z.object({
  sid: z.ulid(),
  uid: z.ulid(),
  iat: z.number(),
  exp: z.number(),
})

type SessionJwtPayloadSchema = z.infer<typeof SessionJwtPayloadSchema>

export const signSessionJwt =
  (secret: string) =>
  async (props: {
    sessionId: SessionId
    userId: UserId
    now: Dayjs
    expiresIn: number // seconds
  }): Promise<string> => {
    const payload: SessionJwtPayloadSchema = {
      sid: props.sessionId,
      uid: props.userId,
      iat: props.now.unix(),
      exp: props.now.add(props.expiresIn, 'second').unix(),
    }

    return jwtSign(payload, secret, 'HS256')
  }

export const parseSessionJwt =
  (secret: string) =>
  async (token: string): Result.ResultAsync<SessionJwt, Error> =>
    Result.pipe(
      Result.try({
        // expチェックはミドルウェア側で行うためスキップし、署名検証のみ実施
        try: () => jwtVerify(token, secret, { alg: 'HS256', exp: false }),
        catch: (e) =>
          e instanceof Error
            ? e
            : new Error('Unknown error occurred during verify session token'),
      }),
      Result.andThen(Result.parse(SessionJwtPayloadSchema)),
      Result.map(
        (jwt): SessionJwt => ({
          sessionId: jwt.sid as SessionId,
          userId: jwt.uid as UserId,
          issuedAt: dayjs.unix(jwt.iat),
          expiresAt: dayjs.unix(jwt.exp),
        }),
      ),
      Result.mapError((e) =>
        e instanceof Error ? e : new Error('Validation error', { cause: e }),
      ),
    )
