/**
 * Offline schema + seed verification.
 *
 * Runs the generated SQL migrations and the full seed against an in-process
 * PGlite (WASM Postgres) instance — no Neon account or network needed.
 * This validates that migrations apply, foreign keys hold, and the seed
 * script completes end to end. It does NOT touch your real database.
 *
 * Usage: npm run db:verify-local
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql, is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import type { DBTx } from "../db";
import * as schema from "../db/schema";
import { runSeed } from "../db/seed/run";

async function main() {
  console.log("Starting in-memory PGlite...");
  const client = new PGlite();
  const db = drizzle(client, { schema });

  console.log("Applying migrations from db/migrations ...");
  await migrate(db, { migrationsFolder: "./db/migrations" });

  console.log("Running seed...");
  await runSeed(db as unknown as DBTx);

  const counts: Record<string, number> = {};
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const tableName = getTableConfig(value).name;
    const result = await db.execute<{ count: string }>(
      sql`select count(*)::text as count from ${sql.identifier(tableName)}`,
    );
    const rows = (result.rows ?? result) as unknown as { count: string }[];
    const count = Number(rows[0]?.count ?? 0);
    if (count > 0) counts[tableName] = count;
  }

  console.log("\n✓ Migrations + seed verified offline (PGlite). Row counts:");
  for (const [name, count] of Object.entries(counts).sort()) {
    console.log(`  ${name.padEnd(24)} ${count}`);
  }

  // Spot-check a few invariants that the portals rely on.
  const integrity = await db.execute(sql`
    select
      (select count(*) from users where role = 'admin') as admins,
      (select count(*) from test_attempts where status = 'in_progress') as active_attempts,
      (select count(*) from attempt_answers where is_correct is null) as pending_grading,
      (select count(*) from attendance) as attendance_rows
  `);
  const row = ((integrity.rows ?? integrity) as unknown as Record<string, string>[])[0];
  console.log("\n✓ Invariants:", row);
  console.log("Done.");
  await client.close();
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
