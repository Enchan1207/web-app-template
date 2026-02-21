import { Result } from '@praha/byethrow'
import { Command } from 'commander'
import type { ZodType } from 'zod'

import type { Mode } from './mode'
import { parseMode } from './mode'

export type InfraScriptMain<TOptions = Record<string, never>> = (props: {
  mode: Mode
  input: Record<string, unknown>
  options: TOptions
}) => number | Promise<number>

type CommanderOption = {
  flags: string
  description: string
}

/**
 * Terraformコマンドハンドラ
 * @description Terraformの _external_ 経由で呼び出されるスクリプトのエントリポイントに使用します。
 */
export const terraformCommandHandler = async <TOptions>(
  fn: InfraScriptMain<TOptions>,
  config?: {
    optionsSchema?: ZodType<TOptions>
    commanderOptions?: CommanderOption[]
  },
): Promise<number> => {
  const command = new Command().option('--mode <name>', 'mode')

  // 追加のコマンドラインオプションを登録
  if (config?.commanderOptions) {
    for (const opt of config.commanderOptions) {
      command.option(opt.flags, opt.description)
    }
  }

  const cliOptions: Record<string, string | undefined> = command.parse().opts()

  // 引数からモードを取得
  const modeResult = parseMode(cliOptions['mode'])
  if (Result.isFailure(modeResult)) {
    console.error(modeResult.error)
    return 1
  }
  const mode = modeResult.value

  // 標準入力をパース
  const input = await new Promise<string>((resolve) => {
    let data = ''
    process.stdin.on('data', (chunk) => (data += chunk.toString()))
    process.stdin.on('end', () => {
      resolve(data)
    })
  }).then((data) => JSON.parse(data) as Record<string, unknown>)

  // オプションスキーマで検証
  const scriptOptions = config?.optionsSchema
    ? config.optionsSchema.parse(cliOptions)
    : ({} as TOptions)

  return fn({ mode, input, options: scriptOptions })
}
