import { pool } from '../db';
import { calculateDescriptiveStats, type MonthlyDataPoint, type DescriptiveStats } from './analytics-shared';
import { getChannelRoiMap } from './channel-roi';

export interface DescriptiveAnalyticsResult {
  kpis: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    avgOrderValue: number;
    profitMargin: number;
    totalCustomers: number;
    stockoutCount: number;
    outOfStockCount: number;
  };
  salesByMonth: MonthlyDataPoint[];
  salesByCategory: { category: string; revenue: number; unitsSold: number }[];
  topProducts: { name: string; category: string; revenue: number; unitsSold: number }[];
  bottomProducts: { name: string; category: string; revenue: number; unitsSold: number; stock: number }[];
  salesByCity: { city: string; revenue: number; orders: number }[];
  salesByPaymentMethod: { method: string; revenue: number; orders: number; percentage: number }[];
  ordersByStatus: { status: string; count: number; percentage: number }[];
  customersBySegment: { segment: string; customers: number }[];
  inventoryPurchasesBySupplier: { supplier: string; records: number; quantity: number; spend: number }[];
  inventoryPurchasesByMonth: { month: string; spend: number; quantity: number }[];
  campaignPerformance: {
    channel: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    costPerOrder: number;
    revenue: number;
    roi: number;
  }[];
  statistics: {
    orderValue: DescriptiveStats;
    monthlyRevenue: DescriptiveStats;
  };
}

export class DescriptiveService {
  /**
   * Fetches the shared monthly sales and profit data from orders
   * Gaps between first and last complete month are handled cleanly.
   * Partial/in-progress months (e.g. current month) are flagged so regression can exclude them.
   */
  async getMonthlySales(): Promise<MonthlyDataPoint[]> {
    const client = await pool.connect();
    try {
      const query = `
        WITH monthly_orders AS (
          SELECT
            date_trunc('month', order_date)::date AS month_start,
            SUM(total_amount) AS revenue,
            COUNT(*) AS orders
          FROM orders
          WHERE status = 'completed'
          GROUP BY date_trunc('month', order_date)::date
        ),
        monthly_profit AS (
          SELECT
            date_trunc('month', o.order_date)::date AS month_start,
            SUM(oi.quantity * (oi.unit_price - p.cost)) AS profit
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          WHERE o.status = 'completed'
          GROUP BY date_trunc('month', o.order_date)::date
        ),
        bounds AS (
          SELECT MIN(month_start) AS first_month, MAX(month_start) AS last_month
          FROM monthly_orders
        ),
        months AS (
          SELECT generate_series(first_month, last_month, interval '1 month')::date AS month_start
          FROM bounds
          WHERE first_month IS NOT NULL
        )
        SELECT
          to_char(months.month_start, 'YYYY-MM') AS month,
          COALESCE(monthly_orders.revenue, 0) AS revenue,
          COALESCE(monthly_profit.profit, 0) AS profit,
          COALESCE(monthly_orders.orders, 0) AS orders,
          months.month_start = date_trunc('month', CURRENT_DATE)::date AS is_partial
        FROM months
        LEFT JOIN monthly_orders USING (month_start)
        LEFT JOIN monthly_profit USING (month_start)
        ORDER BY months.month_start
      `;
      const res = await client.query(query);

      return res.rows
        .map((row: any) => ({
          month: row.month,
          revenue: Math.round(Number(row.revenue)),
          profit: Math.round(Number(row.profit)),
          orders: Number(row.orders),
          isPartial: row.is_partial,
        }))
        .filter((row) => !row.isPartial && row.orders >= 5);
    } finally {
      client.release();
    }
  }

  /**
   * Generates the complete Descriptive Analytics package
   */
  async getAnalytics(): Promise<DescriptiveAnalyticsResult> {
    const client = await pool.connect();
    try {
      // 1. Overall Revenue & Orders
      const orderSummaryRes = await client.query(`
        SELECT
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) AS total_revenue
        FROM orders
      `);
      const totalRevenue = Number(orderSummaryRes.rows[0].total_revenue) || 0;
      const totalOrders = Number(orderSummaryRes.rows[0].completed_orders) || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // 2. Total Cost and Profit Margin
      const costRes = await client.query(`
        SELECT COALESCE(SUM(oi.quantity * p.cost), 0) AS total_cost
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status = 'completed'
      `);
      const totalCost = Number(costRes.rows[0].total_cost) || 0;
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // 3. Customers count
      const custRes = await client.query('SELECT COUNT(*) AS total FROM customers');
      const totalCustomers = Number(custRes.rows[0].total) || 0;

      // 4. Stockout / low stock counts
      const stockoutRes = await client.query(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE stock <= reorder_level
      `);
      const stockoutCount = Number(stockoutRes.rows[0].count) || 0;
      const outOfStockRes = await client.query(`SELECT COUNT(*) AS count FROM products WHERE stock <= 0`);
      const outOfStockCount = Number(outOfStockRes.rows[0].count) || 0;

      // 5. Monthly Sales & Profit series (Shared with Predictive)
      const salesByMonth = await this.getMonthlySales();

      // 6. Sales by Category
      const catRes = await client.query(`
        SELECT
          p.category,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
          COALESCE(SUM(oi.quantity), 0) AS units_sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status = 'completed'
        GROUP BY p.category
        ORDER BY revenue DESC
      `);
      const salesByCategory = catRes.rows.map((r: any) => ({
        category: r.category,
        revenue: Math.round(Number(r.revenue)),
        unitsSold: Number(r.units_sold),
      }));

      // 7. Top 10 and Bottom 10 Products
      const productPerformanceRes = await client.query(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.stock,
          COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity * oi.unit_price ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0) AS units_sold
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
        GROUP BY p.id, p.name, p.category, p.stock
        ORDER BY revenue DESC
      `);

      const topProducts = productPerformanceRes.rows.slice(0, 10).map((r: any) => ({
        name: r.name,
        category: r.category,
        revenue: Math.round(Number(r.revenue)),
        unitsSold: Number(r.units_sold),
      }));

      const bottomProducts = productPerformanceRes.rows
        .slice(-10)
        .reverse()
        .map((r: any) => ({
          name: r.name,
          category: r.category,
          revenue: Math.round(Number(r.revenue)),
          unitsSold: Number(r.units_sold),
          stock: Number(r.stock),
        }));

      // 8. Sales by City
      const cityRes = await client.query(`
        SELECT
          c.city,
          COALESCE(SUM(o.total_amount), 0) AS revenue,
          COUNT(o.id) AS orders
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status = 'completed'
        GROUP BY c.city
        ORDER BY revenue DESC
      `);
      const salesByCity = cityRes.rows.map((r: any) => ({
        city: r.city,
        revenue: Math.round(Number(r.revenue)),
        orders: Number(r.orders),
      }));

      // 9. Revenue by Payment Method
      const payRes = await client.query(`
        SELECT
          t.payment_method AS method,
          COALESCE(SUM(t.amount), 0) AS revenue,
          COUNT(t.id) AS orders
        FROM transactions t
        WHERE t.status = 'completed'
        GROUP BY t.payment_method
        ORDER BY revenue DESC
      `);
      const totalPayRev = payRes.rows.reduce((sum: number, r: any) => sum + Number(r.revenue), 0);
      const salesByPaymentMethod = payRes.rows.map((r: any) => {
        const rev = Number(r.revenue);
        return {
          method: r.method,
          revenue: Math.round(rev),
          orders: Number(r.orders),
          percentage: totalPayRev > 0 ? Number(((rev / totalPayRev) * 100).toFixed(1)) : 0,
        };
      });

      // 10. Orders by Status
      const statusRes = await client.query(`
        SELECT status, COUNT(*) AS count
        FROM orders
        GROUP BY status
      `);
      const totalStatusOrders = statusRes.rows.reduce((sum: number, r: any) => sum + Number(r.count), 0);
      const ordersByStatus = statusRes.rows.map((r: any) => {
        const count = Number(r.count);
        return {
          status: r.status,
          count,
          percentage: totalStatusOrders > 0 ? Number(((count / totalStatusOrders) * 100).toFixed(1)) : 0,
        };
      });

      const customerSegmentRes = await client.query(`
        SELECT segment, COUNT(*) AS customers
        FROM customers
        GROUP BY segment
        ORDER BY customers DESC
      `);
      const customersBySegment = customerSegmentRes.rows.map((row: any) => ({
        segment: row.segment,
        customers: Number(row.customers),
      }));

      const purchasesBySupplierRes = await client.query(`
        SELECT supplier, COUNT(*) AS records, SUM(quantity) AS quantity,
               SUM(quantity * unit_cost) AS spend
        FROM inventory_purchases
        GROUP BY supplier
        ORDER BY spend DESC
      `);
      const inventoryPurchasesBySupplier = purchasesBySupplierRes.rows.map((row: any) => ({
        supplier: row.supplier,
        records: Number(row.records),
        quantity: Number(row.quantity),
        spend: Math.round(Number(row.spend)),
      }));

      const purchasesByMonthRes = await client.query(`
        SELECT to_char(date_trunc('month', purchase_date), 'YYYY-MM') AS month,
               SUM(quantity * unit_cost) AS spend,
               SUM(quantity) AS quantity
        FROM inventory_purchases
        GROUP BY date_trunc('month', purchase_date)
        ORDER BY date_trunc('month', purchase_date)
      `);
      const inventoryPurchasesByMonth = purchasesByMonthRes.rows.map((row: any) => ({
        month: row.month,
        spend: Math.round(Number(row.spend)),
        quantity: Number(row.quantity),
      }));

      // Campaign metrics use the campaign table directly.
      const channelRoiMap = await getChannelRoiMap();
      const mktRes = await client.query(`
        SELECT
          mc.channel,
          COALESCE(SUM(mc.spend), 0) AS total_spend,
          COALESCE(SUM(mc.impressions), 0) AS total_impressions,
          COALESCE(SUM(mc.clicks), 0) AS total_clicks,
          COALESCE(COUNT(o.id), 0) AS total_orders,
          COALESCE(SUM(o.total_amount), 0) AS total_revenue
        FROM marketing_campaigns mc
        LEFT JOIN orders o ON o.campaign_id = mc.id AND o.status = 'completed'
        GROUP BY mc.channel
        ORDER BY total_revenue DESC
      `);

      const campaignPerformance = mktRes.rows.map((r: any) => {
        const spend = Number(r.total_spend) || 0;
        const impressions = Number(r.total_impressions) || 0;
        const clicks = Number(r.total_clicks) || 0;
        const orders = Number(r.total_orders) || 0;
        const revenue = Number(r.total_revenue) || 0;

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
        const costPerOrder = orders > 0 ? spend / orders : 0;
        const roi = channelRoiMap[r.channel]?.roi ?? (spend > 0 ? ((revenue - spend) / spend) * 100 : 0);

        return {
          channel: r.channel,
          spend: Math.round(spend),
          impressions,
          clicks,
          conversions: orders,
          ctr: Number(ctr.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          costPerOrder: Math.round(costPerOrder),
          revenue: Math.round(revenue),
          roi: Number(roi.toFixed(1)),
        };
      });

      // 12. Statistical Summaries (Order Values and Monthly Revenue)
      const orderValuesRes = await client.query(`
        SELECT total_amount FROM orders WHERE status = 'completed'
      `);
      const orderValues = orderValuesRes.rows.map((r: any) => Number(r.total_amount));
      const monthlyRevenues = salesByMonth.filter(m => !m.isPartial).map(m => m.revenue);

      const statistics = {
        orderValue: calculateDescriptiveStats(orderValues),
        monthlyRevenue: calculateDescriptiveStats(monthlyRevenues),
      };

      return {
        kpis: {
          totalRevenue: Math.round(totalRevenue),
          totalProfit: Math.round(totalProfit),
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          profitMargin: Number(profitMargin.toFixed(1)),
          totalCustomers,
          stockoutCount,
          outOfStockCount,
        },
        salesByMonth,
        salesByCategory,
        topProducts,
        bottomProducts,
        salesByCity,
        salesByPaymentMethod,
        ordersByStatus,
        customersBySegment,
        inventoryPurchasesBySupplier,
        inventoryPurchasesByMonth,
        campaignPerformance,
        statistics,
      };
    } finally {
      client.release();
    }
  }
}

export default new DescriptiveService();
