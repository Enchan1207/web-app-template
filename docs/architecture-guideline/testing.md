# アーキテクチャガイドライン - テスト

このドキュメントでは、テストの書き方について説明します。

## 設定

パッケージ `app` では、[vitest](https://vitest.dev/) のテスト環境が構成されています。

テストを補助するための npm スクリプトがいくつか定義されています:

- `pnpm -F app test`: すべてのファイルをテスト（時間がかかるため非推奨）
- `pnpm -F app test /path/to/file`: 指定したファイルをテスト（推奨）

## テスト設計

- 各テストは _独立_ していなければなりません。他のレイヤーに依存するテストを書いてはいけません。
- 関数やモジュールをモック化することはできます（`vi.mock` を使用）が、外部パッケージを置き換える場合にのみ使用できます。
- 日付をモック化してはいけません。代わりに _フェイクタイマー_ を使用してください:

  ```ts
  // セットアップ時
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2022-11-01T18:05:00Z'))

  // ティアダウン時
  vi.useRealTimers()
  ```

- _Workflows_ に対しては単体テストを実装しなければなりません（[layering.md](./layering.md) を参照）。
  - テストは他のレイヤーや外部パッケージに依存してはいけません。
  - ワークフローのすべての依存関係は _テストダブル_ として注入されなければなりません。
- 次のタイプのテストを実装してください:
  - 必須: 正常系（成功、作成、...）/ 異常系（読み込み失敗、不正な入力、...）
  - 推奨: 同値クラス
  - 推奨: 境界値

## テスト実装

テストコードの基本形式は以下の通りです:

```ts
import { describe, test } from 'vitest'

// ルートスコープでは describe から始める必要があります。ルートにテストを配置してはいけません
describe('startLoginAction', () => {
  describe('正常系', () => {
    let actual: Expected

    beforeAll(async () => {
      actual = await startLoginAction()
    })

    // 1つの `test` に1つの `expect`。アサーション・ルーレットを避ける必要があります

    test('プロパティxの値がyであること', () => {
      // 基本的には expect.toBe を使用
      expect(actual.x).toBe(y)
    })

    test('プロパティwにユーザ情報が設定されていること', () => {
      // プリミティブ以外を比較する場合は expect.toStrictEqual を使用
      expect(actual.w).toStrictEqual({
        id: 1,
        name: 'user',
        email: 'mail@exampe.com',
      })
    })
  })

  // 異常系では何が異常なのかを記述する必要があります
  describe('異常系 - リクエストが不正', () => {
    let actual: Expected

    beforeAll(async () => {
      actual = await startLoginAction()
    })

    test('プロパティxの値がzであること', () => {
      expect(actual.x).toBe(z)
    })

    test('プロパティwにユーザ情報が設定されていないこと', () => {
      // expect.toBeUndefined を使用できます
      expect(actual.w).toBeUndefined()
    })
  })

  describe('異常系 - DBからユーザを取得できない', () => {
    // 同様
  })
})
```
