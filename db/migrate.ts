import "./env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      "Missing DATABASE_URL (or DATABASE_URL_UNPOOLED). Copy .env.example to .env.local and set your Neon connection string.",
    );
    process.exit(1);
  }

  const db = drizzle(neon(url));
  console.log("Applying migrations...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("✓ Migrations complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
