import { config as loadEnv } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { Client } from "pg";

loadEnv({ path: resolve(__dirname, "../../.env") });

const conn = process.env.SUPABASE_CONNECTION_STRING;
if (!conn) {
  console.error("✗ SUPABASE_CONNECTION_STRING not set");
  process.exit(1);
}

const migrationsDir = resolve(__dirname, "../supabase/migrations");

async function main() {
  const client = new Client({ connectionString: conn });
  await client.connect();
  console.log("✓ Connected to Supabase Postgres");

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→ Applying ${file}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${file}`);
    } catch (err) {
      console.error(`✗ ${file} failed:`, err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\n✓ All migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
