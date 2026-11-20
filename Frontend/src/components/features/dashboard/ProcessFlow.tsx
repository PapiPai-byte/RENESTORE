// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';

export default function ProcessFlowTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState(100000);
  const [purchaseBudget, setPurchaseBudget] = useState(250000);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      analyticsService.getProcessFlow(totalBudget, purchaseBudget)
        .then((d) => {
          if (!active) return;
          setData(d);
          setError(null);
          setLoading(false);
        })
        .catch((e) => {
          if (!active) return;
          setError(e.message || 'Unable to load process-flow analytics.');
          setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [totalBudget, purchaseBudget]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[300px]" />
      </div>
    );
  }
  if (!data) return <Card><p className="text-sm text-red-200">{error || 'Unable to load process-flow analytics.'}</p></Card>;

  const { descriptive, predictive, prescriptive, decision } = data;

  const handleJump = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Pipeline Header */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Business Analytics Process Flow
              <span className="bg-bright/20 text-bright text-xs px-2.5 py-0.5 rounded-full border border-bright/30">
                Requirement R6: Step-Wise Data Pipeline
              </span>
            </h3>
            <p className="text-xs text-white/75 mt-1">
            Shows how database-derived descriptive results feed predictive estimates and prescriptive scenarios.
            </p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-medium">
            Live Database Pipeline
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <label className="text-xs text-white/70">
            Marketing scenario budget
            <input
              type="number"
              min={18000}
              max={155000}
              step={5000}
              value={totalBudget}
              onChange={(event) => setTotalBudget(Number(event.target.value))}
              className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white"
            />
          </label>
          <label className="text-xs text-white/70">
            Inventory purchase budget
            <input
              type="number"
              min={0}
              step={5000}
              value={purchaseBudget}
              onChange={(event) => setPurchaseBudget(Number(event.target.value))}
              className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white"
            />
          </label>
        </div>
        <p className="text-sm text-white/65 mt-2">Changing either budget recalculates the flow using its configured channel bounds.</p>
        {error && data && <p className="text-xs text-red-200 mt-2">{error}</p>}
      </Card>

      {/* 4 Connected Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {/* Step 1: Descriptive */}
        <div className="glass rounded-2xl p-5 border border-bright/30 flex flex-col justify-between hover:shadow-glass transition-all relative group lg:after:content-['→'] lg:after:absolute lg:after:-right-4 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:z-10 lg:after:text-white/75 lg:after:text-xl">
          <div className="absolute -top-3 left-4 bg-gradient-to-r from-bright to-teal-500 text-abyss font-bold text-xs px-2.5 py-0.5 rounded-full shadow">
            Step 1: Descriptive
          </div>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/75">
              <span>"What Happened?"</span>
              <span className="text-bright font-mono font-bold">Historical Data</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Peak Revenue Month</span>
                <span className="text-base font-bold text-white">{descriptive.peakMonth || 'Not available'}</span>
                <span className="text-sm text-bright block">{descriptive.peakMonthRevenue == null ? 'No complete month' : formatCurrency(descriptive.peakMonthRevenue)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Top Category</span>
                <span className="text-sm font-bold text-white">{descriptive.topCategory || 'Not available'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Best Channel by Historical ROI</span>
                <span className="text-sm font-bold text-emerald-300">{descriptive.bestChannel ? `${descriptive.bestChannel} (${descriptive.bestChannelRoi}%)` : 'Not available'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/75">Feeds → Monthly Trends</span>
            <button
              onClick={() => handleJump('Descriptive')}
              className="text-xs text-bright hover:underline font-semibold flex items-center gap-1"
            >
              See Details →
            </button>
          </div>
        </div>

        {/* Step 2: Predictive */}
        <div className="glass rounded-2xl p-5 border border-sky-400/30 flex flex-col justify-between hover:shadow-glass transition-all relative group lg:after:content-['→'] lg:after:absolute lg:after:-right-4 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:z-10 lg:after:text-white/75 lg:after:text-xl">
          <div className="absolute -top-3 left-4 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow">
            Step 2: Predictive
          </div>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/75">
              <span>"What Will Happen?"</span>
              <span className="text-sky-300 font-mono font-bold">Forecast Models</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Recommended Model</span>
                <span className="text-sm font-bold text-white">{predictive.modelUsed}</span>
                <span className="text-sm text-sky-300 block font-mono">R² = {predictive.rSquared} | RMSE ₱{predictive.rmse?.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Next Quarter Forecast</span>
                <span className="text-base font-bold text-sky-300 tabular-nums">{formatCurrency(predictive.nextQuarterForecast)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Stockout Risks</span>
                <span className="text-sm font-bold text-amber-300">{predictive.highRiskStockoutCount} high risk items</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Predicted Channel ROI</span>
                {(predictive.predictedChannelRoi || []).map((channel: any) => (
                  <span key={channel.channel} className="flex justify-between gap-2 text-sm text-white/80 mt-1">
                    <span>{channel.channel}</span><strong>{channel.predictedRoi}%</strong>
                  </span>
                ))}
                {predictive.predictedChannelRoi?.length === 0 && <span className="text-sm text-white/75">No campaign history</span>}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/75">Feeds → Elasticities & Risk</span>
            <button
              onClick={() => handleJump('Predictive')}
              className="text-xs text-sky-300 hover:underline font-semibold flex items-center gap-1"
            >
              See Details →
            </button>
          </div>
        </div>

        {/* Step 3: Prescriptive */}
        <div className="glass rounded-2xl p-5 border border-amber-400/30 flex flex-col justify-between hover:shadow-glass transition-all relative group lg:after:content-['→'] lg:after:absolute lg:after:-right-4 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:z-10 lg:after:text-white/75 lg:after:text-xl">
          <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-abyss font-bold text-xs px-2.5 py-0.5 rounded-full shadow">
            Step 3: Prescriptive
          </div>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/75">
              <span>"What Should We Do?"</span>
              <span className="text-amber-300 font-mono font-bold">Optimization</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Optimized Budget Split</span>
                <span className="text-base font-bold text-white tabular-nums">{formatCurrency(prescriptive.recommendedBudget)}</span>
                <span className="text-sm text-emerald-300 block">Top Channel: {prescriptive.topBudgetChannel}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Expected Marketing Revenue</span>
                <span className="text-base font-bold text-emerald-300 tabular-nums">{formatCurrency(prescriptive.expectedMarketingRevenue)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">EOQ Reorder Orders</span>
                <span className="text-sm font-bold text-amber-300">{prescriptive.reorderItemCount} items (₱{prescriptive.reorderCommittedCost?.toLocaleString()})</span>
                {(prescriptive.reorderItems || []).map((item: any) => (
                  <span key={item.productName} className="flex justify-between gap-2 text-sm text-white/80 mt-1">
                    <span>{item.productName} × {item.quantity}</span><strong>{formatCurrency(item.totalCost)}</strong>
                  </span>
                ))}
                {prescriptive.reorderItems?.length === 0 && <span className="block text-sm text-white/75 mt-1">No products currently meet reorder criteria.</span>}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-white/65 block text-xs uppercase">Recommended Channel Split</span>
                {(prescriptive.allocations || []).map((allocation: any) => (
                  <span key={allocation.channel} className="flex justify-between gap-2 text-sm text-white/80 mt-1">
                    <span>{allocation.channel} ({allocation.predictedRoi}% ROI)</span><strong>{formatCurrency(allocation.budget)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/75">Feeds → Final Decision</span>
            <button
              onClick={() => handleJump('Prescriptive')}
              className="text-xs text-amber-300 hover:underline font-semibold flex items-center gap-1"
            >
              See Details →
            </button>
          </div>
        </div>

        {/* Step 4: Decision Execution */}
        <div className="glass rounded-2xl p-5 border border-emerald-400/30 flex flex-col justify-between hover:shadow-glass transition-all relative group bg-emerald-500/5">
          <div className="absolute -top-3 left-4 bg-gradient-to-r from-emerald-400 to-green-600 text-abyss font-bold text-xs px-2.5 py-0.5 rounded-full shadow">
            Step 4: Decision Impact
          </div>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/75">
              <span>"Action & Execution"</span>
              <span className="text-emerald-300 font-mono font-bold">Outcome</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-200/70 block text-xs uppercase">Next-Quarter Average Monthly Forecast</span>
                <span className="text-lg font-bold text-emerald-300 tabular-nums">{formatCurrency(decision.projectedMonthlyRevenue)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-200/70 block text-xs uppercase">Estimated Marketing Scenario Uplift</span>
                <span className="text-sm font-bold text-white">
                  {decision.expectedMarketingUplift == null
                    ? 'Not available'
                    : `${decision.expectedMarketingUplift > 0 ? '+' : ''}${decision.expectedMarketingUplift}% vs historical mix`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-200/70 block text-xs uppercase">Products Flagged High Risk</span>
                <span className="text-sm font-bold text-white">{decision.highRiskProducts} products</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-200/70 block text-xs uppercase">Estimated Marketing Return After Spend</span>
                <span className="text-sm font-bold text-white">{formatCurrency(decision.expectedMarketingProfit)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-emerald-200/90 font-medium">Scenario estimate</span>
            <button
              onClick={() => handleJump('Case Study')}
              className="text-xs text-emerald-300 hover:underline font-semibold flex items-center gap-1"
            >
              Read Case Study →
            </button>
          </div>
        </div>
      </div>

      {/* Methodology Description Card */}
      <Card>
        <h3 className="text-base font-bold text-white mb-2">How Step-Wise Analytics Connects</h3>
        <p className="text-xs text-white/70 leading-relaxed">
          1. <strong>Descriptive Analytics</strong> analyzes historical orders, customer cohorts, and marketing performance to establish the revenue baseline (₱{descriptive.totalRevenue?.toLocaleString()}), identify profit drivers (top category: {descriptive.topCategory}), and determine channel ROI.<br />
          2. <strong>Predictive Analytics</strong> takes this cleaned historical monthly time-series and fits forecasting models (Linear Regression and Moving Average), evaluating R² ({predictive.rSquared}) and RMSE to project forward revenue (₱{predictive.nextQuarterForecast?.toLocaleString()} next quarter) and pinpoint inventory stockout risks.<br />
          3. <strong>Prescriptive Analytics</strong> uses recent campaign ROI estimates in a linear program with selected budget bounds and computes inventory reorder quantities using EOQ and reorder-point formulas.<br />
          4. <strong>Decision Summary</strong> reports scenario-based marketing return estimates and products flagged for inventory review. Outcomes are not guaranteed and depend on the quality and coverage of available records.
        </p>
      </Card>
    </div>
  );
}
