// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, XAxis, YAxis, CartesianGrid
} from 'recharts';

const chartColors = ['#0C969C', '#6BA3BE', '#E3A008', '#10B981', '#274D60'];
const channelColors: Record<string, string> = {
  'Facebook': '#3B82F6',
  'Google Ads': '#F97316',
  'Email': '#10B981',
  'TikTok': '#A855F7',
  'Instagram': '#EC4899',
};
const defaultBudget = 100000;
const defaultPurchaseBudget = 250000;
const defaultMin: Record<string, number> = { 'Facebook': 5000, 'Google Ads': 5000, 'Email': 2000, 'TikTok': 3000, 'Instagram': 3000 };
const defaultMax: Record<string, number> = { 'Facebook': 40000, 'Google Ads': 40000, 'Email': 20000, 'TikTok': 30000, 'Instagram': 25000 };
const channels = ['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram'] as const;

export default function PrescriptiveTab() {
  const [totalBudget, setTotalBudget] = useState(defaultBudget);
  const [purchaseBudget, setPurchaseBudget] = useState(defaultPurchaseBudget);
  const [minPerChannel, setMinPerChannel] = useState(defaultMin);
  const [maxPerChannel, setMaxPerChannel] = useState(defaultMax);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConstraints, setShowConstraints] = useState(false);

  // Run initial optimization on mount
  useEffect(() => {
    handleOptimize();
  }, []);

  const handleOptimize = async () => {
    setError(null);

    // Validation checks
    const sumMin = Object.values(minPerChannel).reduce((a, b) => a + Number(b || 0), 0);
    const sumMax = Object.values(maxPerChannel).reduce((a, b) => a + Number(b || 0), 0);

    for (const ch of channels) {
      if (!Number.isFinite(Number(minPerChannel[ch])) || !Number.isFinite(Number(maxPerChannel[ch])) ||
          Number(minPerChannel[ch]) < 0 || Number(maxPerChannel[ch]) < 0) {
        setError(`Channel "${ch}": minimum and maximum spends must be finite, non-negative amounts.`);
        return;
      }
      if (Number(minPerChannel[ch]) > Number(maxPerChannel[ch])) {
        setError(`Channel "${ch}": Minimum spend (₱${minPerChannel[ch]}) cannot exceed Maximum spend (₱${maxPerChannel[ch]}).`);
        return;
      }
    }
    if (!Number.isFinite(totalBudget) || totalBudget <= 0 || !Number.isFinite(purchaseBudget) || purchaseBudget < 0) {
      setError('Marketing budget must be positive and purchase budget must be non-negative.');
      return;
    }
    if (sumMin > totalBudget) {
      setError(`Infeasible: Sum of minimum channel allocations (₱${sumMin.toLocaleString()}) exceeds total budget of ₱${totalBudget.toLocaleString()}.`);
      return;
    }
    if (sumMax < totalBudget) {
      setError(`Infeasible: Sum of maximum channel allocations (₱${sumMax.toLocaleString()}) is less than total budget. Increase channel maximums.`);
      return;
    }

    setLoading(true);
    try {
      const data = await analyticsService.getPrescriptive({
        totalBudget,
        minPerChannel,
        maxPerChannel,
        purchaseBudget,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const allocations = result?.allocations || [];
  const sumMin = Object.values(minPerChannel).reduce((a: number, b: any) => a + Number(b || 0), 0);
  const sumMax = Object.values(maxPerChannel).reduce((a: number, b: any) => a + Number(b || 0), 0);
  const hasInvalidBounds = channels.some((ch) => Number(minPerChannel[ch]) > Number(maxPerChannel[ch]));
  const infeasible = !Number.isFinite(totalBudget) || totalBudget <= 0 || totalBudget < sumMin || totalBudget > sumMax || hasInvalidBounds;

  // Before vs After comparison dataset
  const historicalMix = result?.historicalMixAllocation || {};
  const comparisonData = allocations.map((a: any) => ({
    channel: a.channel,
    historicalSpend: historicalMix[a.channel] ?? a.historicalSpend,
    originalHistoricalSpend: a.historicalSpend,
    recommendedSpend: a.budget,
  }));

  const pieData = allocations.map((a: any) => ({
    name: a.channel,
    value: a.budget,
  }));

  const commonTooltipStyle = {
    backgroundColor: 'rgba(3,23,22,0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  const axisColor = 'rgba(255,255,255,0.75)';
  const gridStroke = 'rgba(255,255,255,0.12)';

  const exportInventoryToCsv = () => {
    if (!result?.inventoryPlan?.items) return;
    const items = result.inventoryPlan.items;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Product Name,Category,Supplier,Current Stock,Reorder Level,Reorder Point (ROP),EOQ,Recommended Order Qty,Unit Cost,Total Cost,Priority',
        ...items.map((i: any) =>
          `"${i.productName}","${i.category}","${i.supplier}",${i.currentStock},${i.reorderLevel},${i.reorderPoint},${i.economicOrderQty},${i.recommendedOrderQty},${i.unitCost},${i.totalCost},"${i.priority}"`
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'prescriptive_inventory_plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllocationsToCsv = () => {
    const rows = allocations.map((item: any) => [
      item.channel,
      item.budget,
      item.sharePct,
      item.expectedRevenue,
      item.roi,
      item.historicalSpend,
    ]);
    const csv = [
      'Channel,Recommended Budget,Budget Share (%),Estimated Revenue,Estimated ROI (%),Historical Average Spend',
      ...rows.map((row: any[]) => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = 'prescriptive_budget_allocation.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 1. Marketing Budget Optimization Controls */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Prescriptive Marketing Budget Optimization
              <span className="bg-bright/20 text-bright text-xs px-2.5 py-0.5 rounded-full border border-bright/30">
                ROI-based Optimizer
              </span>
            </h3>
            <p className="text-xs text-white/75">
              Uses campaign-derived ROI estimates and the selected constraints to compare budget allocations.
            </p>
          </div>
          <span className="text-xs text-white/65 font-mono">Model: {result?.model || 'power-law'} (P1,000 steps)</span>
        </div>

        {/* Total Budget Slider + Input */}
        <div className="mb-6 glass-subtle p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-white/80">Monthly Marketing Budget</label>
            <span className="text-xl font-bold text-bright tabular-nums">{formatCurrency(totalBudget)}</span>
          </div>
          <input
            type="range"
            min={sumMin || 0}
            max={sumMax || 1}
            step={1000}
            value={Math.min(Math.max(totalBudget, sumMin || 0), sumMax || 1)}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-bright bg-white/10"
          />
          <div className="flex justify-between text-sm text-white/75 mt-1">
            <span>{formatCurrency(sumMin)} (Min)</span>
            <span>Current budget: {formatCurrency(result?.historicalAverageMonthlySpend ?? 100000)}</span>
            <span>{formatCurrency(sumMax)} (Max)</span>
          </div>
        </div>

        {/* Per-Channel Min/Max Constraints (collapsible) */}
        <button
          type="button"
          onClick={() => setShowConstraints((v) => !v)}
          className="text-xs text-white/75 hover:text-white mb-2 flex items-center gap-1"
        >
          {showConstraints ? '▼' : '▶'} Advanced channel constraints
        </button>
        {showConstraints && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {channels.map((channel) => (
            <div key={channel} className="glass-subtle rounded-xl p-3 space-y-2 border border-white/10">
              <span className="font-semibold text-white text-xs block">{channel}</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-xs text-white/75 uppercase block mb-1">Min (₱)</label>
                  <input
                    type="number"
                    value={minPerChannel[channel]}
                    onChange={(e) => setMinPerChannel(prev => ({ ...prev, [channel]: Number(e.target.value) }))}
                    className="w-full glass-input text-white px-2 py-1 rounded text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/75 uppercase block mb-1">Max (₱)</label>
                  <input
                    type="number"
                    value={maxPerChannel[channel]}
                    onChange={(e) => setMaxPerChannel(prev => ({ ...prev, [channel]: Number(e.target.value) }))}
                    className="w-full glass-input text-white px-2 py-1 rounded text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {infeasible && (
          <p className="text-xs text-amber-300 mb-3">Warning: current budget is outside the feasible range (sum of mins/maxs). Adjust bounds or budget.</p>
        )}
        <Button variant="primary" className="w-full py-2.5 text-sm font-bold shadow-glow" onClick={handleOptimize} disabled={loading || infeasible}>
          {loading ? <Loader /> : 'Optimize Budget & Generate Prescriptive Plan'}
        </Button>

        {error && <ErrorMessage message={error} className="mt-4" />}
      </Card>

      {result && (
        <>
          {/* 2. Before vs After Comparison & Share Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Before vs After Bar Chart */}
            <Card>
              <h3 className="text-base font-bold text-white mb-1">Before vs. After Allocation Comparison</h3>
              <p className="text-xs text-white/75 mb-3">Historical spend mix vs. prescribed optimal allocation</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="channel" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} width={64} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={(v: number, name: string, props: any) => {
                      if (name === 'Historical Average') {
                        const orig = props?.payload?.originalHistoricalSpend;
                        return [`${formatCurrency(v)} (scaled; original avg ${formatCurrency(orig)})`, name];
                      }
                      return [formatCurrency(v), name];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span className="text-white/80 text-xs">{v}</span>} />
                  <Bar dataKey="historicalSpend" name="Historical Average" fill="#6BA3BE" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="recommendedSpend" name="Prescribed Optimal" fill="#0C969C" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Prescribed Budget Share Donut */}
            <Card>
              <h3 className="text-base font-bold text-white mb-1">Prescribed Spend Distribution</h3>
              <p className="text-xs text-white/75 mb-3">Share of capital allocated per channel</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={channelColors[entry.name] || chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={commonTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span className="text-white/80 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* 3. Action Recommendations List & Uplift Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Written Action List */}
            <Card className="lg:col-span-2">
              <h3 className="text-base font-bold text-white mb-1">Prescribed Action Plan</h3>
              <p className="text-xs text-white/75 mb-4">Concrete tactical reallocations based on channel ROI (constant ROI per channel; elasticity not estimated from data)</p>
              <div className="space-y-3">
                {result.actionList?.map((action: any, idx: number) => {
                  const icon = action.type === 'increase' ? '↑' : action.type === 'decrease' ? '↓' : '→';
                  const badgeClass =
                    action.type === 'increase'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : action.type === 'decrease'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/10 text-white/70 border-white/15';

                  return (
                    <div key={idx} className="glass-subtle p-3.5 rounded-xl border border-white/10 flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border ${badgeClass}`}>
                        {icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{action.actionText}</p>
                        <p className="text-sm text-white/65 mt-0.5">{action.rationale}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Baseline Uplift & Key Metrics */}
            <Card>
              <h3 className="text-base font-bold text-white mb-1">Expected Financial Impact</h3>
              <p className="text-xs text-white/75 mb-4">Optimized plan vs alternative baselines</p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 glass-subtle">
                  <p className="text-xs uppercase tracking-wider text-emerald-300/80 font-semibold">Total Expected Revenue</p>
                  <p className="text-2xl font-bold text-emerald-300 tabular-nums">{formatCurrency(result.totalExpectedRevenue)}</p>
                  <p className="text-xs text-white/70 mt-1">
                    Overall Expected ROI: <strong className="text-emerald-300">{result.overallROI}%</strong>
                  </p>
                  {result.totalExpectedRevenueUncapped != null && result.totalExpectedRevenueUncapped !== result.totalExpectedRevenue && (
                    <p className="text-xs text-white/65 mt-1">
                      Uncapped model estimate: {formatCurrency(result.totalExpectedRevenueUncapped)} (capped at {formatCurrency(result.revenueCap)} = 30% of forecast)
                    </p>
                  )}
                  <p className="text-xs text-white/65 mt-2">Attributed revenue estimated from historical campaign data; not a guaranteed result.</p>
                </div>

                {result.baselines?.map((bl: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl glass-subtle border border-white/10 text-xs">
                    <div className="flex justify-between text-white/70">
                      <span>{bl.name}:</span>
                      <span className="font-semibold text-white">{formatCurrency(bl.expectedRevenue)}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span className="text-white/65">Prescribed Plan Uplift:</span>
                      <span className={bl.upliftPct >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {bl.upliftPct >= 0 ? '+' : ''}{bl.upliftPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 4. Results Allocation Table */}
          <Card>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Optimized Allocation Details</h3>
                <p className="text-xs text-white/75">Channel level spend, share %, estimated returns, and bound status</p>
              </div>
              <button onClick={exportAllocationsToCsv} className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15">
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3 text-right">Prescribed Budget</th>
                    <th className="py-2.5 px-3 text-right">Budget Share</th>
                    <th className="py-2.5 px-3 text-right">Expected Revenue</th>
                    <th className="py-2.5 px-3 text-right">Expected ROI</th>
                    <th className="py-2.5 px-3 text-right">ROAS</th>
                    <th className="py-2.5 px-3 text-center">Constraint Bound</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allocations.map((a: any) => (
                    <tr key={a.channel} className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">{a.channel}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-bright tabular-nums">{formatCurrency(a.budget)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white/80 tabular-nums">{a.sharePct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white font-semibold tabular-nums">{formatCurrency(a.expectedRevenue)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-300 tabular-nums">{a.roi}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white/70 tabular-nums">{a.roas}x</td>
                      <td className="py-2.5 px-3 text-center">
                        {a.boundHit ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            a.boundHit === 'MAX' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/75'
                          }`}>
                            {a.boundHit} Limit
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs">Optimal Interior</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 5. Inventory Reorder Plan (ROP & EOQ) within Purchase Budget */}
          {result.inventoryPlan && (
            <Card>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Prescriptive Inventory Purchasing Plan
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      ROP & EOQ Model
                    </span>
                  </h3>
                  <p className="text-xs text-white/75">
                    Allocates inventory purchase budget to highest-priority items based on Economic Order Quantity (EOQ) and Reorder Points (ROP)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="glass px-3 py-1.5 rounded-lg text-xs text-white/80 border border-white/15">
                    Budget: <strong className="text-bright">{formatCurrency(result.inventoryPlan.purchaseBudget)}</strong> |
                    Committed: <strong className="text-emerald-300">{formatCurrency(result.inventoryPlan.totalCommittedCost)}</strong>
                  </div>
                  <button
                    onClick={exportInventoryToCsv}
                    className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Plan CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Preferred Supplier</th>
                      <th className="py-2.5 px-3 text-right">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Reorder Point</th>
                      <th className="py-2.5 px-3 text-right">EOQ</th>
                      <th className="py-2.5 px-3 text-right">Order Qty</th>
                      <th className="py-2.5 px-3 text-right">Est. Cost</th>
                      <th className="py-2.5 px-3 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.inventoryPlan.items.slice(0, 15).map((item: any) => {
                      const prioClass =
                        item.priority === 'Immediate'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : item.priority === 'Upcoming'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';

                      return (
                        <tr key={item.productId} className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white">{item.productName}</td>
                          <td className="py-2.5 px-3 text-white/70">{item.category}</td>
                          <td className="py-2.5 px-3 text-white/70">
                            <span className="truncate block max-w-[140px]" title={item.supplier}>{item.supplier}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">{item.currentStock}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-white/75 tabular-nums">{item.reorderPoint}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-white/70 tabular-nums">{item.economicOrderQty}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-bright tabular-nums">
                            {item.recommendedOrderQty > 0 ? `${item.recommendedOrderQty} units` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-white tabular-nums">
                            {item.totalCost > 0 ? formatCurrency(item.totalCost) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${prioClass}`}>
                              {item.priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
