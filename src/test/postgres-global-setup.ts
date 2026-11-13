import { Pool } from "pg";

const DEFAULT_URL = "postgresql://jobi:jobi@localhost:5432/jobi";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_URL;
  const pool = new Pool({ connectionString: url });

  try {
    await pool.query("SELECT 1");
    process.env.DATABASE_URL = url;
    process.env.WF_TEST_DB_AVAILABLE = "1";
  } catch {
    process.env.WF_TEST_DB_AVAILABLE = "0";
  } finally {
    await pool.end();
  }
}
