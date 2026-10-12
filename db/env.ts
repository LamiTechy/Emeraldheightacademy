import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";

/**
 * Loads `.env.local` first (preferred for local development, gitignored),
 * then falls back to `.env`. Existing process env vars always win.
 * Imported by db scripts (drizzle-kit config, migrate, seed) so they see
 * the same variables as the Next.js runtime.
 */
const localPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(localPath)) {
  loadDotEnv({ path: localPath });
}
loadDotEnv();
