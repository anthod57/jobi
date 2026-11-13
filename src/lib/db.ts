import { Pool } from "pg";

let poolInstance: Pool | undefined;

export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

function requirePool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    poolInstance = createPool(connectionString);
  }
  return poolInstance;
}

/** Clears the lazy pool singleton (tests only). */
export async function resetPoolForTests(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = undefined;
  }
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const active = requirePool();
    const value = Reflect.get(active, prop, active) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(active);
    }
    return value;
  },
});
