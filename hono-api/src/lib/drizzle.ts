import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../../drizzle/schema";

const sqlite = new Database((process.env.DB_FILE_NAME ?? "file:local.db").replace("file:", ""));
export const db = drizzle(sqlite, { schema });
