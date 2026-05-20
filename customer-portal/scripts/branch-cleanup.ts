import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { Client } from "pg";

loadEnv({ path: resolve(__dirname, "../../.env") });

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await client.connect();
  const r = await client.query(
    `delete from branch_webhook_events where event_id like 'evt_test_%' or event_id like 'evt_aes_%' returning event_id`
  );
  console.log(`Deleted ${r.rowCount} test event(s):`, r.rows.map((x) => x.event_id));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
