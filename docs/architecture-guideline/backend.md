# バックエンド実装ガイドライン

## アーキテクチャ概要

関数型ドメインモデリング（Scott Wlaschin）およびROP(Railway Oriented Programming)の原則に従う。

### 基本原則

1. **データと振る舞いの分離**: ドメインモデルは処理を持たない純粋な型定義
2. **ドメインイベント駆動**: Command → Workflow → Event の流れ
3. **副作用の分離**: 副作用はワークフローの外側に追いやり、依存性注入で渡す
4. **レイヤ独立性**: ワークフローはドメインモデルを除く他のレイヤに依存しない
5. **シンプルさ優先**: 参照のみの処理はワークフローを作らずrouteレイヤで実施

## ディレクトリ構造

```
backend/
├── domains/           # ドメインモデル定義（純粋な型のみ）
├── features/          # 機能別レイヤ
│   └── <feature>/
│       ├── repository.ts   # 永続化層
│       ├── workflow.ts     # ビジネスロジック
│       ├── route.ts        # HTTPエンドポイント
│       └── middleware.ts   # 機能固有ミドルウェア（任意）
├── middlewares/       # 横断的関心事のミドルウェア
├── schemas/          # Drizzle ORMスキーマ定義
└── lib/              # 共通ユーティリティ
```

## レイヤ定義

### Domain Layer (`domains/`)

- 純粋な型定義のみ（処理を持たない）
- 他のレイヤへの依存なし
- システム内部の識別子には`Brand`型を使用
- 外部システムの識別子（IdP Subjectなど）はプリミティブ型を直接使用

### Workflow Layer (`features/<feature>/workflow.ts`)

- Command → Event の変換を実施（ビジネスロジック）
- 副作用（永続化、外部API）は関数として注入
- ドメイン層のみに依存
- ワークフロー固有の型はここで定義

**命名規則**:

- ワークフロー: `build<Action><Entity>Workflow`
- Command: `<Action><Entity>Command`
- Event: `<Entity><Action>edEvent` または `<DomainEvent>Event`

### Repository Layer (`features/<feature>/repository.ts`)

- ドメインモデルの永続化を担当
- DBレコード ⇄ ドメインモデルの変換を実施
- カリー化により依存性注入を実現

**命名規則**:

- 取得: `find<Entity>By<Condition>`
- 保存: `save<Entity>`
- 削除: `delete<Entity>`

### Route Layer (`features/<feature>/route.ts`)

- HTTPエンドポイントの定義
- Honoインスタンスをメソッドチェーン形式で定義
- 参照のみの処理はここで直接実施（ワークフローを作らない）
- 更新系はワークフローを呼び出す

### Middleware Layer

**配置ルール**:

- 横断的関心事: `middlewares/` 配下
- ドメイン固有: `features/<feature>/middleware.ts`

**ルール**:

- ドメイン固有ミドルウェアは対応featureのrepository/workflowを利用可能

### Schema Layer (`schemas/`)

- Drizzle ORMのスキーマ定義のみ
- 機能ごとにファイルを分割

## 命名規則

### ファイル・ディレクトリ

- モジュール: `kebab-case`
- 機能ディレクトリ: 複数形（`posts`, `users`）

### 変数・関数

- 変数・関数: `lowerCamelCase`
- クラス・定数: `PascalCase`

### 型

- ドメインモデル: `PascalCase`
- Branded Type: `<Entity><Property>`（例: `UserId`, `PostId`）

## 依存関係ルール

```
route.ts → workflow.ts ← repository.ts (注入)
              ↓
          domains/

middleware.ts (feature固有) → repository.ts, workflow.ts
```

- **Route**: Workflow, Repository, Middlewareを呼び出す
- **Workflow**: Domainのみに依存、Repositoryは注入
- **Repository**: Domainに依存
- **Middleware (feature固有)**: Repository, Workflowを使用可能
- **Middleware (横断的)**: 他のレイヤに依存しない
- **Domain**: 他に依存しない

## 型の使用方針

```typescript
// ✅ システム内部の識別子
export type UserId = Brand<string, 'UserId'>

// ❌ 外部システムの識別子
// export type IdPSubject = Brand<string, 'IdPSubject'>

// ✅ 外部識別子はプリミティブを直接使用
export type User = {
  readonly id: UserId
  readonly idpSubject: string
}
```

## 禁止事項

1. ❌ ドメインモデルにメソッドを持たせる
2. ❌ ワークフローから直接DBアクセス
3. ❌ ルート層にビジネスロジックを記述
4. ❌ 外部システムの識別子にBranded Typeを使用
5. ❌ 横断的関心事のミドルウェアをfeatures配下に配置
6. ❌ ルート定義で変数に代入してからメソッド呼び出し（型補完が効かない）

## 実装チェックリスト

- [ ] ドメインモデルを`domains/`に定義
- [ ] スキーマを`schemas/`に作成し、`drizzle-kit generate`実行
- [ ] Repositoryを実装
- [ ] 更新系の場合、Workflowを実装
- [ ] Routeをメソッドチェーンで定義
- [ ] 必要に応じてMiddlewareを実装
- [ ] `index.ts`でrouteを統合
- [ ] エラーチェック実施
