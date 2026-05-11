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

### 進め方

- ROADMAP.md に沿ってカリキュラムを順番に進める

---

## 現在の状況（Phase 8: React 19 の理解 進行中 — 5/11〜5/13）

Phase 7 AWS Lambda + API Gateway 完了（Lambda 実装・API Gateway 疎通・ECS 比較整理まで完了）。現在は Phase 8 React 19 の理解を開始。

### リポジトリ構成

- `nextjs-workspace`: Docker + AWS（本リポジトリ）
- `cloudflare-workspace`: Cloudflare Workers / D1 / Pages（新規作成）
- `lambda-workspace`: AWS Lambda + API Gateway（新規作成）

### 方針

- 4/29〜5/5: Cloudflare デプロイ（Workers → D1 → Pages の順）
- 5/6〜5/10: AWS Lambda + API Gateway
- 5/11〜5/13: React 19 の理解
- 5/14〜5/17: TanStack Start
- 5/18〜5/21: Vite+
- 5/22〜5/26: neverthrow（Honoで扱う場合を考えながら）
- 5/27〜5/31: Effect（Honoで扱う場合を考えながら）

### 構成

```
nextjs-workspace/
├── hono-api/
│   ├── drizzle/
│   │   ├── schema.ts      # pg-core に変更済み
│   │   └── seed.ts        # node-postgres に変更済み
│   ├── drizzle.config.ts  # dialect: "postgresql" に変更済み
│   ├── src/lib/drizzle.ts # node-postgres に変更済み
│   ├── Dockerfile         # 本番用（マルチステージ・--prod・tsx で起動）
│   ├── Dockerfile.dev     # ローカル dev 用（フル deps・pnpm dev）
│   └── package.json       # tsx を dependencies に移動済み
├── nextjs/
├── .devcontainer/
│   ├── hono-api/devcontainer.json
│   └── nextjs/devcontainer.json
├── .env                   # 機密情報（gitignore 済み）
├── .env.example           # 項目のみコミット
├── docker-compose.yml     # Dockerfile.dev を参照（ローカル dev 用）
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
- `docker-compose.yml` の `nextjs` サービスから `target: builder` / `volumes` / `command` を削除（standalone 対応）
- `hono-api/Dockerfile` に `COPY nextjs/package.json ./nextjs/` 追加 → pnpm がワークスペース全体の依存グラフを正しく解決し `pg` が drizzle-orm にリンクされる
- Docker anonymous volume のキャッシュ問題 → `docker compose down -v` で解決
- `hono-api/Dockerfile` が 928MB → マルチステージビルド + `--prod` で 483MB に削減
- `pnpm dev`（tsx watch）を本番イメージで使っていた → `tsx src/index.ts`（watch なし）に修正
- `moduleResolution: "bundler"` + `tsc` ビルドは Node.js ESM で `.js` 拡張子が必要なため動かない → tsx を本番でそのまま使う方針に
- `tsx` が devDependencies だと `--prod` インストール後に使えない → dependencies に移動
- Dockerfile をローカル dev 用（`Dockerfile.dev`）と本番用（`Dockerfile`）に分離 → docker-compose は `Dockerfile.dev` を参照

---

### 完了済み：IAM セットアップ

```bash
# 設定確認（完了済み）
aws sts get-caller-identity
# → nextjs-user の ARN が返ってくれば OK
```

- IAM ユーザー `nextjs-user` 作成済み
- ポリシー: AmazonEC2FullAccess / AmazonS3FullAccess / AWSCodeDeployFullAccess / IAMReadOnlyAccess
- `~/.aws/credentials` の `[default]` プロファイルに設定済み

### 完了済み：EC2 起動・Docker セットアップ

- EC2 インスタンス `nextjs-server`（Amazon Linux 2023 / t3.micro）起動済み
- SSH 接続確認済み（キーペア: `~/.ssh/nextjs-server-key.pem`、パーミッション: 400）
- Docker インストール・起動・自動起動設定済み（`systemctl enable docker`）
- `ec2-user` を `docker` グループに追加済み（`sudo` なしで `docker` 使用可能）
- Docker Compose（v5.1.2）インストール済み（`/usr/local/bin/docker-compose`）
- buildx（v0.23.0）インストール済み（`/usr/local/lib/docker/cli-plugins/docker-buildx`）
- リポジトリ clone 済み・`.env` 作成済み

### 完了済み：スワップ追加・Prisma 削除

- スワップ 2GB 追加済み（`/swapfile`）— t3.micro のメモリ不足対策
- Prisma を削除して PostgreSQL + Drizzle 構成に統一
  - 削除: `hono-api/src/routes/prismaPosts.ts` / `src/lib/prisma.ts` / `src/generated/` / `prisma/` / `prisma.config.ts`
  - `hono-api/src/index.ts` を Drizzle のみに変更
  - `hono-api/package.json` から Prisma 関連パッケージを削除
  - `docker-compose.yml` の command から `prisma migrate deploy` / `seed:prisma` を削除
  - `hono-api/Dockerfile` から Prisma 関連の COPY・コマンドを削除
- ルートを `.route("/", drizzlePostRoutes)` に変更（Hono RPC では `client.index.$get()` でアクセス）

### 完了済み：EC2 デプロイ・疎通確認

- ポート 3000 / 3001 をセキュリティグループで開放済み
- `http://13.193.222.75:3000` でNext.js画面の表示確認済み
- Hono API 経由で PostgreSQL への登録・取得も確認済み

### 完了済み：CodeDeploy セットアップ（4/11 時点）

- S3 バケット作成済み（`nextjs-deploy-artifacts-513148686116`、ap-northeast-1）
- CodeDeploy エージェントを EC2 にインストール・起動確認済み（`systemctl status codedeploy-agent`）
- IAM ロール作成済み
  - `CodeDeployRole`: CodeDeployサービスがEC2を操作するためのロール（`AWSCodeDeployRole` ポリシー）
  - `EC2CodeDeployRole`: EC2がS3からzipを取得するためのロール（`AmazonS3ReadOnlyAccess` / `AmazonEC2RoleforAWSCodeDeploy`）
- `nextjs-server` インスタンスに `EC2CodeDeployRole` をアタッチ済み
- CodeDeploy アプリケーション `nextjs-app` 作成済み
- デプロイグループ `nextjs-deploy-group` 作成済み（インプレース / EC2タグ: Name=nextjs-server / ロードバランサーなし）
- SSH 接続ショートカット設定済み（`~/.ssh/config` に `Host nextjs-server` 追加）

### 完了済み：CodeDeploy 自動デプロイ（4/11〜4/15）

- `appspec.yml` 作成済み（`overwrite: yes` / `BeforeInstall` + `AfterInstall` フック）
- `scripts/before_install.sh` 作成済み（`.env` を退避してディレクトリ削除・復元）
- `scripts/deploy.sh` 作成済み（`docker-compose down && docker-compose up --build -d`）
- `.github/workflows/deploy.yml` 作成済み（zip → S3 → CodeDeploy）
- GitHub Secrets に `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` 登録済み
- push をトリガーに EC2 へ自動デプロイ確認済み（`http://13.193.222.75:3000` で表示確認）

### 解決済み（CodeDeploy 構築中）

- `The deployment failed because a specified file already exists` → `appspec.yml` に `overwrite: yes` 追加 + `before_install.sh` でディレクトリ削除
- `docker: 'compose' is not a docker command` → EC2 は docker-compose V1 のため `docker-compose`（ハイフン）に修正
- `.env not found` → `before_install.sh` で `.env` を `/tmp` に退避してから削除・復元
- `rm: Permission denied` → `before_install.sh` の `runas` を `root` に変更
- SSH タイムアウト → 自分のIPが変わったためセキュリティグループを `0.0.0.0/0` に変更（学習用途）

### 完了済み：ECR セットアップ（4/17〜4/18）

- ECR レジストリ URI: `513148686116.dkr.ecr.ap-northeast-1.amazonaws.com`
- ECR リポジトリ作成済み（`hono-api` / `nextjs-app`、ミュータブル・AES-256）
- IAM ロール `ecsTaskExecutionRole` 作成済み（`AmazonECSTaskExecutionRolePolicy`）
- `nextjs-user` に `AmazonEC2ContainerRegistryFullAccess` / `AmazonECS_FullAccess` 追加済み
- `hono-api/Dockerfile` マルチステージビルド化（928MB → 483MB）
- `hono-api/Dockerfile.dev` 作成・`docker-compose.yml` を Dockerfile.dev に変更済み
- hono-api / nextjs-app イメージを ECR に push 済み

### 完了済み：ECS + ECR デプロイ（4/16〜4/28）

- ECS クラスター `nextjs-cluster` 作成済み（Fargate）
- タスク定義 `nextjs-task` 作成済み（CPU 0.25vCPU・メモリ 0.5GB）
- セキュリティグループ `nextjs-sg`（ポート 3000/3001/5432 開放済み）
- ECS サービス `nextjs-service` 作成済み（Circuit Breaker オフ）
- DB 接続先: EC2 `nextjs-server` の PostgreSQL（`172.31.45.172:5432`）
- `.github/workflows/deploy-ecs.yml` 作成済み（`--platform linux/amd64`）
- push → GitHub Actions → ECR push → ECS 自動デプロイ確認済み

### 解決済み（ECS 構築中）

- `exec format error` → Apple Silicon でビルドしたイメージが arm64 になっていた → `--platform linux/amd64` で解決（GitHub Actions の runner は native amd64 なので自動解決）
- `Cannot find module '/app/node_modules/.bin/tsx'` → pnpm ワークスペースでは tsx の binary は `hono-api/node_modules/.bin/` に置かれる → CMD を `["../node_modules/.bin/tsx", ...]` から `["node_modules/.bin/tsx", ...]` に変更
- タスク定義のイメージが SHA256 ダイジェストに固定されていた → `:latest` タグに変更
- `ENOTFOUND postgres` → ECS に PostgreSQL コンテナがいない → EC2 の docker-compose で PostgreSQL を起動し EC2 プライベート IP を DATABASE_URL に設定
- EC2 ディスク満杯 → `docker system prune -a` で不要イメージを削除
- `relation "posts" does not exist` → 新規 DB なのでマイグレーション未実行 → EC2 で `docker-compose run --rm hono-api sh -c "pnpm exec drizzle-kit migrate && pnpm seed:drizzle"` を実行
- Turbopack が QEMU エミュレーション下でクラッシュ → GitHub Actions（native amd64）でビルドすることで解決

### 完了済み：Cloudflare デプロイ全般（cloudflare-workspace）

**Workers + D1**
- Hono API を Workers としてデプロイ済み（`export default app` 形式に変更）
- D1 データベース作成済み（`wrangler d1 create`）
- Drizzle スキーマを `pg-core` → `sqlite-core` に変更済み
- `src/lib/drizzle.ts` を D1 バインディング用（`drizzle-orm/d1`）に変更済み
- マイグレーション・シード実行済み
- `pnpm wrangler deploy` でデプロイ・疎通確認済み

**Cloudflare Pages（Next.js デプロイ）**
- `@cloudflare/next-on-pages`（OpenNext 経由）でデプロイ済み
- Edge Runtime 対応（各 page/route に `export const runtime = 'edge'` 宣言）
- Route Handlers / Server Components / Server Actions の疎通確認済み

### 完了済み：AWS Lambda + API Gateway（5/6〜5/10）

- リポジトリ初期化（`pnpm init`、`.gitignore` 追加）
- 依存パッケージインストール（`hono`、`@types/aws-lambda`、`tsx`、`esbuild`）
- `src/index.ts` 作成（Hono × Lambda ハンドラー、`hono/aws-lambda` の `handle()` でラップ）
- esbuild でバンドル（ESM 形式、`dist/index.mjs`）
- zip 化（`dist/function.zip`）
- IAM ロール作成（`lambda-hono-role`、`AWSLambdaBasicExecutionRole` ポリシー）
- Lambda 関数作成・zip アップロード（`hono-api`、Node.js 24.x）
- API Gateway（HTTP API v2）作成・Lambda 統合・エンドポイント公開
- `curl https://wl23aup7d5.execute-api.ap-northeast-1.amazonaws.com/posts` で `{"posts":[]}` の疎通確認済み

### 完了済み：ECS との比較整理（Phase 7 最終タスク）

- コスト: Lambda はリクエスト課金（アイドル時ゼロ）、ECS は常時起動課金
- コールドスタート: Lambda は一定時間未使用で数百ms〜数秒の遅延が発生、ECS はなし
- ユースケース: Lambda → 散発的リクエスト・イベント駆動、ECS → 常時接続・WebSocket・長時間処理

### 次回やること：Phase 8: React 19 の理解（5/11〜5/13）

- React 19 の新機能を把握（Actions・use フック など）
- Next.js App Router との関係を整理
- 参考: [React 19 リリースノート](https://react.dev/blog/2024/12/05/react-19)
