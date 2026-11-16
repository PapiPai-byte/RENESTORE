// @ts-nocheck
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const chartColors = ['#0C969C', '#6BA3BE', '#E3A008', '#1F9D6B', '#274D60'];
const defaultBudget = 100000;
const defaultMin: Record<string, number> = { 'Facebook': 5000, 'Google Ads': 5000, 'Email': 2000, 'TikTok': 3000, 'Instagram': 3000 };
const defaultMax: Record<string, number> = { 'Facebook': 50000, 'Google Ads': 50000, 'Email': 20000, 'TikTok': 30000, 'Instagram': 25000 };
const channels = ['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram'] as const;

export default function PrescriptiveTab() {
  const [totalBudget, setTotalBudget] = useState(defaultBudget);
  const [minPerChannel, setMinPerChannel] = useState(defaultMin);
  const [maxPerChannel, setMaxPerChannel] = useState(defaultMax);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await analyticsService.getPrescriptive({ totalBudget, minPerChannel, maxPerChannel });
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const allocationData = result?.allocation?.map((a: any) => ({
    name: a.channel,
    value: a.recommendedSpend,
  })) || [];

  const commonTooltipStyle = {
    backgroundColor: 'rgba(3,23,22,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  };

  return (
    <div className="space-y-6">
      {/* Budget Controls */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-4">Budget Allocation</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/70 mb-2">
            Total Budget:{' '}
            <span className="text-bright font-bold">{formatCurrency(totalBudget)}</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-bright"
              style={{
                background: `linear-gradient(to right, #0C969C 0%, #0C969C ${((totalBudget - 10000) / 190000) * 100}%, rgba(255,255,255,0.1) ${((totalBudget - 10000) / 190000) * 100}%)`,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-bright shadow-[0_0_15px_rgba(12,150,156,0.6)] border-2 border-abyss pointer-events-none transition-all"
              style={{ left: `calc(${((totalBudget - 10000) / 190000) * 100}% - 10px)` }}
            />
          </div>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="mt-2 w-full max-w-xs glass-input text-white px-3 py-2 rounded-xl"
            min={10000}
            max={200000}
            step={5000}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map(channel => (
            <div key={channel} className="glass-subtle rounded-xl p-4 space-y-3">
              <p className="font-semibold text-white text-sm">{channel}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1 block">Min</label>
                  <input
                    type="number"
                    value={minPerChannel[channel]}
                    onChange={(e) => setMinPerChannel(prev => ({ ...prev, [channel]: Number(e.target.value) }))}
                    className="w-full glass-input text-white px-2 py-1.5 rounded-lg text-sm"
                    aria-label={`${channel} minimum budget`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1 block">Max</label>
                  <input
                    type="number"
                    value={maxPerChannel[channel]}
                    onChange={(e) => setMaxPerChannel(prev => ({ ...prev, [channel]: Number(e.target.value) }))}
                    className="w-full glass-input text-white px-2 py-1.5 rounded-lg text-sm"
                    aria-label={`${channel} maximum budget`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="primary" className="mt-6 w-full" onClick={handleOptimize} disabled={loading}>
          {loading ? <Loader /> : 'Optimize Budget'}
        </Button>
        {error && <ErrorMessage message={error} className="mt-4" />}
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <Card>
              <h3 className="text-lg font-bold text-white mb-1">Recommended Allocation</h3>
              <p className="text-sm text-white/65 mb-4">Spend distribution across channels</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="rgba(3,23,22,0.5)"
                      strokeWidth={2}
                    >
                      {allocationData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    {/* Center label */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold"
                      style={{ fontSize: '16px', fill: '#fff' }}
                    >
                      {formatCompactCurrency(result.totalBudget || totalBudget)}
                    </text>
                    <text
                      x="50%"
                      y="calc(50% + 18px)"
                      textAnchor="middle"
                      style={{ fontSize: '11px', fill: 'rgba(255,255,255,0.5)' }}
                    >
                      Total Budget
                    </text>
                    <Tooltip contentStyle={commonTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Legend
                      wrapperStyle={{ paddingTop: '16px' }}
                      formatter={(value: string) => <span className="text-white/70 text-xs">{value}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Results Table */}
            <Card>
              <h3 className="text-lg font-bold text-white mb-4">Allocation Results</h3>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/10 backdrop-blur border-b border-white/10">
                      {['Channel', 'Budget', 'Expected Rev.', 'ROI'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white/70 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.allocation.map((a: any) => (
                      <tr key={a.channel} className="hover:bg-white/10 transition-colors">
                        <td className="px-3 py-3 font-medium text-white whitespace-nowrap">{a.channel}</td>
                        <td className="px-3 py-3 text-white/65 tabular-nums whitespace-nowrap">{formatCurrency(a.recommendedSpend)}</td>
                        <td className="px-3 py-3 text-white/65 tabular-nums">{formatCurrency(a.expectedRevenue)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            a.expectedRoi >= 300 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : a.expectedRoi >= 200 ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {a.expectedRoi}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between font-bold text-white">
                <span className="text-white/70 text-sm">Total Expected Revenue</span>
                <span className="text-bright text-lg font-bold">{formatCurrency(result.totalExpectedRevenue)}</span>
              </div>
            </Card>
          </div>

          {/* Stock Recommendations */}
          <Card>
            <h3 className="text-lg font-bold text-white mb-4">Stock Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.stockRecommendations.map((rec: any, idx: number) => {
                const isIncrease = rec.action.includes('Increase');
                const isDecrease = rec.action.includes('Reduce');
                const accentColor = isIncrease ? 'border-emerald-400/60' : isDecrease ? 'border-red-400/60' : 'border-amber-400/60';
                const bgColor = isIncrease ? 'bg-emerald-500/5' : isDecrease ? 'bg-red-500/5' : 'bg-amber-500/5';
                const badgeType: any = isIncrease ? 'success' : isDecrease ? 'danger' : 'accent';
                return (
                  <div key={idx} className={`p-4 rounded-xl border-l-4 ${accentColor} ${bgColor} glass-subtle`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isIncrease ? 'bg-emerald-500/20 text-emerald-400'
                        : isDecrease ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isIncrease ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        ) : isDecrease ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white mb-1">{rec.category}</p>
                        <Badge variant={badgeType}>{rec.action}</Badge>
                        <p className="text-sm text-white/65 mt-2">{rec.reason}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Explanation */}
          <div className="glass border-l-4 border-bright rounded-xl p-6">
            <p className="text-white/80">{result.explanation}</p>
          </div>
        </>
      )}
    </div>
  );
}
