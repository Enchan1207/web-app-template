import * as oidc_client from 'openid-client'

import type { AuthContext } from './types'

export const createAuthContext = async (): Promise<AuthContext> => {
  const codeVerifier = oidc_client.randomPKCECodeVerifier()
  const codeChallenge =
    await oidc_client.calculatePKCECodeChallenge(codeVerifier)

  const state = oidc_client.randomState()
  const nonce = oidc_client.randomNonce()

  return { state, nonce, codeVerifier, codeChallenge }
}

export const buildAuthorizationUrl =
  (config: oidc_client.Configuration) =>
  (props: {
    redirectUri: string
    codeChallenge: string
    state: string
    nonce: string
  }) =>
    oidc_client.buildAuthorizationUrl(config, {
      redirect_uri: props.redirectUri,
      scope: 'email openid profile',
      code_challenge: props.codeChallenge,
      code_challenge_method: 'S256',
      state: props.state,
      nonce: props.nonce,
    })
