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
AWS SAA（Solutions Architect Associate）合格もモチベーションに追加。ROADMAP.md に SAA 対応項目を各 Phase に組み込み済み。

### 方針

- まず EC2 に Docker で直接デプロイして AWS の基本を掴む
- その後 ECS / ECR を使った本格運用構成へ移行
- 実践を通じて SAA の試験範囲（VPC・EC2・S3・RDS・Lambda 等）を習得する

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

### 次回やること：docker-compose up --build の完了 → 疎通確認

t3.micro のメモリ不足で `docker-compose up --build` が途中で止まった。
まずスワップを追加してからビルドを再実行する。

```bash
# SSH 接続
ssh -i ~/.ssh/nextjs-server-key.pem ec2-user@13.193.222.75

# スワップ追加（メモリ不足対策）
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# スワップ確認
free -h

# ビルド再実行
cd nextjs-workspace
docker-compose up --build
```

ビルド成功後：
1. セキュリティグループでポート 3000 / 3001 を開放
2. ブラウザから `http://13.193.222.75:3000` でアクセス確認
