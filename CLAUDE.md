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

### 現在の作業（docker-compose）

次のステップ：

1. `nextjs/src/lib/client.ts` の URL を環境変数化（`process.env.HONO_API_URL ?? 'http://localhost:3001'`）
2. `hono-api/Dockerfile` をモノレポ対応に修正（build context をルートに変更）
3. ルートに `docker-compose.yml` を作成
4. `docker compose up` で両コンテナ起動・疎通確認
