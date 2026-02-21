import type { SessionId } from '@backend/domains/session'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { sessionsTable } from '@backend/schemas/sessions'
import { eq } from 'drizzle-orm'

export const expireSession =
  (db: DrizzleDatabase) =>
  async (id: SessionId): Promise<void> => {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, id))
  }
