import { Result } from '@praha/byethrow'
import z from 'zod'

const ModeSchema = z.enum(['development', 'staging', 'production'])
export type Mode = z.infer<typeof ModeSchema>

/** 文字列からモードを取得 */
export const parseMode = (value: unknown) =>
  Result.pipe(
    Result.parse(ModeSchema)(value),
    Result.mapError(
      () => new Error(`Invalid mode specified: [${String(value)}]`),
    ),
  )
