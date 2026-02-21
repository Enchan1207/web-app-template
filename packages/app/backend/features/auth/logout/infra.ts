import * as oidc_client from 'openid-client'

export const buildLogoutUrl =
  (config: oidc_client.Configuration) =>
  (props: { redirectTo: string; idPSessionId: string }) =>
    oidc_client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: props.redirectTo,
      logout_hint: props.idPSessionId,
    })
