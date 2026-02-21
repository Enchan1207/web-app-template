import type { AuthState } from '@backend/domains/auth-state'

export class OAuthFlowException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'OAuthFlowException'
  }
}

export class InvalidAuthStateException extends Error {
  authState: AuthState | undefined

  constructor(message: string, authState: AuthState | undefined) {
    super(message)
    this.name = 'InvalidAuthStateException'
    this.authState = authState
  }
}
