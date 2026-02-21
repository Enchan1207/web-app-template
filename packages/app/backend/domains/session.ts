import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { ulid } from 'ulid'

import type { User, UserId } from './user'

export type SessionId = Brand<string, 'session_id'>

export type Session = {
  id: SessionId
  userId: UserId
  issuedAt: Dayjs
  expiresAt: Dayjs
  idpSessionId: string
}

export const createSession = (props: {
  user: User
  expiresAt: Dayjs
  idpSessionId: string
}): Session => ({
  id: ulid() as SessionId,
  userId: props.user.id,
  issuedAt: dayjs(),
  expiresAt: props.expiresAt,
  idpSessionId: props.idpSessionId,
})
