import z from 'zod'

export const envUpdatesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
)

export type EnvUpdates = z.infer<typeof envUpdatesSchema>

/**
 * 環境変数の行配列と更新内容をマージする
 *
 * @param lines 既存の環境変数ファイルの行配列
 * @param updates 更新する環境変数のキーと値のペア
 * @returns マージ後の行配列
 *
 * @note 既存のキーは更新され、存在しないキーは末尾に追加されます
 */
export const mergeEnvLines = (
  lines: readonly string[],
  updates: EnvUpdates,
): string[] => {
  const keys = Object.keys(updates)
  const appliedKeys = new Set<string>()

  // 既存の行を更新
  const updatedLines = lines.map((line) => {
    const matchedKey = keys.find((key) => line.startsWith(`${key}=`))

    if (matchedKey === undefined) {
      return line
    }

    appliedKeys.add(matchedKey)
    return `${matchedKey}=${String(updates[matchedKey])}`
  })

  // 新規キーを末尾に追加
  const newKeys = keys.filter((key) => !appliedKeys.has(key))
  const newLines = newKeys.map((key) => `${key}=${String(updates[key])}`)

  return [...updatedLines, ...newLines]
}
