import { defineConfig } from "drizzle-kit";
import "./db/env";

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();

// `drizzle-kit generate` only reads the schema — no connection required.
// Commands that talk to the DB (push, studio) need a real URL.
const schemaOnly = process.argv.includes("generate");
if (!url && !schemaOnly) {
  throw new Error(
    "Missing DATABASE_URL (or DATABASE_URL_UNPOOLED). Copy .env.example to .env.local and set your Neon connection string before running drizzle-kit commands.",
  );
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "postgresql://user:password@localhost:5432/placeholder",
  },
  strict: true,
  verbose: true,
});
