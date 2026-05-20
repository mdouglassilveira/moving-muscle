import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { Client } from "pg";

loadEnv({ path: resolve(__dirname, "../../.env") });

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await client.connect();
  const r = await client.query(
    `select event_id, environment, event_type, source_ip, ip_allowed,
            decrypted_data, processing_error, processed_at
     from branch_webhook_events order by received_at desc limit 5`
  );
  console.dir(r.rows, { depth: 5 });
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
