import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { Client } from "pg";

loadEnv({ path: resolve(__dirname, "../../.env") });

async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
  await c.connect();

  const bookings = await c.query(`
    select b.id, b.total_price, b.helpers, b.hours, b.service_type, b.status,
           b.glide_row_id, b.email_sent_at, c.name, c.email,
           (select count(*) from booking_addresses ba where ba.booking_request_id = b.id) as addr_count
    from booking_requests b
    join customers c on c.id = b.customer_id
    order by b.created_at desc
    limit 5
  `);

  console.log("Last 5 booking_requests:");
  console.table(bookings.rows);

  await c.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
