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

## 現在の状況（Phase 4: AWS — EC2 デプロイ 進行中）

Phase 3.5（PostgreSQL 移行）完了。Phase 4 として EC2 への直接デプロイから始める方針。

### 方針

- まず EC2 に Docker で直接デプロイして AWS の基本を掴む
- その後 ECS / ECR を使った本格運用構成へ移行

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
- `docker-compose.yml` の `nextjs` サービスから `target: builder` / `volumes` / `command` を削除（standalone 対応）
- `hono-api/Dockerfile` に `COPY nextjs/package.json ./nextjs/` 追加 → pnpm がワークスペース全体の依存グラフを正しく解決し `pg` が drizzle-orm にリンクされる
- Docker anonymous volume のキャッシュ問題 → `docker compose down -v` で解決

---

## 補足・用語解説

### AWS 全般

**ルートアカウントを使わない理由**
AWS にはメールアドレスでログインする「ルートアカウント」がある。全権限を持つため漏洩すると致命的。日常的な操作は IAM ユーザーを作って行うのが基本。

**IAM（Identity and Access Management）**
AWS のアクセス権限管理サービス。「誰が何をできるか」を定義する。
- **IAM ユーザー**: 人や CLI ツールが使うアカウント
- **IAM ポリシー**: 権限の定義（例: S3 の読み取りのみ許可）
- **IAM ロール**: EC2 や GitHub Actions など「人以外」に権限を与える仕組み

**アクセスキーとシークレットキー**
CLI や GitHub Actions が AWS を操作するための認証情報。パスワードと同じ扱いで厳重に管理する。漏洩したらすぐ無効化して再発行。

### デプロイパターン

**EC2 + CodeDeploy パターン**
- EC2: 仮想サーバー。自分で管理する（OS・Docker のインストール等も自分で行う）
- CodeDeploy: AWS のデプロイ自動化サービス。EC2 上の CodeDeploy エージェントが S3 から成果物を取得して実行する
- 流れ: `GitHub Actions → S3 に成果物 upload → CodeDeploy → EC2 にデプロイ`

**ECS + ECR パターン**
- ECR: Docker イメージを保存する AWS のレジストリ（Docker Hub の AWS 版）
- ECS: コンテナを動かすサービス。サーバー管理不要（Fargate モード）
- 流れ: `GitHub Actions → ECR に push → ECS が自動で pull・起動`

### 次回やること：IAM セットアップ → EC2 起動

```bash
# IAM アクセスキー発行後、ターミナルで実行
aws configure
# → Access Key ID / Secret Access Key / ap-northeast-1 / json を入力

# 設定確認
aws sts get-caller-identity
```

その後：
1. EC2 インスタンス起動（Amazon Linux 2023 / t2.micro）
2. SSH 接続して Docker をインストール
3. リポジトリを clone して `docker compose up --build`
4. セキュリティグループでポート 3000 / 3001 を開放して疎通確認
