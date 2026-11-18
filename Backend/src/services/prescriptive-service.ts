import { pool } from '../db';
import lpSolver, { type Model, type Solution } from 'javascript-lp-solver';
import descriptiveService from './descriptive-service';
import { calculateEOQ, calculateROP } from './analytics-shared';

export interface MarketingRow {
  id: number;
  channel: string;
  date: Date | string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  orders: number;
}

export interface BudgetAllocationResult {
  channel: string;
  budget: number;
  sharePct: number;
  expectedRevenue: number;
  roi: number;
  roas: number;
  marginalRoas: number;
  boundHit: 'MIN' | 'MAX' | null;
  historicalSpend: number;
  changePct: number;
}

export interface Baseline {
  name: string;
  expectedRevenue: number;
  upliftPct: number;
}

export interface ActionRecommendation {
  type: 'increase' | 'maintain' | 'decrease';
  channel: string;
  actionText: string;
  rationale: string;
}

export interface InventoryPlanItem {
  productId: number;
  productName: string;
  category: string;
  supplier: string;
  currentStock: number;
  reorderLevel: number;
  reorderPoint: number;
  economicOrderQty: number;
  recommendedOrderQty: number;
  unitCost: number;
  totalCost: number;
  priority: 'Immediate' | 'Upcoming' | 'Adequate';
  leadTimeDays: number;
  projectedRevenue: number;
}

export interface InventoryPlanResponse {
  purchaseBudget: number;
  totalCommittedCost: number;
  remainingBudget: number;
  itemsToReorderCount: number;
  projectedProfit: number;
  items: InventoryPlanItem[];
}

export interface OptimizeResponse {
  totalBudget: number;
  totalAllocated: number;
  totalExpectedRevenue: number;
  overallROI: number;
  overallROAS: number;
  allocations: BudgetAllocationResult[];
  baselines: Baseline[];
  actionList: ActionRecommendation[];
  insights: string[];
  inventoryPlan: InventoryPlanResponse;
  generatedAt: string;
  dataRange: { from: string; to: string; recordsUsed: number };
}

const CHANNELS = ['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram'] as const;

function distributeBudget(
  totalBudget: number,
  channels: string[],
  mins: Record<string, number>,
  maxs: Record<string, number>,
  weights: Record<string, number>
): Record<string, number> {
  const allocations = Object.fromEntries(channels.map(channel => [channel, mins[channel]]));
  let remaining = totalBudget - channels.reduce((total, channel) => total + mins[channel], 0);

  while (remaining > 0.000001) {
    const active = channels.filter(channel => maxs[channel] - allocations[channel] > 0.000001);
    if (active.length === 0) break;
    const weightTotal = active.reduce((total, channel) => total + Math.max(0, weights[channel] || 0), 0);
    const shares = weightTotal > 0
      ? Object.fromEntries(active.map(channel => [channel, Math.max(0, weights[channel] || 0) / weightTotal]))
      : Object.fromEntries(active.map(channel => [channel, 1 / active.length]));
    let distributed = 0;

    for (const channel of active) {
      const amount = Math.min(remaining * shares[channel], maxs[channel] - allocations[channel]);
      allocations[channel] += amount;
      distributed += amount;
    }

    if (distributed <= 0.000001) break;
    remaining -= distributed;
  }
  return allocations;
}

function campaignDate(value: Date | string): string {
  const date = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error('A campaign record contains an invalid date.');
  }
  return date;
}

export async function optimizeBudget(
  totalBudget: number,
  constraints: Record<string, { min: number; max: number }>,
  rows: MarketingRow[],
  purchaseBudget = 250000
): Promise<OptimizeResponse> {
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    throw new Error('Total budget must be a positive number.');
  }
  if (!Number.isFinite(purchaseBudget) || purchaseBudget < 0) {
    throw new Error('Purchase budget must be a non-negative number.');
  }

  const unknownChannels = Object.keys(constraints).filter(channel => !CHANNELS.includes(channel as typeof CHANNELS[number]));
  if (unknownChannels.length > 0) throw new Error(`Unknown marketing channel(s): ${unknownChannels.join(', ')}`);
  const channels = CHANNELS.filter(channel => constraints[channel]) as string[];
  if (channels.length === 0) throw new Error('At least one channel budget constraint is required.');

  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};
  for (const channel of channels) {
    const bounds = constraints[channel];
    if (!Number.isFinite(bounds.min) || !Number.isFinite(bounds.max) || bounds.min < 0 || bounds.max < 0) {
      throw new Error(`Channel "${channel}" must have finite, non-negative limits.`);
    }
    if (bounds.min > bounds.max) {
      throw new Error(`Channel "${channel}": minimum spend (₱${bounds.min}) cannot exceed maximum (₱${bounds.max}).`);
    }
    mins[channel] = bounds.min;
    maxs[channel] = bounds.max;
  }

  const sumMin = channels.reduce((total, channel) => total + mins[channel], 0);
  const sumMax = channels.reduce((total, channel) => total + maxs[channel], 0);
  if (sumMin > totalBudget) {
    throw new Error(`Infeasible: channel minimums (₱${sumMin.toLocaleString()}) exceed budget (₱${totalBudget.toLocaleString()}).`);
  }
  if (sumMax < totalBudget) {
    throw new Error(`Infeasible: channel maximums (₱${sumMax.toLocaleString()}) are below budget (₱${totalBudget.toLocaleString()}).`);
  }

  const monthlyCampaigns = new Map<string, Map<string, { spend: number; revenue: number }>>();
  const dates: string[] = [];
  for (const row of rows) {
    if (!channels.includes(row.channel)) continue;
    const date = campaignDate(row.date);
    if (!Number.isFinite(row.spend) || row.spend < 0 || !Number.isFinite(row.revenue) || row.revenue < 0) {
      throw new Error(`Campaign ${row.id} has invalid spend or revenue.`);
    }
    const months = monthlyCampaigns.get(row.channel) || new Map();
    const monthKey = date.slice(0, 7);
    const month = months.get(monthKey) || { spend: 0, revenue: 0 };
    month.spend += row.spend;
    month.revenue += row.revenue;
    months.set(monthKey, month);
    monthlyCampaigns.set(row.channel, months);
    dates.push(date);
  }
  if (dates.length === 0) throw new Error('No campaign records are available for the selected channels.');

  const historicalSpend: Record<string, number> = {};
  const predictedRoi: Record<string, number> = {};
  for (const channel of channels) {
    const months = [...(monthlyCampaigns.get(channel)?.entries() || [])]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        ...values,
        roi: values.spend > 0 ? ((values.revenue - values.spend) / values.spend) * 100 : 0,
      }));
    if (months.length === 0) {
      throw new Error(`No campaign history is available for ${channel}; collect real campaign records before optimizing.`);
    }
    historicalSpend[channel] = months.reduce((total, month) => total + month.spend, 0) / months.length;
    const recentMonths = months.slice(-3);
    predictedRoi[channel] = recentMonths.reduce((total, month) => total + month.roi, 0) / recentMonths.length;
  }

  const lpModel: Model = {
    optimize: 'expectedProfit',
    opType: 'max',
    constraints: {
      budget: { equal: totalBudget },
      ...Object.fromEntries(channels.flatMap(channel => [
        [`min_${channel}`, { min: mins[channel] }],
        [`max_${channel}`, { max: maxs[channel] }],
      ])),
    },
    variables: Object.fromEntries(channels.map(channel => [
      channel,
      {
        expectedProfit: predictedRoi[channel] / 100,
        budget: 1,
        [`min_${channel}`]: 1,
        [`max_${channel}`]: 1,
      },
    ])),
  };
  const solution = lpSolver.Solve(lpModel) as Solution;
  if (!solution.feasible) {
    throw new Error('The budget constraints do not have a feasible linear-programming solution.');
  }

  const allocation = Object.fromEntries(channels.map(channel => [channel, Number(solution[channel] ?? 0)]));
  const totalAllocated = channels.reduce((total, channel) => total + allocation[channel], 0);
  const allocations: BudgetAllocationResult[] = channels.map(channel => {
    const budget = allocation[channel];
    const roi = predictedRoi[channel];
    const expectedRevenue = budget * (1 + roi / 100);
    const priorSpend = historicalSpend[channel];
    const changePct = priorSpend > 0 ? ((budget - priorSpend) / priorSpend) * 100 : 0;
    const boundHit: 'MIN' | 'MAX' | null = Math.abs(budget - mins[channel]) < 0.01
      ? 'MIN'
      : Math.abs(budget - maxs[channel]) < 0.01
        ? 'MAX'
        : null;

    return {
      channel,
      budget: Number(budget.toFixed(2)),
      sharePct: totalAllocated > 0 ? Number(((budget / totalAllocated) * 100).toFixed(1)) : 0,
      expectedRevenue: Math.round(expectedRevenue),
      roi: Number(roi.toFixed(1)),
      roas: Number((1 + roi / 100).toFixed(2)),
      marginalRoas: Number((1 + roi / 100).toFixed(2)),
      boundHit,
      historicalSpend: Number(priorSpend.toFixed(2)),
      changePct: Number(changePct.toFixed(1)),
    };
  });

  const totalExpectedRevenue = allocations.reduce((total, item) => total + item.expectedRevenue, 0);
  const overallROAS = totalAllocated > 0 ? Number((totalExpectedRevenue / totalAllocated).toFixed(2)) : 0;
  const overallROI = totalAllocated > 0
    ? Number((((totalExpectedRevenue - totalAllocated) / totalAllocated) * 100).toFixed(1))
    : 0;

  const equalAllocation = distributeBudget(totalBudget, channels, mins, maxs, {});
  const historicalAllocation = distributeBudget(totalBudget, channels, mins, maxs, historicalSpend);
  const estimateRevenue = (budgets: Record<string, number>) =>
    channels.reduce((total, channel) => total + budgets[channel] * (1 + predictedRoi[channel] / 100), 0);
  const equalRevenue = estimateRevenue(equalAllocation);
  const historicalRevenue = estimateRevenue(historicalAllocation);
  const baselines: Baseline[] = [
    {
      name: 'Equal Split (Constrained)',
      expectedRevenue: Math.round(equalRevenue),
      upliftPct: equalRevenue > 0 ? Number((((totalExpectedRevenue - equalRevenue) / equalRevenue) * 100).toFixed(1)) : 0,
    },
    {
      name: 'Historical Spend Mix',
      expectedRevenue: Math.round(historicalRevenue),
      upliftPct: historicalRevenue > 0
        ? Number((((totalExpectedRevenue - historicalRevenue) / historicalRevenue) * 100).toFixed(1))
        : 0,
    },
  ];

  const actionList: ActionRecommendation[] = allocations.map(item => {
    const difference = item.budget - item.historicalSpend;
    if (difference > 0.01) {
      return {
        type: 'increase',
        channel: item.channel,
        actionText: `Increase ${item.channel} budget by ₱${difference.toLocaleString()} (+${item.changePct}%)`,
        rationale: `Its recent campaign-month ROI estimate is ${item.roi}%, with estimated revenue of ₱${item.expectedRevenue.toLocaleString()}.`,
      };
    }
    if (difference < -0.01) {
      return {
        type: 'decrease',
        channel: item.channel,
        actionText: `Reduce ${item.channel} budget by ₱${Math.abs(difference).toLocaleString()} (${item.changePct}%)`,
        rationale: `Its recent campaign-month ROI estimate is ${item.roi}%; the LP allocates funds within the supplied channel bounds.`,
      };
    }
    return {
      type: 'maintain',
      channel: item.channel,
      actionText: `Maintain ${item.channel} spend at ₱${item.budget.toLocaleString()}`,
      rationale: 'The optimized allocation is approximately equal to its historical average spend.',
    };
  });

  const highestReturnChannel = [...allocations].sort((a, b) => b.roi - a.roi)[0];
  const insights = [
    `The LP solution allocates ₱${totalAllocated.toLocaleString()} and estimates ₱${totalExpectedRevenue.toLocaleString()} in campaign revenue.`,
    `${highestReturnChannel.channel} has the highest recent campaign-month ROI estimate (${highestReturnChannel.roi}%).`,
    'The solution respects the supplied budget and channel minimum/maximum bounds.',
  ];
  const inventoryPlan = await generateInventoryPlan(purchaseBudget);
  const sortedDates = [...dates].sort();

  return {
    totalBudget,
    totalAllocated,
    totalExpectedRevenue,
    overallROI,
    overallROAS,
    allocations,
    baselines,
    actionList,
    insights,
    inventoryPlan,
    generatedAt: new Date().toISOString(),
    dataRange: {
      from: sortedDates[0],
      to: sortedDates[sortedDates.length - 1],
      recordsUsed: rows.filter(row => channels.includes(row.channel)).length,
    },
  };
}

export async function generateInventoryPlan(purchaseBudget = 250000): Promise<InventoryPlanResponse> {
  if (!Number.isFinite(purchaseBudget) || purchaseBudget < 0) {
    throw new Error('Purchase budget must be a non-negative number.');
  }
  const monthlySeries = await descriptiveService.getMonthlySales();
  const completeMonthCount = monthlySeries.filter(month => !month.isPartial).length;
  const client = await pool.connect();
  try {
    const products = await client.query(`
      WITH product_sales AS (
        SELECT oi.product_id, SUM(oi.quantity) AS total_units_sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY oi.product_id
      ),
      purchase_history AS (
        SELECT product_id,
               AVG(lead_time_days) AS avg_lead_time,
               (array_agg(supplier ORDER BY purchase_date DESC))[1] AS supplier
        FROM inventory_purchases
        GROUP BY product_id
      )
      SELECT p.id, p.name, p.category, p.cost, p.price, p.stock, p.reorder_level,
             COALESCE(ps.total_units_sold, 0) AS total_units_sold,
             ph.avg_lead_time,
             ph.supplier
      FROM products p
      LEFT JOIN product_sales ps ON ps.product_id = p.id
      LEFT JOIN purchase_history ph ON ph.product_id = p.id
      ORDER BY p.stock ASC
    `);

    let remainingBudget = purchaseBudget;
    let totalCommitted = 0;
    const items: InventoryPlanItem[] = [];
    for (const row of products.rows) {
      const stock = Number(row.stock);
      const reorderLevel = Number(row.reorder_level);
      const leadTime = Math.max(0, Math.round(Number(row.avg_lead_time) || 0));
      const unitCost = Number(row.cost);
      const unitPrice = Number(row.price);
      const monthlyDemand = completeMonthCount > 0
        ? Math.round(Number(row.total_units_sold) / completeMonthCount)
        : 0;
      const reorderPoint = calculateROP(monthlyDemand, leadTime);
      const economicOrderQty = calculateEOQ(monthlyDemand * 12, unitCost);

      let priority: InventoryPlanItem['priority'] = 'Adequate';
      let recommendedQty = 0;
      if (stock <= reorderLevel || (reorderPoint > 0 && stock <= reorderPoint)) {
        priority = 'Immediate';
        if (monthlyDemand > 0) recommendedQty = Math.max(economicOrderQty, reorderLevel * 2 - stock);
      } else if (reorderPoint > 0 && stock <= reorderPoint * 1.5) {
        priority = 'Upcoming';
        recommendedQty = Math.round(economicOrderQty * 0.7);
      }

      const affordableQty = unitCost > 0 ? Math.floor(remainingBudget / unitCost) : 0;
      const orderQty = Math.min(recommendedQty, affordableQty);
      const totalCost = orderQty * unitCost;
      remainingBudget -= totalCost;
      totalCommitted += totalCost;

      items.push({
        productId: Number(row.id),
        productName: row.name,
        category: row.category,
        supplier: row.supplier || 'Not recorded',
        currentStock: stock,
        reorderLevel,
        reorderPoint,
        economicOrderQty,
        recommendedOrderQty: orderQty,
        unitCost,
        totalCost,
        priority,
        leadTimeDays: leadTime,
        projectedRevenue: orderQty * unitPrice,
      });
    }

    items.sort((a, b) => {
      const priorityOrder = { Immediate: 0, Upcoming: 1, Adequate: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.totalCost - a.totalCost;
    });
    const itemsToReorder = items.filter(item => item.recommendedOrderQty > 0);
    const projectedProfit = itemsToReorder.reduce((total, item) => total + item.projectedRevenue - item.totalCost, 0);

    return {
      purchaseBudget,
      totalCommittedCost: totalCommitted,
      remainingBudget,
      itemsToReorderCount: itemsToReorder.length,
      projectedProfit,
      items,
    };
  } finally {
    client.release();
  }
}
