# nextjs-workspace

Next.js + Hono + ORM + Docker + AWS の基礎を学ぶための学習用モノレポ。

> 関連リポジトリ: [cloudflare-workspace](../cloudflare-workspace) / [lambda-workspace](../lambda-workspace)

## スタック

- **Next.js 16** (App Router)
- **Hono** (バックエンド API)
- **ORM**: Drizzle（PostgreSQL）
- **DB**: PostgreSQL
- **Docker** / Docker Compose / DevContainer
- **AWS** EC2 / CodeDeploy / ECS / ECR

## 構成

```
nextjs-workspace/
├── hono-api/              # Hono バックエンド API
│   ├── src/
│   └── drizzle/           # Drizzle スキーマ・マイグレーション・シード（PostgreSQL）
├── nextjs/                # Next.js フロントエンド
│   └── src/
├── .devcontainer/
│   ├── hono-api/devcontainer.json
│   └── nextjs/devcontainer.json
├── .env                   # 機密情報（gitignore 済み）
├── .env.example           # 設定項目のテンプレート
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## セットアップ

### Docker で起動（推奨）

```bash
docker compose up --build
```

| サービス | URL |
|---------|-----|
| Next.js | http://localhost:3000 |
| Hono API | http://localhost:3001 |

起動時に Drizzle のマイグレーションとシードが自動実行されます。

### DevContainer で開発

VS Code でコマンドパレット（`Cmd+Shift+P`）→ `Dev Containers: Reopen in Container`

hono-api / nextjs どちらのコンテナに入るか選択できます。

### ローカルで起動（Docker なし）

```bash
pnpm install
pnpm dev:api   # hono-api を起動
pnpm dev:web   # nextjs を起動
```

## 進捗

| Phase | 内容 | 状態 | リポジトリ |
|-------|------|------|------------|
| Phase 1 | Next.js 基礎 | 完了 | nextjs-workspace |
| Phase 2 | Hono 基礎・Next.js 連携 | 完了 | nextjs-workspace |
| Phase 2.5 | Prisma CRUD | 完了 | nextjs-workspace |
| Phase 2.6 | Drizzle CRUD | 完了 | nextjs-workspace |
| Phase 3 | Docker / DevContainer | 完了 | nextjs-workspace |
| Phase 3.5 | PostgreSQL 移行 | 完了 | nextjs-workspace |
| Phase 4 | AWS EC2 / CodeDeploy / ECS + ECR | 完了 | nextjs-workspace |
| Phase 5 | Next.js 書籍（読書） | 完了 | — |
| Phase 6 | Cloudflare Workers / D1 / Pages | 完了 | cloudflare-workspace |
| Phase 7 | AWS Lambda + API Gateway | 完了 | lambda-workspace |
| Phase 8 | React 18 / 19 の理解 | 進行中 | — |
| Phase 9 | TanStack Start | 未着手 | — |
| Phase 10 | Vite + | 未着手 | — |
| Phase 11 | neverthrow | 未着手 | — |
| Phase 12 | Effect | 未着手 | — |

詳細は [ROADMAP.md](./ROADMAP.md) を参照。
