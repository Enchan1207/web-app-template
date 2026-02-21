import path from 'node:path'

import * as fs from 'fs/promises'
import type {
  UpdateD1DatabaseInput,
  WranglerRoot,
} from 'src/merge-wrangler/logic'
import { updateD1Database } from 'src/merge-wrangler/logic'
import type { InfraScriptMain } from 'src/terraform-handler'
import { terraformCommandHandler } from 'src/terraform-handler'
import z from 'zod'

/**
 * Terraformからの入力をパースしてWrangler設定のD1データベース定義を更新する
 */
const main: InfraScriptMain = async ({
  mode,
  input: inputRaw,
}): Promise<number> => {
  const inputSchema = z.object({
    database_id: z.string(),
    database_name: z.string(),
  })

  const input = inputSchema.parse(inputRaw) as UpdateD1DatabaseInput

  const wranglerFilePath = path.join(
    import.meta.dirname,
    '../../app/wrangler.jsonc',
  )

  const wranglerFileContent = await fs
    .readFile(wranglerFilePath)
    .then((buf) => buf.toString())
    .then((data) => JSON.parse(data) as WranglerRoot)

  const updated = updateD1Database(wranglerFileContent, mode, input)

  await fs.writeFile(wranglerFilePath, JSON.stringify(updated, null, 2))

  return 0
}

terraformCommandHandler(main)
  .then((c) => {
    console.log(JSON.stringify({ ok: 'true' }))
    process.exit(c)
  })
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.log(JSON.stringify({ error: message }))
    process.exit(1)
  })
