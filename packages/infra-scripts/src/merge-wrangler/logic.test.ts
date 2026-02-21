import { beforeAll, describe, expect, test } from 'vitest'

import type { WranglerRoot } from './logic'
import { updateD1Database } from './logic'

describe('updateD1Database', () => {
  describe('正常系 - staging環境を更新', () => {
    let actual: WranglerRoot
    const original: WranglerRoot = {
      name: 'test-app',
      main: './backend/index.ts',
      env: {
        development: {
          name: 'test-app-local',
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'dev-id',
              database_name: 'test-app-local',
              migrations_dir: 'drizzle',
            },
          ],
        },
        staging: {
          name: 'test-app-stg',
          routes: [{ pattern: 'stg.example.com', custom_domain: true }],
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'old-stg-id',
              database_name: 'old-stg-name',
              migrations_dir: 'drizzle',
            },
          ],
        },
        production: {
          name: 'test-app-prod',
          routes: [{ pattern: 'example.com', custom_domain: true }],
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'prod-id',
              database_name: 'test-app-prod',
              migrations_dir: 'drizzle',
            },
          ],
        },
      },
    }

    beforeAll(() => {
      actual = updateD1Database(original, 'staging', {
        database_id: 'new-stg-id',
        database_name: 'new-stg-name',
      })
    })

    test('staging環境のdatabase_idが更新されること', () => {
      expect(actual.env.staging.d1_databases[0]?.database_id).toBe('new-stg-id')
    })

    test('staging環境のdatabase_nameが更新されること', () => {
      expect(actual.env.staging.d1_databases[0]?.database_name).toBe(
        'new-stg-name',
      )
    })

    test('staging環境のbindingが設定されること', () => {
      expect(actual.env.staging.d1_databases[0]?.binding).toBe('D1')
    })

    test('staging環境のmigrations_dirが設定されること', () => {
      expect(actual.env.staging.d1_databases[0]?.migrations_dir).toBe('drizzle')
    })

    test('staging環境の他のプロパティが保持されること', () => {
      expect(actual.env.staging['name']).toBe('test-app-stg')
      expect(actual.env.staging['routes']).toStrictEqual([
        { pattern: 'stg.example.com', custom_domain: true },
      ])
    })

    test('development環境は変更されないこと', () => {
      expect(actual.env.development).toStrictEqual(original.env.development)
    })

    test('production環境は変更されないこと', () => {
      expect(actual.env.production).toStrictEqual(original.env.production)
    })

    test('グローバル設定が保持されること', () => {
      expect(actual['name']).toBe('test-app')
      expect(actual['main']).toBe('./backend/index.ts')
    })
  })

  describe('正常系 - production環境を更新', () => {
    let actual: WranglerRoot
    const original: WranglerRoot = {
      name: 'test-app',
      env: {
        development: {
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'dev-id',
              database_name: 'dev-name',
              migrations_dir: 'drizzle',
            },
          ],
        },
        staging: {
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'stg-id',
              database_name: 'stg-name',
              migrations_dir: 'drizzle',
            },
          ],
        },
        production: {
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'old-prod-id',
              database_name: 'old-prod-name',
              migrations_dir: 'drizzle',
            },
          ],
        },
      },
    }

    beforeAll(() => {
      actual = updateD1Database(original, 'production', {
        database_id: 'new-prod-id',
        database_name: 'new-prod-name',
      })
    })

    test('production環境のdatabase_idが更新されること', () => {
      expect(actual.env.production.d1_databases[0]?.database_id).toBe(
        'new-prod-id',
      )
    })

    test('production環境のdatabase_nameが更新されること', () => {
      expect(actual.env.production.d1_databases[0]?.database_name).toBe(
        'new-prod-name',
      )
    })

    test('development環境は変更されないこと', () => {
      expect(actual.env.development).toStrictEqual(original.env.development)
    })

    test('staging環境は変更されないこと', () => {
      expect(actual.env.staging).toStrictEqual(original.env.staging)
    })
  })

  describe('正常系 - development環境を更新', () => {
    let actual: WranglerRoot
    const original: WranglerRoot = {
      env: {
        development: {
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'old-dev-id',
              database_name: 'old-dev-name',
              migrations_dir: 'drizzle',
            },
          ],
        },
        staging: {
          d1_databases: [],
        },
        production: {
          d1_databases: [],
        },
      },
    }

    beforeAll(() => {
      actual = updateD1Database(original, 'development', {
        database_id: 'new-dev-id',
        database_name: 'new-dev-name',
      })
    })

    test('development環境のdatabase_idが更新されること', () => {
      expect(actual.env.development.d1_databases[0]?.database_id).toBe(
        'new-dev-id',
      )
    })

    test('development環境のdatabase_nameが更新されること', () => {
      expect(actual.env.development.d1_databases[0]?.database_name).toBe(
        'new-dev-name',
      )
    })
  })

  describe('正常系 - 複数のデータベース定義が存在する場合', () => {
    let actual: WranglerRoot
    const original: WranglerRoot = {
      env: {
        development: {
          d1_databases: [],
        },
        staging: {
          d1_databases: [
            {
              binding: 'D1',
              database_id: 'old-id-1',
              database_name: 'old-name-1',
              migrations_dir: 'drizzle',
            },
            {
              binding: 'D2',
              database_id: 'old-id-2',
              database_name: 'old-name-2',
              migrations_dir: 'drizzle',
            },
          ],
        },
        production: {
          d1_databases: [],
        },
      },
    }

    beforeAll(() => {
      actual = updateD1Database(original, 'staging', {
        database_id: 'new-id',
        database_name: 'new-name',
      })
    })

    test('d1_databases配列が1つの要素に置き換えられること', () => {
      expect(actual.env.staging.d1_databases.length).toBe(1)
    })

    test('新しいdatabase_idが設定されること', () => {
      expect(actual.env.staging.d1_databases[0]?.database_id).toBe('new-id')
    })

    test('新しいdatabase_nameが設定されること', () => {
      expect(actual.env.staging.d1_databases[0]?.database_name).toBe('new-name')
    })
  })
})
