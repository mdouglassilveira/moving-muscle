import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { Client } from "pg";

loadEnv({ path: resolve(__dirname, "../../.env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/cleanup-mover.ts <email>");
  process.exit(1);
}

async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();
  const r = await c.query(
    "delete from movers where lower(email) = lower($1) returning id, email, coassemble_id",
    [email]
  );
  console.log(`Deleted ${r.rowCount} row(s):`);
  console.table(r.rows);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
