# 補足・用語解説

学習中に出てきた概念・設定の「なぜ」を記録するメモ。

---

## SST v3

**SST（Serverless Stack）とは**
AWS へのデプロイを Wrangler 的な手軽さで実現するフレームワーク。OpenNext を内蔵しており、Next.js を Lambda + CloudFront 構成にワンコマンドでデプロイできる。インフラを TypeScript で定義する（AWS CDK のラッパー）。

```bash
npx create-sst@latest
sst deploy   # デプロイ
sst dev      # ローカル開発（実際の AWS リソースに接続）
```

```ts
// sst.config.ts — これだけで Lambda + CloudFront 構成が完成
export default $config({
  app(input) {
    return { name: "my-app", home: "aws" }
  },
  async run() {
    new sst.aws.Nextjs("MyApp")
  }
})
```

**SSTの思想：`sst dev` はローカルエミュレータを使わない**
`wrangler dev` はローカルで Workers を再現するが、`sst dev` は実際の AWS リソース（Lambda・DynamoDB など）にローカルから直接接続する。エミュレータのズレがない代わりに AWS 料金が発生する。

**主流かどうか**
- スタートアップ・個人開発では人気（GitHub ★2万超）
- 大企業は CDK 直書きか Terraform が多い
- Next.js × AWS の組み合わせでは事実上のデファクト

**他の選択肢との比較**

| ツール | 手軽さ | 自由度 | Next.js 対応 |
|---|---|---|---|
| SST v3 | ◎ | ◎ | ◎（OpenNext 内蔵） |
| AWS Amplify | ◎ | △（制限多い） | ○ |
| Serverless Framework | ○ | ○ | △（プラグイン依存） |
| CDK 直書き | △ | ◎ | 自前構築 |

**なぜ Phase 7 では使わないか**
SST は Lambda / API Gateway / CloudFront の複雑さを隠す。Phase 7 はその仕組みを学ぶフェーズなので、手動 zip + AWS CLI / SAM で「素の Lambda」を体験してから「SST はこれを自動化するもの」と理解する順序が正しい。

---

## AWS Lambda + API Gateway

**Lambda（AWS Lambda）**
コンテナやサーバーを管理せず「関数単位」でコードを動かすサーバーレス実行環境。リクエストが来たときだけ起動し、処理が終わると停止する。課金はリクエスト数 + 実行時間（ミリ秒単位）。常時起動の ECS と異なり、アイドル時のコストがゼロ。

**コールドスタート**
Lambda が一定時間使われていないと実行環境が破棄される。次のリクエスト時に環境を再構築するため数百ms〜数秒の遅延が発生する。Node.js は他の言語より軽いためコールドスタートが短い傾向がある。

**API Gateway**
Lambda をHTTPエンドポイントとして公開するためのサービス。2種類ある。
- **REST API（v1）**: 機能が多い分設定も複雑。ステージ管理・キャッシュ・APIキーなど。
- **HTTP API（v2）**: シンプルで安い。Lambda との統合が簡単。Hono との組み合わせには HTTP API が向いている。

**`hono/aws-lambda`**
Hono が公式に提供する Lambda アダプター。`handle(app)` で Hono アプリを Lambda ハンドラーに変換できる。Lambda イベント（`APIGatewayProxyEventV2`）を Hono の Request に変換してくれる。

**Lambda デプロイの手順（zip + esbuild）**
TypeScript のまま Lambda に渡すことはできないため、事前にバンドルが必要。
1. esbuild で TypeScript → JavaScript に変換（ESM 形式・外部モジュールはバンドルに含める）
2. `dist/function.zip` に固める
3. AWS コンソールまたは CLI でアップロード

```bash
# バンドル（node_modulesごとバンドルするため --bundle, --platform=node）
esbuild src/index.ts --bundle --platform=node --format=esm --outfile=dist/index.mjs

# zip 化（dist/ ディレクトリ全体）
cd dist && zip function.zip index.mjs
```

Lambda のランタイムは Node.js 24.x まで選択可能（2025年時点）。ESM 形式なら `--format=esm` + `.mjs` 拡張子にする必要がある。

**Lambda と ECS の使い分け**
- Lambda: イベント駆動・散発的なリクエスト・コスト最小化・ステートレスな処理に向く
- ECS: 常時接続が必要・WebSocket・長時間処理・コンテナ依存の処理に向く

**IAM ロール（Lambda 用）**
Lambda が他の AWS サービスにアクセスするためにロールが必要。最低限 `AWSLambdaBasicExecutionRole`（CloudWatch Logs への書き込み）をアタッチする。

---

## Cloudflare

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

---

## AWS 全般

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

---

## ネットワーク・Linux 基礎

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

---

## Linux・SSH 基礎

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

---

## デプロイパターン

**EC2 + CodeDeploy パターン**
- EC2: 仮想サーバー。自分で管理する（OS・Docker のインストール等も自分で行う）
- CodeDeploy: AWS のデプロイ自動化サービス。EC2 上の CodeDeploy エージェントが S3 から成果物を取得して実行する
- 流れ: `GitHub Actions → S3 に成果物 upload → CodeDeploy → EC2 にデプロイ`

**ECS + ECR パターン**
- ECR: Docker イメージを保存する AWS のレジストリ（Docker Hub の AWS 版）
- ECS: コンテナを動かすサービス。サーバー管理不要（Fargate モード）
- 流れ: `GitHub Actions → ECR に push → ECS が自動で pull・起動`

---

## Docker イメージ最適化

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

---

## React 18 / 19

### 並行レンダラ（Concurrent Renderer）

React 18 の中心的な変更。UI の複数バージョンを同時に裏で準備し、優先度に応じて描画を中断・再開できる。ユーザーは直接触れない仕組みだが、`useTransition` / `useDeferredValue` はこれを利用する API。Next.js は内部で `createRoot` / `hydrateRoot` を使いこの機能を有効化している。

### 自動バッチング

React 17 以前は React のイベントハンドラ内の複数 `setState` しかバッチ処理されなかった。React 18 から `setTimeout` / `Promise.then` / ネイティブイベント内でも自動的にバッチ処理される。意図的に個別レンダーが必要な場合は `flushSync` を使う。

### useTransition / startTransition

「緊急度の低い更新」としてマークする API。マークした更新はユーザー入力（テキスト入力など）より後回しにされ、UI がブロックされない。`useTransition` はフックで `isPending`（ローディング状態）も返す。`startTransition` はフックなしでトランジション開始する関数版。

```ts
const [isPending, startTransition] = useTransition()
startTransition(() => setSearchQuery(input))  // 遅延してよい更新
```

### useDeferredValue

`useTransition` の「値」版。更新を遅延させたい値をラップする。例えばリスト絞り込みで入力値の反映を遅らせる場面に使う。`useTransition` は「呼び出し元が setState を制御できる場合」、`useDeferredValue` は「props や外部から来た値で制御できない場合」に使う。

### useId

SSR（サーバー側）と CSR（クライアント側）で一致する一意な ID を生成するフック。`htmlFor` / `aria-describedby` のようなアクセシビリティ属性に使う。

**useId を使わないと起きる問題が2つある。**

1. **ID重複**: 同じコンポーネントを複数回レンダーすると `id="email"` が重複する。HTML 仕様違反になり `htmlFor` が最初の要素にしか紐付かなくなる。
2. **ハイドレーション不一致**: `Math.random()` などでIDを生成するとサーバーとクライアントで値が変わり React が警告を出す。

`useId` は各コンポーネントインスタンスに固有の ID（`:r0:` / `:r1:` など）を生成し、SSR/CSR 間で同一の値を保証するため両方の問題を解決する。

### StrictMode の挙動変化（React 18）

開発環境で `useEffect` が2回実行されるようになった。意図：副作用のクリーンアップ関数を正しく書けているかを検証するため。「マウント → アンマウント → 再マウント」を自動で行う。本番環境では発生しない。クリーンアップ関数を返さないと2回目の実行で二重登録・メモリリークが起きる可能性がある。

### Actions の概念（React 19）

transition 内で実行される非同期関数を「Action」と呼ぶ。`useActionState` / `useOptimistic` はこの概念の上に成り立つ。Action の中で pending 状態・エラー・楽観的更新が自動管理される。`<form action={fn}>` の `fn` も Action として扱われる。

### useActionState（React 19）

フォーム送信の pending / error / result を1つのフックで管理する。Server Actions と組み合わせて使う。

```ts
const [state, formAction, isPending] = useActionState(serverAction, initialState)
```

### useFormStatus（React 19）

親フォームの送信状態（`pending` など）を子コンポーネントから参照するフック。送信ボタンを別コンポーネントに切り出したときに props バケツリレーを避けられる。

### useOptimistic（React 19）

リクエスト完了前に UI を先行更新し、失敗時に自動でロールバックするフック。楽観的更新のパターンをシンプルに実装できる。

### use(promise)（React 19）

Client Component のレンダー中にプロミスを読む API。他のフックと違い条件分岐内でも使える。Suspense と組み合わせてデータのフォールバック表示に使う。

### ref が props に（React 19）

`forwardRef` が不要になり、コンポーネント定義の第2引数ではなく props の `ref` として受け取れるようになった。

```ts
// Before（React 18）
const Input = forwardRef((props, ref) => <input ref={ref} {...props} />)

// After（React 19）
const Input = ({ ref, ...props }) => <input ref={ref} {...props} />
```

### メタデータサポート（React 19）

コンポーネント内で `<title>` / `<meta>` / `<link>` をレンダーすると、React が自動的に `<head>` に移動する。Next.js には `metadata` export（静的）と `generateMetadata`（動的）があるため、基本は Next.js の方法を使う。コンポーネント内で直接書きたい場面（ライブラリ・条件付きメタ等）との使い分けを把握する。

### Next.js で対象外にした React 機能

| 機能 | 理由 |
|---|---|
| `createRoot` / `hydrateRoot` | Next.js が内部処理 |
| ストリーミング API（`renderToPipeableStream`） | Next.js が内部処理 |
| `useInsertionEffect` | CSS-in-JS ライブラリ作者向け、アプリ開発では不要 |
| プリロード API（`preload` / `preinit`） | Next.js の `<Image>` / `<Script>` が代替 |
| スタイルシート / スクリプト管理 | Next.js が代替 |
| 静的サイト生成 API（`prerender`） | Next.js が内部処理 |

---

## S3・CodeDeploy 関連

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

```text
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
