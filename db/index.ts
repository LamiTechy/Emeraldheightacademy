import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Node 22+ ships a global WebSocket; older Node runtimes (e.g. Vercel Node 20)
// need the `ws` polyfill for the Neon WebSocket (transaction) driver.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = ws as unknown as typeof WebSocket;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set your Neon connection string. See README.md → "Connect your Neon database".`,
    );
  }
  return value;
}

const connectionString = requireEnv("DATABASE_URL");

/**
 * Normal queries — Neon HTTP driver (fast, serverless, no connections).
 * NOTE: this driver has NO transaction support; use `dbTx` for those.
 */
export const db = drizzleHttp(neon(connectionString), { schema });

/**
 * Transactions — Neon serverless Pool over WebSocket.
 * Use for anything needing atomicity: registration approval, test submission,
 * bulk imports, multi-row writes. Also safe for plain queries.
 */
export const pool = new Pool({ connectionString });
export const dbTx = drizzleWs(pool, { schema });

export type DB = typeof db;
export type DBTx = typeof dbTx;
export { schema };
