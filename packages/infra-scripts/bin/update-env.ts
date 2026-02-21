import path from 'node:path'

import * as fs from 'fs/promises'
import { envUpdatesSchema, mergeEnvLines } from 'src/merge-env/logic'
import type { InfraScriptMain } from 'src/terraform-handler'
import { terraformCommandHandler } from 'src/terraform-handler'
import z from 'zod'

const optionsSchema = z.object({
  fileSuffix: z.string().optional(),
})

type UpdateEnvOptions = z.infer<typeof optionsSchema>

/**
 * Terraformからの入力をパースして環境変数を更新する
 *
 * @note 既存のキーは更新され、存在しないキーは末尾に追加されます。
 */
const main: InfraScriptMain<UpdateEnvOptions> = async ({
  mode,
  input: inputRaw,
  options,
}): Promise<number> => {
  const input = envUpdatesSchema.parse(inputRaw)

  const suffix = options.fileSuffix ?? ''
  const envFilePath = path.join(
    import.meta.dirname,
    `../../app/.env.${mode}${suffix}`,
  )

  const envFileLines = await fs
    .readFile(envFilePath)
    .then((buf) => buf.toString().split('\n'))
    .catch(() => [])

  const updated = mergeEnvLines(envFileLines, input)

  await fs.writeFile(envFilePath, updated.join('\n'))

  return 0
}

terraformCommandHandler(main, {
  optionsSchema,
  commanderOptions: [
    {
      flags: '--file-suffix <suffix>',
      description: 'ファイル名のサフィックス（例: .local）',
    },
  ],
})
  .then((c) => {
    console.log(JSON.stringify({ ok: 'true' }))
    process.exit(c)
  })
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.log(JSON.stringify({ error: message }))
    process.exit(1)
  })
