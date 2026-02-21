import type { User, UserId } from '@backend/domains/user'
import type { usersTable } from '@backend/schemas/users'
import type { InferSelectModel } from 'drizzle-orm'

type UserRecord = InferSelectModel<typeof usersTable>

export const createUserModel = (record: UserRecord): User => {
  return {
    id: record.id as UserId,
    email: record.email,
    idpIssuer: record.idp_iss,
    idpSubject: record.idp_sub,
  }
}
