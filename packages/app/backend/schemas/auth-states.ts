import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const authStatesTable = sqliteTable('auth_states', {
  key: text().notNull().primaryKey(),
  state: text().notNull(),
  nonce: text().notNull(),
  code_verifier: text().notNull(),
  return_to: text().notNull(),
  expires_at: text().notNull(),
})
