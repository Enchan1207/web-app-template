import type { AuthState, AuthStateKey } from '@backend/domains/auth-state'
import type { User } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import type { InvalidAuthStateException, OAuthFlowException } from './exception'
import type { IdPUserInfo } from './types'

// MARK: command

export type HandleLoginCallbackWorkflowCommand = {
  input: {
    requestUri: URL
  }
  context: {
    authStateKey: string | undefined
  }
}

// MARK: step type

type CommandValidated = {
  input: {
    requestUri: URL
  }
  context: {
    authStateKey: AuthStateKey
  }
}

type AuthStateResolved = {
  input: {
    requestUri: URL
  }
  context: {
    authState: AuthState
  }
}

type TokenExchanged = {
  input: {
    iss: string
    sub: string
    email: string
    sid: string
  }
  context: {
    authState: AuthState
  }
}

// MARK: event

type UserFound = {
  type: 'existing'
  user: User
  authState: AuthState
  sid: string
}

type UserProvisioned = {
  type: 'create_new'
  user: {
    email: string
    idpIssuer: string
    idpSubject: string
  }
  authState: AuthState
  sid: string
}

type LoggedinEvent = UserFound | UserProvisioned

// MARK: exceptions

class ValidationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'ValidationException'
  }
}

// MARK: effects

type Effects = {
  findAuthState: (
    key: AuthStateKey,
  ) => Result.ResultAsync<AuthState, InvalidAuthStateException>

  exchangeCodeForUserInfo: (props: {
    requestUri: URL
    codeVerifier: string
    state: string
    nonce: string
  }) => Result.ResultAsync<IdPUserInfo, OAuthFlowException>

  findUserByClaims: (props: {
    iss: string
    sub: string
  }) => Promise<User | undefined>
}

// MARK: workflow type

type Workflow = (
  command: HandleLoginCallbackWorkflowCommand,
) => Result.ResultAsync<LoggedinEvent, ValidationException | OAuthFlowException>

// MARK: steps

const validateCommand = (
  command: HandleLoginCallbackWorkflowCommand,
): Result.Result<CommandValidated, ValidationException> => {
  if (!command.context.authStateKey) {
    return Result.fail(
      new ValidationException('authStateKey is required in context'),
    )
  }

  return Result.succeed({
    input: command.input,
    context: {
      authStateKey: command.context.authStateKey as AuthStateKey,
    },
  })
}

const resolveAuthState =
  (effects: Effects) =>
  async (
    command: CommandValidated,
  ): Result.ResultAsync<AuthStateResolved, InvalidAuthStateException> => {
    const authStateResult = await effects.findAuthState(
      command.context.authStateKey,
    )

    if (Result.isFailure(authStateResult)) {
      return Result.fail(authStateResult.error)
    }

    return Result.succeed({
      input: command.input,
      context: {
        authState: authStateResult.value,
      },
    })
  }

const exchangeCodeForToken =
  (effects: Effects) =>
  async (
    command: AuthStateResolved,
  ): Result.ResultAsync<TokenExchanged, OAuthFlowException> => {
    const userInfoResult = await effects.exchangeCodeForUserInfo({
      requestUri: command.input.requestUri,
      codeVerifier: command.context.authState.codeVerifier,
      state: command.context.authState.state,
      nonce: command.context.authState.nonce,
    })

    if (Result.isFailure(userInfoResult)) {
      return Result.fail(userInfoResult.error)
    }

    const userInfo = userInfoResult.value

    return Result.succeed({
      input: {
        iss: userInfo.iss,
        sub: userInfo.sub,
        email: userInfo.email,
        sid: userInfo.sid,
      },
      context: {
        authState: command.context.authState,
      },
    })
  }

const findUserByClaims =
  (effects: Effects) =>
  async (command: TokenExchanged): Result.ResultAsync<LoggedinEvent, never> => {
    const user = await effects.findUserByClaims({
      iss: command.input.iss,
      sub: command.input.sub,
    })

    if (user) {
      return Result.succeed({
        type: 'existing',
        user,
        authState: command.context.authState,
        sid: command.input.sid,
      })
    }

    return Result.succeed({
      type: 'create_new',
      user: {
        email: command.input.email,
        idpIssuer: command.input.iss,
        idpSubject: command.input.sub,
      },
      authState: command.context.authState,
      sid: command.input.sid,
    })
  }

// MARK: definition

export const buildHandleLoginCallbackWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      validateCommand(command),
      Result.andThen(resolveAuthState(effects)),
      Result.andThen(exchangeCodeForToken(effects)),
      Result.andThen(findUserByClaims(effects)),
    )
