import type { AuthState, AuthStateKey } from '@backend/domains/auth-state'
import dayjs from '@backend/lib/date'
import type { authStatesTable } from '@backend/schemas/auth-states'
import type { InferSelectModel } from 'drizzle-orm'

type AuthStateRecord = InferSelectModel<typeof authStatesTable>

export const createAuthStateModel = (record: AuthStateRecord): AuthState => {
  return {
    key: record.key as AuthStateKey,
    state: record.state,
    nonce: record.nonce,
    codeVerifier: record.code_verifier,
    returnTo: record.return_to,
    expiresAt: dayjs(record.expires_at),
  }
}
