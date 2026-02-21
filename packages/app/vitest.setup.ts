import { applyD1Migrations, env } from 'cloudflare:test'
import { beforeAll, vi } from 'vitest'

vi.resetModules()
vi.mock('openid-client', () => ({
  discovery: vi.fn(),
  randomPKCECodeVerifier: vi.fn().mockReturnValue('mock-code-verifier'),
  calculatePKCECodeChallenge: vi.fn().mockReturnValue('mock-code-challenge'),
  randomState: vi.fn().mockReturnValue('mock-state'),
  randomNonce: vi.fn().mockReturnValue('mock-nonce'),
  buildAuthorizationUrl: vi
    .fn()
    .mockReturnValue('https://app.example.com/authorize'),
  authorizationCodeGrant: vi.fn().mockResolvedValue({
    claims: () => ({
      iss: 'https://tenant.region.auth0.com/',
      sub: 'auth0|123456',
      email: 'test@example.com',
      sid: 'session-id-123',
    }),
  }),
  buildEndSessionUrl: vi.fn().mockReturnValue('https://app.example.com/logout'),
}))

// NOTE: cf. https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/#cloudflaretest-module-definition
beforeAll(async () => {
  await applyD1Migrations(env.D1, env.TEST_MIGRATIONS)
})
