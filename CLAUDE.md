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

## 現在の状況（Phase 3: Docker）

`nextjs-workspace/` をモノレポとして構成済み。

### 構成

```
nextjs-workspace/
├── hono-api/          # Hono API サーバー（port 3001）
├── nextjs/            # Next.js フロントエンド（port 3000）
├── pnpm-workspace.yaml
├── package.json       # pnpm.overrides で hono バージョンを統一
└── pnpm-lock.yaml
```

### 解決済みの問題

- `nextjs/src/lib/client.ts` の相対パス参照 → `hono-api` を workspace パッケージとして参照
- `hono` バージョン不一致（4.12.8 vs 4.12.9）→ `pnpm.overrides` で統一
- `nextjs/Dockerfile` をモノレポ対応に修正済み（`output: 'standalone'`、build context をルートに）
- standalone の出力が `nextjs/` サブディレクトリに入る構造 → `CMD ["node", "nextjs/server.js"]` で対応

### 解決済みの問題（続き）

- `hono-api/Dockerfile` をモノレポ対応に修正済み（build context をルートに）
- `better-sqlite3` ネイティブモジュール問題 → `apk add python3 make g++` + `pnpm rebuild` + `onlyBuiltDependencies` で解決
- `docker-compose.yml` 作成済み（hono-api + nextjs、内部ネットワーク経由で通信）
- `actions.ts` / `client.ts` の URL をハードコードから環境変数（`HONO_API_URL`）に変更済み
- マイグレーションを `docker-compose.yml` の `command` で起動時に実行するよう設定済み

### 現在の作業（シードデータ）

`docker compose up` は起動できているが、POST 時に Foreign Key エラーが発生。
コンテナ内の DB に User レコードが存在しないため。

**次回やること：シードファイルを作成して docker-compose の command に追加**

#### 1. `hono-api/prisma/seed.ts` を作成

```ts
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, email: "seed@example.com", name: "Seed User" },
  });
  console.log("Prisma seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 2. `hono-api/drizzle/seed.ts` を作成

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(
  (process.env.DB_FILE_NAME ?? "file:local.db").replace("file:", "")
);
const db = drizzle(sqlite, { schema });

async function main() {
  await db
    .insert(schema.users)
    .values({ id: 1, email: "seed@example.com", name: "Seed User" })
    .onConflictDoNothing();
  console.log("Drizzle seed completed");
}

main().catch(console.error);
```

#### 3. `hono-api/package.json` にスクリプトを追加

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "seed:prisma": "tsx prisma/seed.ts",
  "seed:drizzle": "tsx drizzle/seed.ts"
},
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

#### 4. `docker-compose.yml` の command を更新

```yaml
command: >
  sh -c "
    pnpm exec prisma migrate deploy &&
    pnpm exec drizzle-kit migrate &&
    pnpm seed:prisma &&
    pnpm seed:drizzle &&
    pnpm dev
  "
```

#### 5. 再ビルド・起動

```bash
docker compose build --no-cache hono-api
docker compose up
```
