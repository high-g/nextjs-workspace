FROM node:24-alpine AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY hono-api/package.json ./hono-api/
COPY nextjs/package.json ./nextjs/

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN pnpm install --frozen-lockfile --prod

FROM node:24-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/hono-api/node_modules ./hono-api/node_modules

COPY pnpm-workspace.yaml package.json ./
COPY hono-api/package.json ./hono-api/
COPY hono-api/src ./hono-api/src
COPY hono-api/drizzle ./hono-api/drizzle

WORKDIR /app/hono-api
EXPOSE 3001
CMD ["../node_modules/.bin/tsx", "src/index.ts"]
