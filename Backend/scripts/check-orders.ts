import { pool } from '../src/db/index';

async function checkMonthlyOrders() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT 
      TO_CHAR(order_date, 'YYYY-MM') as month,
      status,
      COUNT(*) as count,
      SUM(total_amount) as total_revenue
    FROM orders
    GROUP BY TO_CHAR(order_date, 'YYYY-MM'), status
    ORDER BY month ASC
  `);
  console.log('Orders grouped by month and status:');
  console.table(res.rows);

  const octOrders = await client.query(`
    SELECT id, customer_id, order_date, total_amount, status
    FROM orders
    WHERE order_date >= '2026-01-01'
    ORDER BY order_date ASC
  `);
  console.log('Orders in 2026:');
  console.table(octOrders.rows);

  client.release();
  await pool.end();
}

checkMonthlyOrders().catch(console.error);
