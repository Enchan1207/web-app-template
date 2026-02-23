# Web application template

## Overview

Cloudflareへのデプロイを想定したWebアプリケーション開発テンプレート

## Contents

- TypeScript
- フロント
  - React
  - TanStack Router
  - TanStack Query
  - shadcn/ui
- バック
  - Hono
  - Railway-Oriented-Programming
- インフラ
  - Terraform
  - Auth0
  - Cloudflare Workers
  - Cloudflare D1

AIフレンドリ: `AGENTS.md` およびアーキテクチャガイドラインを規定しています。

## Bootstrap

### Preparation

`.envrc.sample` をコピーして `.env` を作成し、必要な情報を入力してください。

クローン後に以下の文字列を置換してください:

- ドメイン
  - `web-app-template.localhost` -> `<app name>.localhost`
  - `web-app-template.example.com` -> `<app name>.<domain>`
  - `tenant.region.auth0.com` -> `<tenant>.<region>.auth0.com`
- プロジェクト名
  - `web-app-template` -> `<app name>`
- ファイル名
  - `web-app-template.code-workspace` -> `<app name>.code-workspace`

### Install

```sh
pnpm i
```

### Configure infra

リポジトリルートで以下を実行します:

```sh
terraform -chdir=infra/env/<env> init
```

環境 `env` は `local`, `stg`, `prod` がそれぞれ構成されています。

```sh
terraform -chdir=infra/env/<env> plan
terraform -chdir=infra/env/<env> apply
terraform -chdir=infra/env/<env> destroy
```

## License

This software is published under [MIT License](LICENSE).
