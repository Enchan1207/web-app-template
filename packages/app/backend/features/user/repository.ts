import type { User, UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createUserModel } from '@backend/repositories/user'
import { usersTable } from '@backend/schemas/users'
import { eq } from 'drizzle-orm'

export const findUser =
  (db: DrizzleDatabase) =>
  async (id: UserId): Promise<User | undefined> => {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))

    const row = result[0]

    if (!row) {
      return undefined
    }

    return createUserModel(row)
  }
