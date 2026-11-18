import { pool } from '../src/db/index';

async function audit() {
  const client = await pool.connect();
  console.log('Connected to Neon PostgreSQL DB!');
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('--- TABLE ROW COUNTS ---');
  for (const row of res.rows) {
    const tableName = row.table_name;
    const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    console.log(`${tableName}: ${countRes.rows[0].count} rows`);
  }
  
  // Also check orders date range
  const dateRes = await client.query('SELECT MIN(order_date) as min_date, MAX(order_date) as max_date, COUNT(*) as total FROM orders');
  console.log('--- ORDERS DATE RANGE ---');
  console.log(dateRes.rows[0]);

  client.release();
  await pool.end();
}

audit().catch(console.error);
