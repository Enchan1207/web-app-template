import type { AuthState } from '@backend/domains/auth-state'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { authStatesTable } from '@backend/schemas/auth-states'

export const registerAuthState =
  (db: DrizzleDatabase) =>
  async (authState: AuthState): Promise<AuthState> => {
    await db.insert(authStatesTable).values({
      key: authState.key,
      state: authState.state,
      nonce: authState.nonce,
      code_verifier: authState.codeVerifier,
      return_to: authState.returnTo,
      expires_at: authState.expiresAt.toISOString(),
    })

    return authState
  }
