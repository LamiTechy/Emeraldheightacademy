import "./env";
import { dbTx, pool } from "./index";
import { runSeed } from "./seed/run";

async function main() {
  await runSeed(dbTx);
  await pool.end();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
