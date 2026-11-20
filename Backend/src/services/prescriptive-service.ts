import { pool } from '../db';
import descriptiveService from './descriptive-service';
import { calculateEOQ, calculateROP } from './analytics-shared';
import { getChannelRoiMap, MIN_CAMPAIGN_SPEND } from './channel-roi';
import { getForecastMonthlyRevenue, getPeakMonthlyRevenue, ATTRIBUTION_SHARE } from './store-forecast';

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
  model: 'power-law' | 'constant-roi';
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
  totalExpectedRevenueUncapped: number;
  revenueCap: number;
  capped: boolean;
  overallROI: number;
  overallROAS: number;
  model: string;
  historicalAverageMonthlySpend: number;
  historicalMixAllocation?: Record<string, number>;
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
  const channelRoiMap = await getChannelRoiMap();
  const channelModels: Record<string, 'power-law' | 'constant-roi'> = {};
  const powerParams: Record<string, { a: number; b: number; roi: number }> = {};
  const campaignMonthsByChannel: Record<string, { spend: number; revenue: number }[]> = {};

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

    const fitPoints = (rows || [])
      .filter(r => r.channel === channel && r.spend >= MIN_CAMPAIGN_SPEND && r.spend > 0 && r.revenue > 0)
      .map(r => ({ spend: r.spend, revenue: r.revenue }));
    campaignMonthsByChannel[channel] = fitPoints;

    const sharedRoi = channelRoiMap[channel]?.roi ?? months[months.length - 1].roi;
    let usePower = false;
    let a = 0;
    let b = 0.5;
    if (fitPoints.length >= 6) {
      const xs = fitPoints.map(m => Math.log(m.spend));
      const ys = fitPoints.map(m => Math.log(Math.max(m.revenue, 1e-9)));
      const n = xs.length;
      const meanX = xs.reduce((s, x) => s + x, 0) / n;
      const meanY = ys.reduce((s, y) => s + y, 0) / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - meanX) * (ys[i] - meanY);
        den += (xs[i] - meanX) ** 2;
      }
      b = den > 0 ? num / den : 0.5;
      if (!Number.isFinite(b)) b = 0.5;
      b = Math.min(0.9, Math.max(0.2, b));
      const intercept = meanY - b * meanX;
      a = Math.exp(intercept);
      usePower = true;
    }

    if (usePower) {
      channelModels[channel] = 'power-law';
      powerParams[channel] = { a, b, roi: sharedRoi };
    } else {
      channelModels[channel] = 'constant-roi';
      powerParams[channel] = { a: 0, b: 0, roi: sharedRoi };
    }
  }

  function channelRevenue(channel: string, spend: number): number {
    const p = powerParams[channel];
    if (channelModels[channel] === 'power-law') {
      return p.a * Math.pow(Math.max(spend, 0), p.b);
    }
    return spend * (1 + p.roi / 100);
  }

  function marginalRevenue(channel: string, spend: number): number {
    const p = powerParams[channel];
    if (channelModels[channel] === 'power-law') {
      const s = Math.max(spend, 1);
      return p.a * p.b * Math.pow(s, p.b - 1);
    }
    return 1 + p.roi / 100;
  }

  const current: Record<string, number> = Object.fromEntries(channels.map(c => [c, mins[c]]));
  let remaining = totalBudget - channels.reduce((t, c) => t + mins[c], 0);
  while (remaining > 1e-9) {
    let best: string | null = null;
    let bestMarg = -Infinity;
    for (const ch of channels) {
      const capRemaining = maxs[ch] - current[ch];
      if (capRemaining > 1e-9) {
        const m = marginalRevenue(ch, current[ch]);
        if (m > bestMarg) {
          bestMarg = m;
          best = ch;
        }
      }
    }
    if (!best) break;
    const capRemaining = maxs[best] - current[best];
    const step = Math.min(1000, remaining, capRemaining);
    if (step <= 1e-9) break;
    current[best] += step;
    remaining -= step;
  }

  const allocation = { ...current };
  const totalAllocated = channels.reduce((total, channel) => total + allocation[channel], 0);

  const allocations: BudgetAllocationResult[] = channels.map(channel => {
    const budget = allocation[channel];
    const roi = channelRoiMap[channel]?.roi ?? powerParams[channel].roi;
    const expectedRevenue = channelRevenue(channel, budget);
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
      model: channelModels[channel],
    };
  });

  const totalExpectedRevenueUncapped = allocations.reduce((total, item) => total + item.expectedRevenue, 0);

  // Cap expected revenue
  const forecastMonthlyRevenue = await getForecastMonthlyRevenue();
  const peakMonthlyRevenue = forecastMonthlyRevenue == null ? await getPeakMonthlyRevenue() : 0;
  const capBase = forecastMonthlyRevenue != null ? forecastMonthlyRevenue : peakMonthlyRevenue;
  const revenueCap = Math.round(capBase * ATTRIBUTION_SHARE);
  const cappedRevenue = Math.min(totalExpectedRevenueUncapped, revenueCap);
  const capped = totalExpectedRevenueUncapped > revenueCap;

  // Scale per-channel expected revenue to capped total
  if (totalExpectedRevenueUncapped > 0 && capped) {
    const ratio = cappedRevenue / totalExpectedRevenueUncapped;
    for (const a of allocations) {
      a.expectedRevenue = Math.round(a.expectedRevenue * ratio);
    }
  }
  const totalExpectedRevenue = capped ? cappedRevenue : totalExpectedRevenueUncapped;

  const overallROAS = totalAllocated > 0 ? Number((totalExpectedRevenue / totalAllocated).toFixed(2)) : 0;
  const overallROI = totalAllocated > 0
    ? Number((((totalExpectedRevenue - totalAllocated) / totalAllocated) * 100).toFixed(1))
    : 0;

  const equalAllocation = distributeBudget(totalBudget, channels, mins, maxs, {});
  const historicalAllocation = distributeBudget(totalBudget, channels, mins, maxs, historicalSpend);
  const estimateRevenue = (budgets: Record<string, number>) =>
    channels.reduce((total, channel) => total + channelRevenue(channel, budgets[channel]), 0);
  const equalRevenue = estimateRevenue(equalAllocation);
  const historicalRevenue = estimateRevenue(historicalAllocation);
  const baselines: Baseline[] = [
    {
      name: 'Equal Split (Constrained)',
      expectedRevenue: Math.round(equalRevenue),
      upliftPct: equalRevenue > 0 ? Number((((totalExpectedRevenueUncapped - equalRevenue) / equalRevenue) * 100).toFixed(1)) : 0,
    },
    {
      name: 'Historical Mix (same budget)',
      expectedRevenue: Math.round(historicalRevenue),
      upliftPct: historicalRevenue > 0
        ? Number((((totalExpectedRevenueUncapped - historicalRevenue) / historicalRevenue) * 100).toFixed(1))
        : 0,
    },
  ];

  const roiRankMap = new Map<string, number>();
  const sortedByRoi = [...channels].sort((a, b) => {
    const roiDiff = (channelRoiMap[b]?.roi ?? 0) - (channelRoiMap[a]?.roi ?? 0);
    if (roiDiff !== 0) return roiDiff;
    const revDiff = (channelRoiMap[b]?.totalRevenue ?? 0) - (channelRoiMap[a]?.totalRevenue ?? 0);
    if (revDiff !== 0) return revDiff;
    return a.localeCompare(b);
  });
  sortedByRoi.forEach((c, i) => roiRankMap.set(c, i + 1));
  const totalChannels = channels.length;

  const actionList: ActionRecommendation[] = allocations.map(item => {
    const difference = item.budget - item.historicalSpend;
    const rank = roiRankMap.get(item.channel) ?? totalChannels;
    const boundNote = item.boundHit === 'MAX'
      ? ' (limited by maximum bound)'
      : item.boundHit === 'MIN'
        ? ' (limited by minimum bound)'
        : '';

    if (difference > 0.01) {
      if (item.boundHit === 'MAX') {
        return {
          type: 'increase',
          channel: item.channel,
          actionText: `Increase ${item.channel} to its maximum (₱${item.budget.toLocaleString()}). ${item.channel} ranks ${rank} of ${totalChannels} by ROI${boundNote}.`,
          rationale: `Its historical ROI is ${item.roi}%, with estimated revenue of ₱${item.expectedRevenue.toLocaleString()}.`,
        };
      }
      return {
        type: 'increase',
        channel: item.channel,
        actionText: `Increase ${item.channel} by ₱${Math.abs(difference).toLocaleString()} (+${item.changePct}%). ${item.channel} ranks ${rank} of ${totalChannels} by ROI${boundNote}.`,
        rationale: `Its historical ROI is ${item.roi}%, with estimated revenue of ₱${item.expectedRevenue.toLocaleString()}.`,
      };
    }
    if (difference < -0.01) {
      if (item.boundHit === 'MIN') {
        return {
          type: 'decrease',
          channel: item.channel,
          actionText: `Reduce ${item.channel} to its minimum (₱${item.budget.toLocaleString()}). ${item.channel} ranks ${rank} of ${totalChannels} by ROI${boundNote}.`,
          rationale: `Its historical ROI is ${item.roi}%; funds move to higher-return channels.`,
        };
      }
      return {
        type: 'decrease',
        channel: item.channel,
        actionText: `Reduce ${item.channel} by ₱${Math.abs(difference).toLocaleString()} (${item.changePct}%). ${item.channel} ranks ${rank} of ${totalChannels} by ROI, so funds move to higher-return channels${boundNote}.`,
        rationale: `Its historical ROI is ${item.roi}%; the optimizer allocates funds within the supplied channel bounds.`,
      };
    }
    return {
      type: 'maintain',
      channel: item.channel,
      actionText: `Maintain ${item.channel} spend at ₱${item.budget.toLocaleString()}. ${item.channel} ranks ${rank} of ${totalChannels} by ROI${boundNote}.`,
      rationale: 'The optimized allocation is approximately equal to its historical average spend.',
    };
  });

  const highestReturnChannel = [...allocations].sort((a, b) => b.roi - a.roi)[0];
  const historicalAverageMonthlySpend = channels.reduce((t, c) => t + historicalSpend[c], 0);
  const insights = [
    `The optimizer allocates ₱${totalAllocated.toLocaleString()} and estimates ₱${totalExpectedRevenue.toLocaleString()} in capped campaign revenue.`,
    `${highestReturnChannel.channel} has the highest historical ROI (${highestReturnChannel.roi}%).`,
    'The solution respects the supplied budget and channel minimum/maximum bounds.',
  ];
  const inventoryPlan = await generateInventoryPlan(purchaseBudget);
  const sortedDates = [...dates].sort();

  return {
    totalBudget,
    totalAllocated,
    totalExpectedRevenue,
    totalExpectedRevenueUncapped,
    revenueCap,
    capped,
    historicalMixAllocation: historicalAllocation,
    overallROI,
    overallROAS,
    model: channelModels && Object.values(channelModels).every(m => m === 'power-law') ? 'power-law' : (Object.values(channelModels).every(m => m === 'constant-roi') ? 'constant-roi' : 'mixed'),
    historicalAverageMonthlySpend,
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
      const dbReorderLevel = Number(row.reorder_level);
      const leadTime = Math.max(0, Math.round(Number(row.avg_lead_time) || 0));
      const unitCost = Number(row.cost);
      const unitPrice = Number(row.price);
      const monthlyDemand = completeMonthCount > 0
        ? Math.round((Number(row.total_units_sold) / completeMonthCount) * 10) / 10
        : 0;
      const reorderPoint = calculateROP(monthlyDemand, leadTime);
      const reorderLevel = reorderPoint > 0 ? reorderPoint : dbReorderLevel;
      const economicOrderQty = calculateEOQ(Math.max(1, monthlyDemand) * 12, unitCost);

      let priority: InventoryPlanItem['priority'] = 'Adequate';
      let recommendedQty = 0;
      if (monthlyDemand <= 0) {
        priority = 'Adequate';
        recommendedQty = 0;
      } else if (stock <= reorderLevel || (reorderPoint > 0 && stock <= reorderPoint)) {
        priority = 'Immediate';
        recommendedQty = Math.max(1, Math.min(economicOrderQty, Math.ceil(monthlyDemand * 3)));
      } else if (reorderPoint > 0 && stock <= reorderPoint * 1.5) {
        priority = 'Upcoming';
        recommendedQty = Math.max(1, Math.min(Math.ceil(economicOrderQty * 0.5), Math.ceil(monthlyDemand * 2)));
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
        supplier: row.supplier || 'Supplier not set',
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
