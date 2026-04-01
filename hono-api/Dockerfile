FROM node:24-alpine
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY hono-api/package.json ./hono-api/

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN pnpm install --frozen-lockfile

COPY hono-api/src ./hono-api/src
COPY hono-api/drizzle ./hono-api/drizzle
COPY hono-api/prisma ./hono-api/prisma

WORKDIR /app/hono-api
EXPOSE 3001
CMD ["pnpm", "dev"]
