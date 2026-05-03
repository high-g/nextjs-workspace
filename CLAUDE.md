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

## 現在の状況（Phase 6: Cloudflare デプロイ 進行中 — 5/3）

Workers デプロイ・D1 連携まで完了。残りは Cloudflare Pages への Next.js デプロイ。

### リポジトリ構成

- `nextjs-workspace`: Docker + AWS（本リポジトリ）
- `cloudflare-workspace`: Cloudflare Workers / D1 / Pages（新規作成）
- `lambda-workspace`: AWS Lambda + API Gateway（新規作成）

### 方針

- 4/29〜5/5: Cloudflare デプロイ（Workers → D1 → Pages の順）
- 5/6〜5/8: AWS Lambda + API Gateway
- 5/9: Vercel デプロイ
- 5/10〜5/12: Next.js 16.2 の理解
- 5/13〜5/15: React 19 の理解
- 5/16〜5/17: Vite+
- 5/18〜: TanStack Start / neverthrow / Effect

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

## 補足・用語解説

### Cloudflare

**Cloudflare Workers**
サーバーレスで動く JavaScript/TypeScript の実行環境。Node.js ではなく V8 アイソレートベースなので、Node.js の API（`fs` / `net` / TCP など）は使えない。`pg`（TCP 接続）が動かないため DB は D1 や Neon（HTTP ベース）を使う。Hono は最初から Workers に対応しており、`export default app` でそのままデプロイできる。

**Cloudflare D1**
Cloudflare が提供する SQLite 互換のサーバーレス DB。Workers から `env.DB`（バインディング）経由でアクセスする。Drizzle が D1 をサポート（`drizzle-orm/d1`）。`wrangler d1 create <name>` で作成、`wrangler d1 migrations apply` でマイグレーション実行。PostgreSQL と違い SQLite ベースなので `pg-core` → `sqlite-core` へのスキーマ変更が必要。

**Wrangler**
Cloudflare の CLI ツール。`wrangler login` でブラウザ認証、`wrangler dev` でローカル開発、`wrangler deploy` でデプロイ。`wrangler.toml` がプロジェクト設定ファイル（AWS でいう `serverless.yml` に相当）。

**バインディング（Bindings）**
Workers が外部リソース（D1 / KV / R2 など）にアクセスするための仕組み。`wrangler.toml` で定義し、ハンドラーの第2引数 `env` 経由でアクセスする。Hono では `c.env.DB` のように型付きで使える。

**Workers のエントリーポイント**
Node.js の `http.createServer` に相当するものが Workers では `fetch` ハンドラー。Hono は `app.fetch` を持つため `export default app` でそのままエントリーポイントになる。

**Cloudflare Pages**
静的サイトおよび SSR アプリのホスティングサービス。Next.js は `@cloudflare/next-on-pages` を使ってデプロイする。Edge Runtime 制約（Node.js API 不可）があるため、既存の Next.js コードが動かない箇所が出ることがある。

**なぜ Workers と ECS でコードが異なるのか**
ECS（Fargate）は通常の Node.js プロセスを Docker コンテナで動かす。Workers は V8 アイソレートという全く別の実行環境。Node.js の API が使えない制約がある代わりに、コールドスタートがほぼゼロ・グローバルエッジ配信・無料枠が広いというメリットがある。



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
`~/.aws/credentials` に保存される。複数プロファイル（`[default]` / `[ecr]` 等）を持てるが、プロファイル指定がなければ `[default]` が使われる。

**IAM ポリシー vs ロールの違い**
- **ポリシー**: 「何ができるか」を定義した JSON ドキュメント。単体では機能しない。
- **ロール**: ポリシーを束ねて「誰かに渡せる」パッケージ。「誰が使えるか（信頼ポリシー）」も持つ。
  - EC2・Lambda・ECS・GitHub Actions など「人以外」に権限を与えるために使う
  - 名前に「ロール」とあれば IAM ロールのこと（AWS 全体で共通の概念）

**インスタンスプロファイル**
IAM ロールを EC2 に直接アタッチできないため存在する中間の入れ物。
EC2 → インスタンスプロファイル → IAM ロール という構造になっている。
ロールを削除する前にプロファイルから外す必要がある（`remove-role-from-instance-profile`）。

**STS（Security Token Service）**
「今この CLI を使っているのは誰か」を返すサービス。
`aws sts get-caller-identity` で認証確認に使う。AssumeRole（他のロールへの切り替え）もここ経由。

### ネットワーク・Linux 基礎

**VPC（Virtual Private Cloud）**
AWSの中に作る自分専用の仮想ネットワーク。CIDR（例: `10.0.0.0/16`）でIPアドレス範囲を定義し、サブネットで細分化する。

**CIDR（Classless Inter-Domain Routing）**
IPアドレスの範囲を表す記法。`/16` = 65,536個、`/24` = 256個、`/32` = 1個。数字が大きいほど範囲が狭い。
セキュリティグループで `0.0.0.0/0` は「全IPを許可」、`x.x.x.x/32` は「特定の1IPのみ許可」。

**NAT（Network Address Translation）**
プライベートサブネットのEC2がインターネットに出るための仕組み。内→外は可能、外→内は不可（一方通行）。自宅ルーターと同じ仕組み。

**NACL（Network Access Control List）**
サブネット単位のファイアウォール。ステートレス（行きと帰りを個別に許可する必要あり）。実務ではデフォルト（全許可）のまま使い、セキュリティグループで制御するのが基本。

**ステートフル vs ステートレス**
- ステートフル（セキュリティグループ）: 通信の状態を覚えている。インバウンドを許可すれば戻り通信は自動許可。
- ステートレス（NACL）: 毎回ゼロから判断。行きと帰りを両方明示的に設定する必要がある。

**ARN（Amazon Resource Name）**
AWSリソースを一意に識別するID。形式: `arn:aws:サービス:リージョン:アカウントID:リソース`。
IAMポリシーでリソースを指定する時や、ログでリソースを特定する時に使う。読み方は「アーン」。

### Linux・SSH 基礎

**chmod の数字表記**
`r=4, w=2, x=1` の足し算。`400` = 所有者のみ読み取り可（秘密鍵に使う）、`644` = 所有者が読み書き可・他は読み取りのみ、`777` = 全員が全操作可（危険）。

**キーペア（SSH）**
EC2接続のための公開鍵・秘密鍵のペア。秘密鍵（`.pem`）はダウンロード後 `chmod 400` で保護する。`chmod 400` にしないとSSHが「鍵が危険」として拒否する。

**systemctl**
Linuxのサービス（常駐プロセス）を管理するコマンド。`start` で起動、`enable` でOS起動時の自動起動設定。セットで使うのが基本。

**usermod -aG**
ユーザーをグループに追加するコマンド。`-a`（追加）`-G`（グループ指定）。Dockerを `sudo` なしで使うには `ec2-user` を `docker` グループに追加する。反映にはSSH再接続が必要。

**yum**
Amazon Linux（Red Hat系）のパッケージマネージャー。Mac の `brew`、Ubuntu の `apt` と同じ役割。

**PATH と `/usr/local/bin`**
`/usr/local/bin` は PATH に含まれているため、ここにバイナリを置くとコマンド名だけで実行できる。`chmod +x` で実行権限を付与する必要がある。

### デプロイパターン

**EC2 + CodeDeploy パターン**
- EC2: 仮想サーバー。自分で管理する（OS・Docker のインストール等も自分で行う）
- CodeDeploy: AWS のデプロイ自動化サービス。EC2 上の CodeDeploy エージェントが S3 から成果物を取得して実行する
- 流れ: `GitHub Actions → S3 に成果物 upload → CodeDeploy → EC2 にデプロイ`

**ECS + ECR パターン**
- ECR: Docker イメージを保存する AWS のレジストリ（Docker Hub の AWS 版）
- ECS: コンテナを動かすサービス。サーバー管理不要（Fargate モード）
- 流れ: `GitHub Actions → ECR に push → ECS が自動で pull・起動`

### Docker イメージ最適化

**マルチステージビルド**
Dockerfile 内で複数の `FROM` を使い、ビルド用と本番用のステージを分ける手法。
- `AS builder` でビルドステージに名前をつける
- 本番ステージで `COPY --from=builder` して必要なファイルだけ取り出す
- ビルドツール（python・make・g++ 等）や devDependencies が本番イメージに含まれなくなる

**`pnpm install --prod`**
`devDependencies` を除外してインストールするオプション。本番で不要な `drizzle-kit`・`typescript`・`@types/*` 等が入らなくなる。
`tsx` が devDependencies にあると `--prod` 後に使えないため、本番で必要なツールは `dependencies` に入れる必要がある。

**Dockerfile vs Dockerfile.dev の使い分け**
- `Dockerfile`: ECS 本番用。`--prod` インストール・`tsx src/index.ts` で起動
- `Dockerfile.dev`: ローカル dev 用。フル deps・`pnpm dev`（tsx watch）で起動
- `docker-compose.yml` は `Dockerfile.dev` を参照してローカル開発に使う

**Docker レイヤー**
Dockerfile の各命令（`FROM` / `RUN` / `COPY` 等）が1つのレイヤーになる。
`docker push` はレイヤーごとに並行アップロードするため、変更のないレイヤーはスキップされる（キャッシュが効く）。

**ECR レジストリ URI**
`{アカウントID}.dkr.ecr.{リージョン}.amazonaws.com` の形式。
Docker Hub の代わりに ECR を使う場合、`docker push` 先にこの URI を指定する。
`aws ecr get-login-password | docker login` で認証してから push する。

### S3・CodeDeploy 関連

**S3 バケット**
- S3 の保存領域の単位。バケット名はグローバル（全世界・全アカウント）で一意である必要がある
- アカウントID をバケット名に含めるのが慣習（例: `nextjs-deploy-artifacts-513148686116`）
- 今回の用途: GitHub Actions がデプロイ成果物（zip）を置く場所として使用

**CodeDeploy エージェント**
- EC2 上で常駐する Ruby 製のプロセス
- AWS CodeDeploy サービスに定期的に「デプロイ指示来てる？」と問い合わせる（ポーリング）
- インストール方法: AWS 公式 S3 バケット（`aws-codedeploy-ap-northeast-1`）からスクリプトをダウンロードして実行

**インプレースデプロイ vs Blue/Green デプロイ**
- インプレース: 既存のEC2インスタンスを停止 → 新しいコードで起動（シンプル・ダウンタイムあり）
- Blue/Green: 新しいインスタンスを別途用意して切り替え（ダウンタイムなし・コスト高）
- 学習用途ではインプレースで十分

**CodeDeploy ライフサイクルイベントの順番**
```
BeforeInstall  → スクリプト実行（例: ディレクトリ削除・.env 退避）
Install        → S3 の zip を destination に展開（CodeDeploy が自動実行）
AfterInstall   → スクリプト実行（例: docker-compose up）
```
`runas` でスクリプトの実行ユーザーを指定できる。既存ファイルの削除は `root`、アプリ操作は `ec2-user` が基本。

**CodeDeploy ログの読み方**
ログファイル: `/var/log/aws/codedeploy-agent/codedeploy-agent.log`
- ログレベル（INFO/WARN/ERROR）だけでなく `"command_status":"Failed"` や `[stderr]` も探す
- `[stderr]` の後が実際のエラー内容（例: `docker: 'compose' is not a docker command`）

**stdout vs stderr**
- `stdout`（標準出力）: 正常な出力
- `stderr`（標準エラー出力）: エラーメッセージの出力
- `2>/dev/null`: stderr を捨てる（エラーを無視する）
- `|| true`: コマンドが失敗しても `set -e` でスクリプトが止まらないようにする

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

### 完了済み：Cloudflare Workers + D1 デプロイ（cloudflare-workspace）

- Hono API を Workers としてデプロイ済み（`export default app` 形式に変更）
- D1 データベース作成済み（`wrangler d1 create`）
- Drizzle スキーマを `pg-core` → `sqlite-core` に変更済み
- `src/lib/drizzle.ts` を D1 バインディング用（`drizzle-orm/d1`）に変更済み
- マイグレーション・シード実行済み
- `pnpm wrangler deploy` でデプロイ・疎通確認済み

### 次回やること：Cloudflare Pages デプロイ（`cloudflare-workspace` で作業）

1. **`@cloudflare/next-on-pages` インストール**
   ```bash
   pnpm add -D @cloudflare/next-on-pages vercel
   ```

2. **`next.config.ts` に next-on-pages プラグインを追加**
   ```ts
   import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
   if (process.env.NODE_ENV === 'development') {
     await setupDevPlatform();
   }
   // withNextOnPages を wrap するか、または単純に設定追加
   ```

3. **各 page/route に Edge Runtime を宣言**（Node.js API を使う箇所は対応が必要）
   ```ts
   export const runtime = 'edge';
   ```

4. **`wrangler.toml` に Pages 用設定を追記**
   ```toml
   name = "nextjs-app"
   pages_build_output_dir = ".vercel/output/static"
   compatibility_date = "2024-01-01"
   compatibility_flags = ["nodejs_compat"]
   ```

5. **`package.json` にビルドスクリプト追加**
   ```json
   "pages:build": "next-on-pages",
   "pages:deploy": "wrangler pages deploy"
   ```

6. **ビルド & デプロイ**
   ```bash
   pnpm pages:build
   pnpm pages:deploy
   ```
