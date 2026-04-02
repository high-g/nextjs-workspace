import 'dotenv/config'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sqlite = new Database((process.env.DB_FILE_NAME ?? 'file.local.db').replace('file:', ''))
const db = drizzle(sqlite, { schema })

async function main() {
  await db
    .insert(schema.users)
    .values({
      id: 1,
      email: 'seed@example.com',
      name: 'Seed User',
    })
    .onConflictDoNothing()
  console.log('Drizzle seed completed')
}

main().catch(console.error)
