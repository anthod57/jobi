import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;

export function getDb(): NodePgDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set (e.g. in .env.local) to use the database.",
    );
  }

  if (!db) {
    pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }

  return db;
}
