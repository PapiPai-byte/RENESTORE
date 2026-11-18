import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db, pool } from '../db';
import { marketingCampaigns } from '../db/schema';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth';
import { sql } from 'drizzle-orm';
import descriptiveService from '../services/descriptive-service';
import predictiveService from '../services/predictive-service';
import { optimizeBudget, generateInventoryPlan } from '../services/prescriptive-service';
import type { MarketingRow } from '../services/prescriptive-service';

const router = Router();

async function getCampaignOptimizationRows(): Promise<MarketingRow[]> {
  const campaigns = await db.select().from(marketingCampaigns).orderBy(sql`start_date ASC`);
  return campaigns.map(campaign => ({
    id: campaign.id,
    channel: campaign.channel,
    date: campaign.startDate,
    spend: campaign.spend,
    revenue: campaign.revenueGenerated,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    orders: campaign.ordersGenerated,
  }));
}

// ── DESCRIPTIVE ANALYTICS ────────────────────────────────────────────────────
router.get(
  '/descriptive',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await descriptiveService.getAnalytics();
    res.json(data);
  })
);

// ── PREDICTIVE ANALYTICS ─────────────────────────────────────────────────────
router.get(
  '/predictive',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const months = parseInt(req.query.months as string, 10) || 6;
    const data = await predictiveService.getAnalytics(months);
    res.json(data);
  })
);

// ── PRESCRIPTIVE ANALYTICS: BUDGET OPTIMIZATION ─────────────────────────────
router.post(
  '/prescriptive/optimize-budget',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const body = z.object({
      totalBudget: z.number().positive(),
      constraints: z.record(
        z.string(),
        z.object({ min: z.number().min(0), max: z.number().min(0) })
      ),
      purchaseBudget: z.number().nonnegative().optional().default(250000),
    }).parse(req.body);

    const rows = await getCampaignOptimizationRows();
    const result = await optimizeBudget(
      body.totalBudget,
      body.constraints,
      rows,
      body.purchaseBudget
    );
    res.json(result);
  })
);

// ── PRESCRIPTIVE: INVENTORY REORDER PLAN ─────────────────────────────────────
router.get(
  '/prescriptive/inventory-plan',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const budget = parseFloat(req.query.budget as string) || 250000;
    const plan = await generateInventoryPlan(budget);
    res.json(plan);
  })
);

// ── DATA OVERVIEW (R3: 5 Variables with >= 50 Records Verification) ─────────
router.get(
  '/data-overview',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const requiredTables = new Set(['products', 'customers', 'orders', 'marketing_campaigns', 'inventory_purchases']);
      const tableQueries = [
        { key: 'products', name: 'Products Catalog', table: 'products' },
        { key: 'customers', name: 'Customer Profiles', table: 'customers' },
        { key: 'orders', name: 'Orders', table: 'orders' },
        { key: 'order_items', name: 'Order Line Items', table: 'order_items' },
        { key: 'transactions', name: 'Transactions', table: 'transactions' },
        { key: 'marketing_campaigns', name: 'Marketing Campaigns', table: 'marketing_campaigns' },
        { key: 'marketing_performance', name: 'Marketing Performance', table: 'marketing_performance' },
        { key: 'inventory_purchases', name: 'Inventory Purchases', table: 'inventory_purchases' },
        { key: 'suppliers', name: 'Suppliers', table: 'suppliers' },
        { key: 'users', name: 'Users', table: 'users' },
        { key: 'refresh_tokens', name: 'Refresh Tokens', table: 'refresh_tokens' },
        { key: 'faqs', name: 'FAQs', table: 'faqs' },
        { key: 'chat_logs', name: 'Chat Logs', table: 'chat_logs' },
      ];

      const tables = [];
      let allVariablesPass = true;

      for (const t of tableQueries) {
        const countRes = await client.query(`SELECT COUNT(*) AS count FROM "${t.table}"`);
        const count = Number(countRes.rows[0].count);
        const required = requiredTables.has(t.table);
        const meetsThreshold = count >= 50;
        if (required && !meetsThreshold) {
          allVariablesPass = false;
        }

        tables.push({
          key: t.key,
          name: t.name,
          count,
          required,
          minRequired: required ? 50 : null,
          passed: meetsThreshold,
        });
      }

      // Date range of orders
      const dateRes = await client.query(`
        SELECT
          MIN(order_date) as start_date,
          MAX(order_date) as end_date
        FROM orders
      `);

      res.json({
        allVariablesPass,
        tables,
        dateRange: {
          start: dateRes.rows[0]?.start_date,
          end: dateRes.rows[0]?.end_date,
        },
      });
    } finally {
      client.release();
    }
  })
);

// ── PROCESS FLOW (R6: Descriptive -> Predictive -> Prescriptive -> Decision) ─
router.get(
  '/process-flow',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { totalBudget, purchaseBudget } = z.object({
      totalBudget: z.coerce.number().positive().optional().default(100000),
      purchaseBudget: z.coerce.number().nonnegative().optional().default(250000),
    }).parse(req.query);

    // Descriptive stage outputs
    const descData = await descriptiveService.getAnalytics();
    const completeMonths = descData.salesByMonth.filter(month => !month.isPartial);
    const peakMonth = completeMonths.reduce(
      (max, month) => (!max || month.revenue > max.revenue ? month : max),
      null as (typeof completeMonths)[number] | null
    );
    const topCategory = descData.salesByCategory[0];
    const bestChannel = descData.campaignPerformance.reduce(
      (best, campaign) => !best || campaign.roi > best.roi ? campaign : best,
      undefined as (typeof descData.campaignPerformance)[number] | undefined
    );

    // Predictive stage outputs
    const predData = await predictiveService.getAnalytics(3);
    const nextQuarterForecast = predData.forecast.reduce((sum, f) => sum + f.linearRegression, 0);
    const highRiskStockouts = predData.stockoutRisks.filter(s => s.riskLevel === 'High').length;

    // Prescriptive stage outputs
    const rows = await getCampaignOptimizationRows();
    const defaultConstraints = {
      'Facebook': { min: 5000, max: 40000 },
      'Google Ads': { min: 5000, max: 40000 },
      'Email': { min: 2000, max: 20000 },
      'TikTok': { min: 3000, max: 30000 },
      'Instagram': { min: 3000, max: 25000 },
    };
    const prescData = await optimizeBudget(totalBudget, defaultConstraints, rows, purchaseBudget);

    // Decision stage summary
    const decisionImpact = {
      projectedMonthlyRevenue: Math.round(nextQuarterForecast / 3),
      expectedMarketingUplift: prescData.baselines[1]?.upliftPct ?? null,
      highRiskProducts: highRiskStockouts,
      expectedMarketingProfit: prescData.totalExpectedRevenue - prescData.totalAllocated,
    };

    res.json({
      descriptive: {
        totalRevenue: descData.kpis.totalRevenue,
        totalProfit: descData.kpis.totalProfit,
        profitMargin: descData.kpis.profitMargin,
        peakMonth: peakMonth?.month ?? null,
        peakMonthRevenue: peakMonth?.revenue ?? null,
        topCategory: topCategory?.category ?? null,
        bestChannel: bestChannel?.channel ?? null,
        bestChannelRoi: bestChannel?.roi ?? null,
      },
      predictive: {
        modelUsed: predData.models.recommendedModel,
        rSquared: predData.models.linearRegression.rSquared,
        rmse: predData.models.linearRegression.rmse,
        nextQuarterForecast: Math.round(nextQuarterForecast),
        highRiskStockoutCount: highRiskStockouts,
        predictedChannelRoi: predData.channelPredictions.map(c => ({
          channel: c.channel,
          predictedRoi: c.predictedRoi,
        })),
      },
      prescriptive: {
        recommendedBudget: prescData.totalAllocated,
        expectedMarketingRevenue: prescData.totalExpectedRevenue,
        overallRoi: prescData.overallROI,
        reorderItemCount: prescData.inventoryPlan.itemsToReorderCount,
        reorderCommittedCost: prescData.inventoryPlan.totalCommittedCost,
        topBudgetChannel: prescData.allocations.sort((a, b) => b.budget - a.budget)[0]?.channel,
        allocations: prescData.allocations.map(allocation => ({
          channel: allocation.channel,
          budget: allocation.budget,
          predictedRoi: allocation.roi,
        })),
        reorderItems: prescData.inventoryPlan.items
          .filter(item => item.recommendedOrderQty > 0)
          .map(item => ({
            productName: item.productName,
            quantity: item.recommendedOrderQty,
            totalCost: item.totalCost,
          })),
      },
      scenario: { totalBudget, purchaseBudget },
      decision: decisionImpact,
    });
  })
);

// ── CASE STUDY (R5: Real computed statistics and overview) ──────────────────
router.get(
  '/case-study',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      // Table record counts
      const counts = await Promise.all([
        client.query('SELECT COUNT(*) AS c FROM orders'),
        client.query('SELECT COUNT(*) AS c FROM customers'),
        client.query('SELECT COUNT(*) AS c FROM products'),
        client.query('SELECT COUNT(*) AS c FROM marketing_campaigns'),
        client.query('SELECT COUNT(*) AS c FROM inventory_purchases'),
        client.query('SELECT MIN(order_date) AS start, MAX(order_date) AS end FROM orders'),
        client.query('SELECT MIN(order_date) AS start, MAX(order_date) AS end FROM orders WHERE status = $1', ['completed']),
        client.query('SELECT MIN(signup_date) AS start, MAX(signup_date) AS end FROM customers'),
        client.query('SELECT MIN(start_date) AS start, MAX(end_date) AS end FROM marketing_campaigns'),
        client.query('SELECT MIN(purchase_date) AS start, MAX(purchase_date) AS end FROM inventory_purchases'),
      ]);

      const [orderCnt, custCnt, prodCnt, campaignCnt, invCnt] = counts.slice(0, 5).map(r => Number(r.rows[0].c));
      const ordersDateRange = counts[5].rows[0];
      const completedDateRange = counts[6].rows[0];
      const customerDateRange = counts[7].rows[0];
      const campaignDateRange = counts[8].rows[0];
      const purchaseDateRange = counts[9].rows[0];

      // Descriptive and predictive metrics
      const desc = await descriptiveService.getAnalytics();
      const pred = await predictiveService.getAnalytics(6);

      // Prescriptive optimization result
      const rows = await getCampaignOptimizationRows();
      const presc = await optimizeBudget(100000, {
        'Facebook': { min: 5000, max: 40000 },
        'Google Ads': { min: 5000, max: 40000 },
        'Email': { min: 2000, max: 20000 },
        'TikTok': { min: 3000, max: 30000 },
        'Instagram': { min: 3000, max: 25000 },
      }, rows);

      const completeMonths = desc.salesByMonth.filter(month => !month.isPartial);
      const peakMonth = completeMonths.reduce(
        (peak, month) => !peak || month.revenue > peak.revenue ? month : peak,
        null as (typeof completeMonths)[number] | null
      );
      const topCategory = desc.salesByCategory[0];
      const bestChannel = desc.campaignPerformance.reduce(
        (best, campaign) => campaign.roi > (best?.roi ?? -Infinity) ? campaign : best,
        desc.campaignPerformance[0]
      );

      res.json({
        company: 'ReneStore Electronics & Tools',
        industry: 'E-commerce (Computers, Hardware & Tools)',
        problemBackground:
          "ReneStore sells computer products but doesn't know which products and channels drive profit, can't reliably forecast demand, and has no data-driven plan for splitting its monthly marketing budget and inventory purchases. Business question: How should ReneStore allocate its marketing budget and stock purchases to maximize profit next month?",
        dataVariables: [
          { name: 'Products Catalog', table: 'products', records: prodCnt, source: 'Not documented', status: prodCnt >= 50 ? 'PASS' : 'FAIL', dateRange: null },
          { name: 'Customer Profiles', table: 'customers', records: custCnt, source: 'Not documented', status: custCnt >= 50 ? 'PASS' : 'FAIL', dateRange: customerDateRange },
          { name: 'Orders', table: 'orders', records: orderCnt, source: 'Not documented', status: orderCnt >= 50 ? 'PASS' : 'FAIL', dateRange: ordersDateRange },
          { name: 'Marketing Campaigns', table: 'marketing_campaigns', records: campaignCnt, source: 'Not documented', status: campaignCnt >= 50 ? 'PASS' : 'FAIL', dateRange: campaignDateRange },
          { name: 'Inventory Purchases (Suppliers)', table: 'inventory_purchases', records: invCnt, source: 'Not documented', status: invCnt >= 50 ? 'PASS' : 'FAIL', dateRange: purchaseDateRange },
        ],
        ordersDateRange: {
          start: ordersDateRange.start,
          end: ordersDateRange.end,
          completedStart: completedDateRange.start,
          completedEnd: completedDateRange.end,
        },
        computedResults: {
          totalRevenue: desc.kpis.totalRevenue,
          totalProfit: desc.kpis.totalProfit,
          profitMargin: desc.kpis.profitMargin,
          totalOrders: desc.kpis.totalOrders,
          totalCustomers: desc.kpis.totalCustomers,
          rSquared: pred.models.linearRegression.rSquared,
          rmse: pred.models.linearRegression.rmse,
          recommendedModel: pred.models.recommendedModel,
          modelInterpretation: pred.models.linearRegression.interpretation,
          historicalMonths: pred.sharedDateRange.totalHistoricalMonths,
          peakMonth: peakMonth?.month ?? null,
          peakMonthRevenue: peakMonth?.revenue ?? null,
          topCategory: topCategory?.category ?? null,
          bestChannel: bestChannel?.channel ?? null,
          bestChannelRoi: bestChannel?.roi ?? null,
          marketingUpliftPct: presc.baselines[1]?.upliftPct ?? null,
          prescriptiveExpectedRevenue: presc.totalExpectedRevenue,
          prescriptiveRoi: presc.overallROI,
          budgetAllocations: presc.allocations.map(allocation => ({
            channel: allocation.channel,
            budget: allocation.budget,
            expectedRevenue: allocation.expectedRevenue,
            roi: allocation.roi,
            changePct: allocation.changePct,
          })),
          actionList: presc.actionList,
          inventoryItemsToReorder: presc.inventoryPlan.itemsToReorderCount,
          reorderItems: presc.inventoryPlan.items
            .filter(item => item.recommendedOrderQty > 0)
            .map(item => ({ name: item.productName, quantity: item.recommendedOrderQty, totalCost: item.totalCost })),
        },
      });
    } finally {
      client.release();
    }
  })
);

export default router;
