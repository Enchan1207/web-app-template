import type { AuthState, AuthStateKey } from '@backend/domains/auth-state'
import type { Session } from '@backend/domains/session'
import type { User } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createAuthStateModel } from '@backend/repositories/auth-state'
import { createSessionModel } from '@backend/repositories/session'
import { createUserModel } from '@backend/repositories/user'
import { authStatesTable } from '@backend/schemas/auth-states'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { Result } from '@praha/byethrow'
import { and, eq, gt } from 'drizzle-orm'

import { InvalidAuthStateException } from './exception'

export const findAuthState =
  (db: DrizzleDatabase) =>
  async (
    key: AuthStateKey,
  ): Result.ResultAsync<AuthState, InvalidAuthStateException> => {
    const now = dayjs()

    const result = await db
      .select()
      .from(authStatesTable)
      .where(
        and(
          eq(authStatesTable.key, key),
          gt(authStatesTable.expires_at, now.toISOString()),
        ),
      )

    const row = result[0]

    if (!row) {
      return Result.fail(
        new InvalidAuthStateException(
          'Auth state not found or expired',
          undefined,
        ),
      )
    }

    return Result.succeed(createAuthStateModel(row))
  }

export const deleteAuthState =
  (db: DrizzleDatabase) =>
  async (key: AuthStateKey): Promise<void> => {
    await db.delete(authStatesTable).where(eq(authStatesTable.key, key))
  }

export const findUserByClaims =
  (db: DrizzleDatabase) =>
  async (props: { iss: string; sub: string }): Promise<User | undefined> => {
    const result = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.idp_iss, props.iss),
          eq(usersTable.idp_sub, props.sub),
        ),
      )

    const row = result[0]

    if (!row) {
      return undefined
    }

    return createUserModel(row)
  }

export const registerUser =
  (db: DrizzleDatabase) =>
  async (item: User): Promise<User> => {
    const result = await db
      .insert(usersTable)
      .values({
        id: item.id,
        email: item.email,
        idp_iss: item.idpIssuer,
        idp_sub: item.idpSubject,
      })
      .returning()

    const row = result[0]
    if (!row) {
      throw new Error('Failed to register user')
    }

    return createUserModel(row)
  }

export const issueSession =
  (db: DrizzleDatabase) =>
  async (item: Session): Promise<Session> => {
    const result = await db
      .insert(sessionsTable)
      .values({
        id: item.id,
        user_id: item.userId,
        issued_at: item.issuedAt.toISOString(),
        expires_at: item.expiresAt.toISOString(),
        idp_session_id: item.idpSessionId,
      })
      .returning()

    const row = result[0]
    if (!row) {
      throw new Error('Failed to issue session')
    }

    return createSessionModel(row)
  }
