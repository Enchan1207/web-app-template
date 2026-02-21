import { Result } from '@praha/byethrow'
import * as oidc_client from 'openid-client'

import { OAuthFlowException } from './exception'
import type { IdPUserInfo } from './types'

export const exchangeCodeForUserInfo =
  (config: oidc_client.Configuration) =>
  (props: {
    requestUri: URL
    codeVerifier: string
    state: string
    nonce: string
  }): Result.ResultAsync<IdPUserInfo, OAuthFlowException> =>
    Result.try({
      try: async () => {
        const tokens = await oidc_client.authorizationCodeGrant(
          config,
          props.requestUri,
          {
            pkceCodeVerifier: props.codeVerifier,
            expectedState: props.state,
            expectedNonce: props.nonce,
            idTokenExpected: true,
          },
        )

        const claims = tokens.claims()
        if (!claims) {
          throw new Error('ID token is missing in the response')
        }

        const email = claims['email'] as string | undefined
        if (!email) {
          throw new Error('Email claim is missing in ID token')
        }

        const sid = claims['sid'] as string | undefined
        if (!sid) {
          throw new Error('sid claim is missing in ID token')
        }

        return {
          iss: claims.iss,
          sub: claims.sub,
          email,
          sid,
        }
      },
      catch: (error) =>
        new OAuthFlowException(
          `Failed to exchange code for user info: ${error instanceof Error ? error.message : String(error)}`,
        ),
    })
