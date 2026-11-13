import path from "node:path";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { getDb, resetDbForTests } from "@/server/db/client";

export function isTestDbAvailable(): boolean {
  return process.env.WF_TEST_DB_AVAILABLE === "1";
}

export async function prepareTestDatabase(): Promise<void> {
  await resetDbForTests();
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}

export async function resetProfileFixture(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    TRUNCATE profile_cv, profile_skills, profile_experiences RESTART IDENTITY CASCADE;
    TRUNCATE profiles RESTART IDENTITY CASCADE;
    INSERT INTO profiles (id) VALUES (1);
    SELECT setval(
      pg_get_serial_sequence('profiles', 'id'),
      GREATEST((SELECT MAX(id) FROM profiles), 1)
    );
  `);
}
