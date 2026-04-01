# Stage 1: ビルド
FROM node:24-alpine AS builder
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY hono-api/package.json ./hono-api/
COPY nextjs/package.json ./nextjs/

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN pnpm install --frozen-lockfile

COPY hono-api/src ./hono-api/src
COPY hono-api/drizzle ./hono-api/drizzle
COPY nextjs/src ./nextjs/src
COPY nextjs/public ./nextjs/public
COPY nextjs/next.config.ts nextjs/tsconfig.json nextjs/postcss.config.mjs nextjs/eslint.config.mjs ./nextjs/

WORKDIR /app/nextjs
RUN pnpm build

# Stage 2: 本番用
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/nextjs/.next/standalone ./
COPY --from=builder /app/nextjs/.next/static ./nextjs/.next/static
COPY --from=builder /app/nextjs/public ./nextjs/public

EXPOSE 3000
CMD ["node", "nextjs/server.js"]
