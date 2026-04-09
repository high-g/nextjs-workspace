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
- [x] DevContainer を使った開発環境構築
  - [x] `.devcontainer/hono-api/devcontainer.json` と `.devcontainer/nextjs/devcontainer.json` を作成（2サービス対応）
  - [x] `docker-compose.yml` を DevContainer から参照する設定
  - [x] `docker-compose.yml` に `volumes` を追加してホットリロード対応
  - [x] VS Code でコンテナ内に入って開発できることを確認
  - [x] 拡張機能・設定を `devcontainer.json` に記述して再現性を確認

---

## Phase 3.5: PostgreSQL 移行

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

## Phase 4: AWS

### 準備・IAM（SAA: IAM）

- [x] IAM ユーザー作成・アクセスキー発行
- [x] AWS CLI セットアップ（`aws configure`）
- [x] IAM の基本概念を理解 — ユーザー・グループ・ロール・ポリシーの関係
- [x] インスタンスプロファイルとは何か（EC2 へのロールアタッチの仕組み）
- [ ] 最小権限の原則 — FullAccess vs カスタムポリシーの使い分け

### ネットワーク基礎（SAA: VPC）

- [x] VPC の概念を理解 — リージョン・AZ・サブネットの関係
- [x] パブリックサブネット vs プライベートサブネットの違い
- [x] インターネットゲートウェイ（IGW）と NATゲートウェイの役割
- [x] セキュリティグループ vs NACL の違い（ステートフル vs ステートレス）
- [ ] ルートテーブルの仕組みを理解

### パターン1: EC2 + CodeDeploy（SAA: EC2・S3）

- [x] EC2 インスタンス起動（Amazon Linux 2023 / t3.micro）
  - [x] AMI とは何か — スナップショットとの違い
  - [x] EBS ボリュームの種類（gp2/gp3/io1）と用途
  - [x] インスタンスタイプの選び方（t系・m系・c系の違い）
- [ ] EC2 に Docker / Docker Compose / CodeDeploy エージェントをインストール
  - [x] Docker インストール（yum）・起動・自動起動設定
  - [x] Docker Compose インストール（GitHub から直接ダウンロード）
  - [x] buildx インストール（docker-compose up --build に必要）
  - [x] スワップ追加（2GB）— t3.micro のメモリ不足対策
  - [x] Prisma 削除（PostgreSQL + Drizzle 構成に統一）
  - [ ] ローカルの変更を push → EC2 で git pull → `docker-compose up --build` で起動確認
- [ ] セキュリティグループでポート開放（22 / 3000 / 3001）
- [ ] S3 バケット作成（デプロイ成果物置き場）
  - [ ] S3 の基本概念 — バケット・オブジェクト・プレフィックス
  - [ ] ストレージクラスの種類（Standard / IA / Glacier）と使い分け
  - [ ] バージョニング・ライフサイクルポリシーの概念
  - [ ] バケットポリシー vs ACL の違い
- [ ] CodeDeploy アプリケーション・デプロイグループ作成
- [ ] `appspec.yml` と デプロイスクリプト作成
- [ ] GitHub Actions ワークフロー作成
  - [ ] Docker イメージをビルド
  - [ ] 成果物を S3 に upload
  - [ ] CodeDeploy デプロイを起動
- [ ] push をトリガーに EC2 へ自動デプロイされることを確認
- [ ] ブラウザから EC2 パブリック IP でアクセス確認
- [ ] Auto Scaling の概念を理解 — 起動テンプレート・スケーリングポリシー

### パターン2: ECS + ECR（SAA: ECS・ALB・CloudFront）

- [ ] ECS / ECR / ALB の基本構成を理解
- [ ] ECR リポジトリ作成
- [ ] ECS タスク定義・サービス作成
  - [ ] タスクロール vs タスク実行ロールの違い
  - [ ] Fargate vs EC2 起動タイプの比較
- [ ] GitHub Actions でビルド → ECR push → ECS 自動デプロイ
- [ ] ALB でロードバランシング
  - [ ] ALB / NLB / CLB の使い分け
  - [ ] ターゲットグループ・ヘルスチェックの仕組み
- [ ] 独自ドメイン + HTTPS（Route 53 + ACM）
  - [ ] Route 53 のレコードタイプ（A / CNAME / Alias）の違い
  - [ ] ACM 証明書の仕組みと自動更新
- [ ] CloudFront を使った CDN 配信
  - [ ] オリジン・ディストリビューション・キャッシュの概念
  - [ ] S3 静的ホスティング + CloudFront の構成

### サーバーレス・マネージドサービス（SAA: Lambda・RDS・DynamoDB）

- [ ] Lambda の基本 — イベント駆動・コールドスタートの概念
  - [ ] API Gateway + Lambda で簡単な API を作る
  - [ ] Lambda の同時実行数・タイムアウト・メモリ設定
- [ ] RDS の基本概念
  - [ ] マルチAZ配置 vs リードレプリカの違い
  - [ ] RDS vs Aurora の使い分け
  - [ ] 自動バックアップ・スナップショットの仕組み
- [ ] DynamoDB の基本
  - [ ] パーティションキー・ソートキーの設計
  - [ ] RDS（リレーショナル）との使い分け基準
  - [ ] オンデマンド vs プロビジョンドキャパシティ

### メッセージング・監視（SAA: SQS・SNS・CloudWatch）

- [ ] SQS の基本 — キュー・メッセージの概念
  - [ ] スタンダードキュー vs FIFO キューの違い
  - [ ] デッドレターキュー（DLQ）の役割
- [ ] SNS の基本 — トピック・サブスクリプションの概念
  - [ ] SNS + SQS のファンアウトパターン
- [ ] CloudWatch でメトリクス・ログを確認
  - [ ] アラーム・ダッシュボードの設定
  - [ ] CloudTrail との違い（操作ログ vs メトリクス）

### セキュリティ（SAA: KMS・Secrets Manager・WAF）

- [ ] KMS の基本 — 暗号化キーの管理
  - [ ] S3 / RDS の暗号化との連携
- [ ] Secrets Manager vs SSM Parameter Store の使い分け
- [ ] WAF の基本概念 — ALB / CloudFront との組み合わせ
- [ ] Shield の概念（DDoS 対策）

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
