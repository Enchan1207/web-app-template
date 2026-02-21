import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { ulid } from 'ulid'

export type AuthStateKey = Brand<string, 'auth_state_key'>

export type AuthState = {
  key: AuthStateKey
  state: string
  nonce: string
  codeVerifier: string
  returnTo: string
  expiresAt: Dayjs
}

const normalizeReturnTo = (raw: string): Result.Result<string, Error> => {
  // 空文字列または前後に空白がある場合は拒否
  if (raw.length === 0 || raw !== raw.trim()) {
    return Result.fail(new Error('Invalid returnTo path'))
  }

  // 絶対パスであることを確認（`/` で始まり、`//` で始まらない）
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return Result.fail(new Error('Invalid returnTo path'))
  }

  // 危険な文字を拒否（スキーム対策、バックスラッシュ対策）
  if (raw.includes(':') || raw.includes('\\')) {
    return Result.fail(new Error('Invalid returnTo path'))
  }

  // 許可された文字のみかチェック（英数字、/, -, _, ?, =, &, #, .）
  const allowedPattern = /^\/[a-zA-Z0-9/_\-?=&#.]*$/
  if (!allowedPattern.test(raw)) {
    return Result.fail(new Error('Invalid returnTo path'))
  }

  return Result.succeed(raw)
}

export const createAuthState = (props: Omit<AuthState, 'key'>): AuthState => {
  const key = ulid() as AuthStateKey
  const returnTo = Result.unwrap(normalizeReturnTo(props.returnTo), '/')

  return {
    key,
    state: props.state,
    nonce: props.nonce,
    codeVerifier: props.codeVerifier,
    returnTo,
    expiresAt: props.expiresAt,
  }
}
