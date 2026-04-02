# 学習ロードマップ: Next.js 16 + Hono + Docker + AWS

## Phase 1: Next.js

- [x] Next.js 16 環境構築 (pnpm + Vercel デプロイ)
- [x] RSC (React Server Components)
- [x] Client Component (`"use client"`)
- [x] SSR / SSG / ISR (`fetch` の `cache` オプション)
- [x] Server Actions (`"use server"`)
- [x] Route Handlers (`app/api/route.ts`) — API エンドポイントの作り方
- [x] Middleware (`middleware.ts`) — 認証チェック・リダイレクト
- [x] 環境変数 (`.env`) — `NEXT_PUBLIC_` あり/なしの違い

---

## Phase 2: Hono

- [x] Hono の基本 — ルーティング、ハンドラー
- [x] Next.js の Route Handlers と比較
- [x] Hono + Next.js の連携 — RSC から GET、Server Actions から POST
- [x] Hono + Next.js の組み合わせ (RPC モード)
- [x] バリデーション (Zod)

---

## Phase 2.5: DB 連携 (Prisma)

- [x] Prisma セットアップ — スキーマ定義・マイグレーション (User / Post、better-sqlite3)
- [x] GET /posts — `prisma.post.findMany()` で DB から取得
- [x] POST /posts — DB への保存
- [x] GET /posts/:id — DB から1件取得
- [x] PUT /posts/:id — DB 更新
- [x] DELETE /posts/:id — DB 削除
- [x] エラーハンドリング・型安全な操作

---

## Phase 2.6: DB 連携 (Drizzle)

- [x] Drizzle セットアップ — スキーマ定義・マイグレーション
- [x] Hono + Drizzle で CRUD 実装
- [x] Prisma との比較 — DX・型安全性・パフォーマンス観点
- [x] どちらを使うか判断基準の整理
- [x] Next.js の page.tsx から Prisma・Drizzle 両エンドポイントを呼び出す

---

## Phase 3: Docker

- [x] Docker の基本概念を理解
- [x] Dockerfile の書き方
- [x] Hono アプリを Docker 化
- [x] Next.js アプリを Docker 化（Hono RPC 型の相対パス問題解決）
  - [x] モノレポ化: pnpm-workspace で hono-api と nextjs を統合
    - [x] ルートに `pnpm-workspace.yaml` 作成（packages: hono-api, nextjs）
    - [x] ルートに `package.json` 作成（workspace 管理用スクリプト）
    - [x] `nextjs/src/lib/client.ts` の import を相対パス → workspace パッケージに変更
    - [x] `nextjs/Dockerfile` を修正（build context をルートに、hono-api/src をコピー、standalone 対応）
    - [x] docker build をルートから実行（`docker build -f nextjs/Dockerfile .`）
  - [x] Hono RPC の型解決を確認
  - [x] `docker run` で Next.js コンテナ単体の起動確認
- [x] docker-compose でローカル開発環境を構築（hono-api + nextjs の統合）
  - [x] `nextjs/src/lib/client.ts` の URL を環境変数化
  - [x] `nextjs/src/app/actions.ts` の URL を環境変数化
  - [x] `hono-api/Dockerfile` をモノレポ対応に修正
  - [x] ルートに `docker-compose.yml` を作成
  - [x] `docker compose up` で両コンテナ起動確認
  - [x] シードデータ投入（Prisma / Drizzle）して POST が通ることを確認
  - [x] GET / POST 両方の疎通確認
- [ ] DevContainer を使った開発環境構築
  - [ ] `.devcontainer/devcontainer.json` を作成
  - [ ] `docker-compose.yml` を DevContainer から参照する設定
  - [ ] VS Code でコンテナ内に入って開発できることを確認
  - [ ] 拡張機能・設定を `devcontainer.json` に記述して再現性を確認

---

## Phase 4: AWS

- [ ] AWS の基本構成を理解 (ECS / ECR / ALB)
- [ ] ECR に Docker イメージを push
- [ ] ECS (Fargate) でコンテナをデプロイ
- [ ] 独自ドメイン + HTTPS (Route 53 + ACM)

---

## Phase 5: Vercel デプロイ

- [ ] Next.js を Vercel にデプロイ
- [ ] Hono API を Vercel Functions としてデプロイ
- [ ] 環境変数の設定（`HONO_API_URL` など）
- [ ] プレビューデプロイの活用

---

## Phase 6: Cloudflare デプロイ

- [ ] Cloudflare Pages に Next.js をデプロイ
- [ ] Hono API を Cloudflare Workers としてデプロイ
- [ ] Cloudflare D1（SQLite 互換 DB）との連携
- [ ] Vercel / AWS との比較 — コスト・レイテンシ・DX

---

## 追加学習: その他 ORM

- [ ] Kysely を試す — SQL に近いクエリビルダーの書き心地を体験
- [ ] MikroORM を試す — フル機能 ORM との比較

---

## 追加学習: RSC の深掘り

- [ ] RSC と SSR/SSG/ISR の関係性を改めて整理
- [ ] Pages Router 時代との比較
- [ ] コンポーネント単位でのレンダリング戦略の制御

---

## 参考

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Hono ドキュメント](https://hono.dev)
- [AWS ECS ドキュメント](https://docs.aws.amazon.com/ecs)
