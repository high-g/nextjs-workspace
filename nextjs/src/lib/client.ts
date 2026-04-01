import { hc } from 'hono/client'
import type { AppType } from 'hono-api/src/index'

export const client = hc<AppType>(process.env.HONO_API_URL ?? 'http://localhost:3001')
