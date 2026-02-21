import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const usersTable = sqliteTable(
  'users',
  {
    id: text().notNull().primaryKey(),
    email: text().notNull(),
    idp_iss: text().notNull(),
    idp_sub: text().notNull(),
  },
  (table) => [unique().on(table.idp_iss, table.idp_sub)],
)
