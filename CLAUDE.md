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

## 現在の状況（Phase 3: Docker — DevContainer）

`nextjs-workspace/` をモノレポとして構成済み。docker-compose による2コンテナ連携も完成。GET/POST 両方の疎通も確認済み。

### 構成

```
nextjs-workspace/
├── hono-api/
│   ├── prisma/seed.ts     # Prisma シード（upsert で冪等）
│   ├── drizzle/seed.ts    # Drizzle シード（onConflictDoNothing で冪等）
│   └── package.json       # seed:prisma / seed:drizzle スクリプト追加済み
├── nextjs/
├── .claude/commands/      # /update-docs カスタムコマンド
├── pnpm-workspace.yaml
├── package.json           # oxfmt / oxlint をルートに移動、pnpm.overrides
├── docker-compose.yml     # hono-api + nextjs、マイグレーション+シード起動設定
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

### 次回やること：DevContainer の構築

`.devcontainer/devcontainer.json` を作成し、既存の `docker-compose.yml` を参照する形で構成する。

**目的：** VS Code でコンテナの中に入って開発できるようにする。ホストの Node.js や OS に依存しない再現性のある開発環境。

#### 1. `.devcontainer/devcontainer.json` を作成

```json
{
  "name": "nextjs-workspace",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "hono-api",
  "workspaceFolder": "/app",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "Prisma.prisma"
      ]
    }
  }
}
```

#### 2. VS Code で「Reopen in Container」を実行

コマンドパレット（`Cmd+Shift+P`）→ `Dev Containers: Reopen in Container`

#### 3. コンテナ内でターミナルを開き、動作確認

```bash
node -v   # コンテナ内の Node.js バージョンが表示されること
pnpm dev  # hono-api が起動すること
```
