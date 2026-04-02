# 生成AIによる編集について

本プロジェクトは学習用に作成しているものなので、生成AIによる編集は、メインのプロジェクトは受け付けない。
ROADMAP.mdやCLAUDE.mdは編集してok
ファイルの編集は全て人がやるので、コードや設定ファイルの変更は手順・内容の提示のみ行う。

---

## プロジェクト概要

### モチベ

- Next.js, Hono, ORM（Prisma, Drizzle）, Docker, AWS などの基本を抑える
- 各種ホスティングサービスへのデプロイ

### スタック

- Next.js 16 (App Router)
- Hono
- ORM: Prisma, Drizzle
- Docker
- AWS
- （Vercel）
- （Cloudflare）

### 進め方

- ROADMAP.md に沿ってカリキュラムを順番に進める

---

## 現在の状況（Phase 3: Docker — 完了）

`nextjs-workspace/` をモノレポとして構成済み。docker-compose による2コンテナ連携・DevContainer 設定・ホットリロード対応まで完了。

### 構成

```
nextjs-workspace/
├── hono-api/
│   ├── prisma/seed.ts     # Prisma シード（upsert で冪等）
│   ├── drizzle/seed.ts    # Drizzle シード（onConflictDoNothing で冪等）
│   └── package.json       # seed:prisma / seed:drizzle スクリプト追加済み
├── nextjs/
├── .devcontainer/
│   ├── hono-api/devcontainer.json   # service: "hono-api"
│   └── nextjs/devcontainer.json     # service: "nextjs"
├── .claude/commands/      # /update-docs カスタムコマンド
├── pnpm-workspace.yaml
├── package.json           # oxfmt / oxlint をルートに移動、pnpm.overrides
├── docker-compose.yml     # hono-api + nextjs、volumes でホットリロード対応
└── pnpm-lock.yaml
```

### 解決済みの問題

- `nextjs/src/lib/client.ts` の相対パス参照 → `hono-api` を workspace パッケージとして参照
- `hono` バージョン不一致（4.12.8 vs 4.12.9）→ `pnpm.overrides` で統一
- `nextjs/Dockerfile` をモノレポ対応に修正済み（`output: 'standalone'`、build context をルートに）
- standalone の出力が `nextjs/` サブディレクトリに入る構造 → `CMD ["node", "nextjs/server.js"]` で対応
- `hono-api/Dockerfile` をモノレポ対応に修正済み（build context をルートに）
- `better-sqlite3` ネイティブモジュール問題 → `apk add python3 make g++` + `pnpm rebuild` + `onlyBuiltDependencies` で解決
- `docker-compose.yml` 作成済み（hono-api + nextjs、内部ネットワーク経由で通信）
- `actions.ts` / `client.ts` の URL をハードコードから環境変数（`HONO_API_URL`）に変更済み
- マイグレーション + シードを `docker-compose.yml` の `command` で起動時に実行するよう設定済み
- `hono-api/prisma/seed.ts` / `hono-api/drizzle/seed.ts` 作成済み（`onConflictDoNothing` で冪等）
- `oxfmt` / `oxlint` をルート `package.json` に移動（プロジェクト全体で使用）
- DevContainer を2サービス対応に構成（`.devcontainer/hono-api/` と `.devcontainer/nextjs/` に分割）
- `docker-compose.yml` に `volumes` を追加してホットリロード対応（`tsx watch` が変更を検知できるように）

### 次回やること：Phase 3.5 — PostgreSQL 移行

SQLite から PostgreSQL へ移行し、本番環境に近い構成にする。

#### 1. `docker-compose.yml` に PostgreSQL コンテナを追加

```yaml
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - '5432:5432'
```

#### 2. Prisma スキーマを PostgreSQL 用に変更

`hono-api/prisma/schema.prisma` の `provider` を変更：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 3. Drizzle スキーマを PostgreSQL 用に変更

`drizzle-orm/node-postgres` に切り替え。

#### 4. 環境変数を更新

```
DATABASE_URL=postgresql://user:password@postgres:5432/mydb
```
