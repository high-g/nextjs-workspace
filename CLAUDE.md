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

`nextjs-workspace/` をモノレポとして構成中。

### 構成

```
nextjs-workspace/
├── hono-api/      # Hono API サーバー（port 3001）
├── nextjs/        # Next.js フロントエンド（port 3000）
├── pnpm-workspace.yaml
└── package.json
```

### 解決済みの問題

- `nextjs/src/lib/client.ts` が `hono-api` の型を相対パスで参照していたため Docker build 不可だった
- pnpm workspace 化 + `hono-api` を workspace パッケージとして参照することで解決
- `hono` のバージョン不一致（4.12.8 vs 4.12.9）を `pnpm.overrides` で統一

### 現在の作業

- `nextjs/Dockerfile` をモノレポ対応に修正中
  - `next.config.ts` に `output: 'standalone'` を追加
  - build context をルート（`nextjs-workspace/`）に変更
  - `docker build -f nextjs/Dockerfile .` でルートから実行
