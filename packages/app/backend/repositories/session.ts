import type { Session, SessionId } from '@backend/domains/session'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { sessionsTable } from '@backend/schemas/sessions'
import type { InferSelectModel } from 'drizzle-orm'
import { and, eq, gt } from 'drizzle-orm'

type SessionRecord = InferSelectModel<typeof sessionsTable>

export const createSessionModel = (record: SessionRecord): Session => {
  return {
    id: record.id as SessionId,
    userId: record.user_id as Session['userId'],
    issuedAt: dayjs(record.issued_at),
    expiresAt: dayjs(record.expires_at),
    idpSessionId: record.idp_session_id,
  }
}

export const findValidSession =
  (db: DrizzleDatabase) =>
  async (props: {
    id: SessionId
    userId: UserId
  }): Promise<Session | undefined> => {
    const now = dayjs()

    const result = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, props.id),
          eq(sessionsTable.user_id, props.userId),
          gt(sessionsTable.expires_at, now.toISOString()),
        ),
      )

    const row = result[0]

    if (!row) {
      return undefined
    }

    return createSessionModel(row)
  }
