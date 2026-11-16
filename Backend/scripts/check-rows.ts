import { pool } from '../src/db';

async function main() {
  const tables = ['users', 'customers', 'products', 'orders', 'order_items', 'transactions', 'marketing_campaigns', 'refresh_tokens'];
  for (const t of tables) {
    const r = await pool.query(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`${t}: ${r.rows[0].c}`);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
