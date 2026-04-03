import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

async function main() {
  await db
    .insert(schema.users)
    .values({
      id: 1,
      email: "seed@example.com",
      name: "Seed User",
    })
    .onConflictDoNothing();
  console.log("Drizzle seed completed");
}

main().catch(console.error);
