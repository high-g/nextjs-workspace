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

## 現在の状況（Phase 3.5: PostgreSQL 移行 — 動作確認待ち）

Drizzle を PostgreSQL に移行済み。Prisma は引き続き SQLite を使用。`docker compose up --build` での動作確認が次のステップ。

### 方針

- **Drizzle** → PostgreSQL（`drizzle-orm/node-postgres`）
- **Prisma** → SQLite のまま存続（方針変更）

### 構成

```
nextjs-workspace/
├── hono-api/
│   ├── prisma/seed.ts     # Prisma シード（SQLite）
│   ├── drizzle/
│   │   ├── schema.ts      # pg-core に変更済み
│   │   └── seed.ts        # node-postgres に変更済み
│   ├── drizzle.config.ts  # dialect: "postgresql" に変更済み
│   ├── src/lib/drizzle.ts # node-postgres に変更済み
│   └── package.json       # pg / @types/pg 追加済み
├── nextjs/
├── .devcontainer/
│   ├── hono-api/devcontainer.json
│   └── nextjs/devcontainer.json
├── .env                   # 機密情報（gitignore 済み）
├── .env.example           # 項目のみコミット
├── docker-compose.yml     # postgres サービス追加・env_file 対応
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
- DevContainer を2サービス対応に構成（`.devcontainer/hono-api/` と `.devcontainer/nextjs/` に分割）
- `docker-compose.yml` に `volumes` を追加してホットリロード対応
- 機密情報を `.env` で管理し `env_file` で docker-compose に渡す構成に変更

### 次回やること：`docker compose up --build` で動作確認

```bash
docker compose up --build
```

確認ポイント：
- `postgres` コンテナが起動する
- `drizzle-kit migrate` が正常に実行される
- `Drizzle seed completed` が表示される
- `Server is running on http://localhost:3001` が表示される
- `/drizzle/posts` エンドポイントへの GET / POST 疎通確認
