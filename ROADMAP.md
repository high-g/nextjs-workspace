# 学習ロードマップ

## リポジトリ構成

| リポジトリ | 用途 |
|---|---|
| `nextjs-workspace` | Docker + AWS（EC2 / CodeDeploy / ECS） |
| `cloudflare-workspace` | Cloudflare（Workers / D1 / Pages） |
| `lambda-workspace` | AWS Lambda + API Gateway |

## スケジュール

| 期間 | 内容 | 状態 |
|---|---|---|
| 3/15〜 | Next.js 16（SSR・RSC・Server Actions・Vercel Deploy・Route Handler・Middleware） | ✅ |
| 3/23〜 | Hono（基本ルーティング・GET/POST・Hono RPC・Zod連携） | ✅ |
| 3/30〜 | Prisma / Drizzle（サーバーサイドTSで利用するORMを理解） | ✅ |
| 4/1〜 | Docker（Dockerfile・docker build/run・docker compose・DevContainer） | ✅ |
| 4/2〜4/4 | DB移行（SQLite → PostgreSQL） | ✅ |
| 4/4〜4/10 | EC2 デプロイ（EC2上でHono、Next.jsを動作させる） | ✅ |
| 4/11〜4/15 | CodeDeploy（ツールチームの環境に合わせた内容を理解） | ✅ |
| 4/16〜4/22 | ECR + ECS デプロイ（ECSを利用し、AWS上でHono、Next.jsを動作させる） | ✅ |
| 4/23 | Next.js 書籍 | ✅ |
| 4/24〜4/28 | ECR + ECS デプロイ（続き） | ✅ |
| 4/29〜5/5 | Cloudflare デプロイ（pages, workers） | ✅ |
| 5/6〜5/11 | AWS Lambda + API Gateway | ✅ |
| 5/12〜5/15 | React 18 / 19 の理解 | 🔄 |
| 5/15〜5/18 | TanStack Start | |
| 5/19〜5/21 | Vite + | |
| 5/22〜5/26 | neverthrow（Honoで扱う場合を考えながら） | |
| 5/27〜5/31 | Effect（Honoで扱う場合を考えながら） | |

---

## Phase 1: Next.js ✅

- [x] Next.js 16 環境構築 (pnpm + Vercel デプロイ)
- [x] RSC (React Server Components)
- [x] Client Component (`"use client"`)
- [x] SSR / SSG / ISR (`fetch` の `cache` オプション)
- [x] Server Actions (`"use server"`)
- [x] Route Handlers (`app/api/route.ts`) — API エンドポイントの作り方
- [x] Middleware (`middleware.ts`) — 認証チェック・リダイレクト
- [x] 環境変数 (`.env`) — `NEXT_PUBLIC_` あり/なしの違い

---

## Phase 2: Hono ✅

- [x] Hono の基本 — ルーティング、ハンドラー
- [x] Next.js の Route Handlers と比較
- [x] Hono + Next.js の連携 — RSC から GET、Server Actions から POST
- [x] Hono + Next.js の組み合わせ (RPC モード)
- [x] バリデーション (Zod)

---

## Phase 2.5: DB 連携 (Prisma) ✅

- [x] Prisma セットアップ — スキーマ定義・マイグレーション (User / Post、better-sqlite3)
- [x] GET /posts — `prisma.post.findMany()` で DB から取得
- [x] POST /posts — DB への保存
- [x] GET /posts/:id — DB から1件取得
- [x] PUT /posts/:id — DB 更新
- [x] DELETE /posts/:id — DB 削除
- [x] エラーハンドリング・型安全な操作

---

## Phase 2.6: DB 連携 (Drizzle) ✅

- [x] Drizzle セットアップ — スキーマ定義・マイグレーション
- [x] Hono + Drizzle で CRUD 実装
- [x] Prisma との比較 — DX・型安全性・パフォーマンス観点
- [x] どちらを使うか判断基準の整理
- [x] Next.js の page.tsx から Prisma・Drizzle 両エンドポイントを呼び出す

---

## Phase 3: Docker ✅

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
- [x] DevContainer を使った開発環境構築
  - [x] `.devcontainer/hono-api/devcontainer.json` と `.devcontainer/nextjs/devcontainer.json` を作成（2サービス対応）
  - [x] `docker-compose.yml` を DevContainer から参照する設定
  - [x] `docker-compose.yml` に `volumes` を追加してホットリロード対応
  - [x] VS Code でコンテナ内に入って開発できることを確認
  - [x] 拡張機能・設定を `devcontainer.json` に記述して再現性を確認

---

## Phase 3.5: PostgreSQL 移行 ✅

- [x] PostgreSQL の基本概念を理解（SQLite / MySQL との違い）
- [x] Docker Compose に PostgreSQL コンテナを追加（postgres:17-alpine）
- [x] 機密情報を `.env` で管理（`env_file` で docker-compose に渡す）
- [x] Drizzle スキーマを PostgreSQL 用に変更（`drizzle-orm/node-postgres`）
  - [x] `pg` / `@types/pg` パッケージ追加
  - [x] `drizzle/schema.ts` を `pg-core` に変更
  - [x] `drizzle.config.ts` を `dialect: "postgresql"` に変更
  - [x] `src/lib/drizzle.ts` を `node-postgres` に変更
  - [x] `drizzle/seed.ts` を `node-postgres` に変更
  - [x] 古い SQLite 用マイグレーションファイルを削除
- [x] `docker compose up --build` でマイグレーション・シードの動作確認
- [x] hono-api から PostgreSQL への接続確認（GET / POST 疎通）

---

## Phase 4: AWS ✅

> リポジトリ: `nextjs-workspace`

### EC2 直接デプロイ（4/4〜4/10）

- [x] IAM ユーザー作成・アクセスキー発行・AWS CLI セットアップ
- [x] IAM の基本概念を理解 — ユーザー・ロール・ポリシー・インスタンスプロファイル
- [x] VPC の基本概念を理解 — サブネット・IGW・セキュリティグループ・NACL
- [x] EC2 インスタンス起動（Amazon Linux 2023 / t3.micro）
- [x] EC2 に Docker / Docker Compose / buildx インストール・スワップ追加
- [x] セキュリティグループでポート開放（22 / 3000 / 3001）
- [x] ブラウザから EC2 パブリック IP でアクセス確認（Next.js + Hono API + DB 疎通）

### CodeDeploy による自動デプロイ（4/11〜4/15）

- [x] S3 バケット作成（`nextjs-deploy-artifacts-513148686116`）
- [x] CodeDeploy エージェントを EC2 にインストール
- [x] IAM ロール作成（`CodeDeployRole` / `EC2CodeDeployRole`）
- [x] EC2 インスタンスに `EC2CodeDeployRole` をアタッチ
- [x] CodeDeploy アプリケーション・デプロイグループ作成
- [x] `appspec.yml` と デプロイスクリプト作成（`scripts/deploy.sh` / `scripts/before_install.sh`）
- [x] GitHub Actions ワークフロー作成（zip → S3 → CodeDeploy）
- [x] push をトリガーに EC2 へ自動デプロイされることを確認

### ECS + ECR（4/16〜4/28）

- [x] ECS / ECR の基本構成を理解
- [x] ECR リポジトリ作成・Docker イメージを push
  - [x] ECR リポジトリ作成（`hono-api` / `nextjs-app`）
  - [x] IAM ロール作成（`ecsTaskExecutionRole`）・`nextjs-user` に `AmazonEC2ContainerRegistryFullAccess` / `AmazonECS_FullAccess` 追加
  - [x] `aws ecr get-login-password` で ECR にログイン
  - [x] `hono-api/Dockerfile` をマルチステージビルドに変更（928MB → 483MB）
  - [x] `hono-api/Dockerfile.dev` 作成（ローカル dev 用、フル deps）
  - [x] `docker-compose.yml` を `Dockerfile.dev` に変更
  - [x] `tsx` を devDependencies → dependencies に移動（`--prod` インストールで実行可能に）
  - [x] Docker イメージをビルドして ECR に push（hono-api / nextjs-app）
- [x] ECS タスク定義・サービス作成（Fargate）
  - [x] ECS クラスター作成（`nextjs-cluster`）
  - [x] タスク定義作成（`nextjs-task`、CPU 0.25vCPU・メモリ 0.5GB）
  - [x] セキュリティグループ設定（`nextjs-sg`、ポート 3000/3001 開放）
  - [x] ECS サービス作成（`nextjs-service`、Fargate、Circuit Breaker オフ）
  - [x] DB 接続先を EC2 の PostgreSQL（`172.31.45.172:5432`）に設定
  - [x] ブラウザからアクセス確認（`http://<パブリックIP>:3000`）
- [x] GitHub Actions でビルド → ECR push → ECS 自動デプロイ
  - [x] `.github/workflows/deploy-ecs.yml` 作成（`--platform linux/amd64` でビルド）
  - [x] push をトリガーに ECR push → ECS デプロイが自動実行されることを確認

---

## Phase 5: Next.js 書籍（4/23） ✅

- [x] 書籍を読む

---

## Phase 6: Cloudflare デプロイ（4/29〜5/5） ✅

> リポジトリ: `cloudflare-workspace`（新規作成）

- [x] Hono API を Cloudflare Workers としてデプロイ
- [x] Cloudflare D1（SQLite 互換 DB）との連携
- [x] Next.js を Cloudflare Workers にデプロイ（OpenNext 経由）
- [x] App Router 実装（Route Handlers / Server Components / Server Actions）
  - [x] Route Handlers — `app/api/posts/route.ts` で hono-api に繋ぐ
  - [x] Server Components — posts 一覧をサーバー側で取得・描画
  - [x] Server Actions — 投稿フォームからPOST処理

---

## Phase 7: AWS Lambda + API Gateway（5/6〜5/11）

> リポジトリ: `lambda-workspace`（新規作成）

- [x] Lambda の基本概念を理解
- [x] Hono を Lambda ハンドラーとして動作させる（`hono/aws-lambda` の `handle()` でラップ、esbuild で ESM バンドル）
- [x] API Gateway と連携してエンドポイントを公開（HTTP API v2、Lambda 統合、疎通確認済み）
- [x] ECS との比較 — コスト・コールドスタート・ユースケース

---

## Phase 8: React 18 / 19 の理解（5/12〜5/15）

### React 18（Next.js で使う機能）

> `createRoot` / `hydrateRoot` / ストリーミング API は Next.js が内部処理するため対象外

- [x] `useTransition` / `startTransition` — 緊急度の低い更新を後回しにして UI の応答性を保つ（例: 検索入力しながら結果を更新）
- [x] `useDeferredValue` — 値の反映を遅延させる（`useTransition` の値版。リスト絞り込みなどに使う）
- [x] `useId` — SSR/CSR で一致する一意 ID を生成（`htmlFor` / `aria-describedby` などに使う）
- [x] 自動バッチング — 複数の setState が1レンダーにまとまる仕組みを把握（意図せず依存している箇所を見つけるため）
- [x] StrictMode の挙動変化 — 開発時に `useEffect` が2回実行される理由と対処法を把握
- [x] Suspense の使い方 — `loading.tsx` に任せず自分で `<Suspense>` を書く場面を理解

### React 19（Next.js で使う機能）

> `preload` / `preinit` / スタイルシート優先度 は Next.js の `<Image>` / `<Script>` で代替されるため対象外
> RSC / Server Actions は Phase 1 で習得済みのため概念整理のみ

- [x] Actions の概念 — transition 内の非同期関数が Action。`useActionState` / `useOptimistic` の設計の前提となる仕組みを把握
- [x] `useActionState` — フォーム送信の pending / error / result を1フックで管理（Server Actions と組み合わせる）
- [x] `<form action={fn}>` — フォームの `action` に Server Actions を渡す（`onSubmit` 不要）
- [x] `useFormStatus` — 送信ボタンなど子コンポーネントが親フォームの pending を参照
- [ ] `useOptimistic` — リクエスト完了前に UI を先行更新し、失敗時に自動ロールバック
- [ ] `use(promise)` — Client Component のレンダー中にプロミスを読む（条件分岐内でも使える点が他フックと違う）
- [ ] `ref` が props に — `forwardRef` 廃止。コンポーネント定義の簡素化を体験
- [ ] `<Context>` がプロバイダに — `<ThemeContext.Provider>` → `<ThemeContext>` への書き換え
- [ ] メタデータサポート — コンポーネント内で `<title>` / `<meta>` をレンダーすると自動で `<head>` に移動（Next.js の `metadata` export との使い分けを把握）

---

## Phase 9: TanStack Start（5/15〜5/18）

- [ ] TanStack Start の基本概念を理解
- [ ] Next.js App Router との比較

---

## Phase 10: Vite +（5/19〜5/21）

- [ ] Vite の基本概念を理解
- [ ] Next.js との違い・使い分けを整理

---

## Phase 11: neverthrow（5/22〜5/26）

- [ ] neverthrow の基本（`Result` 型・`ok` / `err`）
- [ ] Hono のルートハンドラーで neverthrow を使ったエラーハンドリング

---

## Phase 12: Effect（5/27〜5/31）

- [ ] Effect の基本概念を理解
- [ ] Hono との組み合わせで実用的なパターンを試す

---

## 参考

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Hono ドキュメント](https://hono.dev)
- [AWS ECS ドキュメント](https://docs.aws.amazon.com/ecs)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
