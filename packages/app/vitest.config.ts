import {
  defineWorkersConfig,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers/config'
import path from 'path'

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations('./drizzle')

  return {
    exclude: ['**/node_modules'],
    test: {
      poolOptions: {
        workers: {
          // NOTE: workerdが複数存在する場合、VSCodeのTestsタブからテストを実行できなくなる。 vitest 4系のpluginで改善される予定とのこと。
          // NOTE: ref: https://github.com/cloudflare/workers-sdk/issues/5942
          singleWorker: true,
          wrangler: {
            configPath: './wrangler.jsonc',
            environment: 'development',
          },
          miniflare: {
            d1Databases: ['D1'],
            bindings: {
              TEST_MIGRATIONS: migrations,
              AUTH0_ISSUER_URL: 'https://issuer.example.com',
              APP_ORIGIN: 'http://localhost:5173',
              AUTH0_APP_CLIENT_ID: 'app_client_id',
              AUTH0_APP_CLIENT_SECRET: 'app_client_secret',
              SESSION_SECRET: 'session_secret',
            },
          },
        },
      },
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@frontend': path.resolve(__dirname, './frontend'),
        '@backend': path.resolve(__dirname, './backend'),
      },
    },
  }
})
