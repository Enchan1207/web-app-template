import type { Mode } from '../mode'

export type D1DatabaseDefinition = {
  binding: string
  database_id: string
  database_name: string
  migrations_dir: string
}

export type WranglerEnvConfig = {
  d1_databases: D1DatabaseDefinition[]
  [key: string]: unknown
}

export type WranglerRoot = {
  env: Record<Mode, WranglerEnvConfig>
  [key: string]: unknown
}

export type UpdateD1DatabaseInput = {
  database_id: string
  database_name: string
}

/**
 * Wrangler設定のD1データベース定義を更新する
 *
 * @param wranglerConfig Wrangler設定オブジェクト
 * @param mode 更新対象の環境
 * @param input データベースID、名前
 * @returns 更新されたWrangler設定オブジェクト
 *
 * @note 指定された環境のd1_databases配列を完全に置き換えます
 */
export const updateD1Database = (
  wranglerConfig: WranglerRoot,
  mode: Mode,
  input: UpdateD1DatabaseInput,
): WranglerRoot => {
  return {
    ...wranglerConfig,
    env: {
      ...wranglerConfig.env,
      [mode]: {
        ...wranglerConfig.env[mode],
        d1_databases: [
          {
            binding: 'D1',
            database_id: input.database_id,
            database_name: input.database_name,
            migrations_dir: 'drizzle',
          },
        ],
      },
    },
  }
}
