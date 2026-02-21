import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { usersTable } from './users'

export const sessionsTable = sqliteTable('sessions', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  issued_at: text().notNull(),
  expires_at: text().notNull(),
  idp_session_id: text().notNull(),
})
