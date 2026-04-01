# Prisma 7 の設定ルール

## 接続URL の置き場所

| 目的                             | 設定場所                               |
| -------------------------------- | -------------------------------------- |
| CLI（migration / introspection） | `prisma.config.ts` の `datasource.url` |
| ランタイム接続                   | アプリコードで adapter に渡す          |

`schema.prisma` の `datasource` ブロックに `url` は書かない（Prisma 7 では非対応）。

## PrismaClient の初期化

Prisma 7 では `adapter` なしで `new PrismaClient()` を呼ぶとエラーになる。必ず adapter を渡すこと。

```ts
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
```

`@libsql/client` を直接使って `createClient` する必要はない。`@prisma/adapter-libsql` が内部で管理する。

## generator ブロック

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma/client"
}
```

- `provider` は `"prisma-client"` （`"prisma-client-js"` は非推奨）
- `output` は必須
- `previewFeatures = ["driverAdapters"]` は Prisma 7 では不要（GA済み）

## prisma.config.ts

CLI が使う設定ファイル。プロジェクトルートに置く。

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```
