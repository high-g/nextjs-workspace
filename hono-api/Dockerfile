FROM node:24-alpine
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY hono-api/package.json ./hono-api/
COPY nextjs/package.json ./nextjs/

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN apk add --no-cache python3 make g++
RUN pnpm install --frozen-lockfile
RUN pnpm rebuild better-sqlite3

COPY hono-api/src ./hono-api/src
COPY hono-api/drizzle ./hono-api/drizzle
COPY hono-api/prisma ./hono-api/prisma
COPY hono-api/drizzle.config.ts ./hono-api/
COPY hono-api/prisma.config.ts ./hono-api/

WORKDIR /app/hono-api
EXPOSE 3001
CMD ["pnpm", "dev"]
