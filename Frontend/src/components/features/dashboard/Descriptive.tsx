// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import {
  LineChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

export default function DescriptiveTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDescriptive().then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[320px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[280px]" />
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[280px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[280px]" />
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[280px]" />
        </div>
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[200px]" />
      </div>
    );
  }
  if (!data) return null;

  const { salesByMonth, salesByCategory, topProducts, salesByCity, campaignPerformance } = data;

  const commonTooltipStyle = {
    backgroundColor: 'rgba(3,23,22,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(12,150,156,0.15)',
  };

  const renderTooltip = (active: boolean, payload: any[], label: string) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const isProvisional = label && String(label).includes('2026-10');
    return (
      <div style={commonTooltipStyle} className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color || '#0C969C' }}
          />
          <span className="text-white/90 text-sm font-medium">{label}</span>
          {isProvisional && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 ml-auto">In progress</span>
          )}
        </div>
        <p className="text-white font-semibold text-sm">
          {entry.name}: {typeof entry.value === 'number' ? formatCompactCurrency(entry.value) : entry.value}
        </p>
      </div>
    );
  };

  const customTooltip = ({ active, payload, label }: any) => renderTooltip(active, payload, label);

  const gridStroke = 'rgba(255,255,255,0.08)';
  const axisColor = 'rgba(255,255,255,0.5)';

  // Find peak for revenue by month
  const peakMonth = salesByMonth.reduce((a: any, b: any) => (b.revenue > a.revenue ? b : a), salesByMonth[0]);
  // Total revenue
  const totalRevenue = salesByMonth.reduce((sum: number, m: any) => sum + m.revenue, 0);

  // Chart card wrapper with caption and peak chip
  const ChartCard = ({ title, caption, children, peakLabel, peakValue }: any) => (
    <Card className="min-h-[340px]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-white/65 mt-0.5">{caption}</p>
        </div>
        {(peakLabel || peakValue) && (
          <span className="glass-subtle text-xs font-medium text-bright px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
            {peakLabel} {peakValue}
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </Card>
  );

  // Bar colors
  const barColor = '#0C969C';
  const barColor2 = '#6BA3BE';
  const barColor3 = '#0A7075';
  const barColorAccent = '#E3A008';

  return (
    <div className="space-y-6">
      {/* Revenue by Month - with gradient area + line */}
      <ChartCard
        title="Revenue by Month"
        caption="Monthly revenue trend showing seasonal patterns"
        peakLabel="Peak"
        peakValue={peakMonth ? formatCompactCurrency(peakMonth.revenue) : ''}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesByMonth}>
            <defs>
              <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0C969C" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0C969C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6BA3BE" />
                <stop offset="100%" stopColor="#0C969C" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(val: string) => {
                const d = new Date(val);
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
              }}
              interval="preserveStartEnd"
              minTickGap={16}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              width={64}
              margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revenueAreaGrad)"
              strokeWidth={0}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#revenueLineGrad)"
              strokeWidth={3}
              dot={{ fill: '#0C969C', stroke: '#fff', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#0C969C' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <ChartCard title="Revenue by Category" caption="Revenue breakdown across product categories">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="category"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={8}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={64}
                margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={customTooltip} />
              <Bar
                dataKey="revenue"
                fill={barColor}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by City - horizontal bars */}
        <ChartCard title="Revenue by City" caption="Geographic revenue distribution">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByCity} layout="vertical" barSize={24}>
              <defs>
                <linearGradient id="cityBarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0A7075" />
                  <stop offset="100%" stopColor="#6BA3BE" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis
                type="number"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={64}
                margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="city"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={customTooltip} />
              <Bar dataKey="revenue" fill="url(#cityBarGrad)" radius={[0, 8, 8, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <ChartCard title="Top Products" caption="Best performing products by revenue">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={8}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={64}
                margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={customTooltip} />
              <Bar dataKey="revenue" fill={barColor3} radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Campaign ROI */}
        <ChartCard title="Campaign ROI" caption="Return on investment by marketing channel">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="channel"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={8}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                width={64}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={customTooltip} />
              <Bar dataKey="roi" fill={barColorAccent} radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Campaign Table */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Campaign Performance</h3>
            <p className="text-sm text-white/65 mt-0.5">Detailed metrics across all marketing channels</p>
          </div>
          <span className="glass-subtle text-xs text-bright px-2.5 py-1 rounded-full flex-shrink-0">
            Total spend: {formatCompactCurrency(campaignPerformance.reduce((s: number, c: any) => s + c.spend, 0))}
          </span>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/10 backdrop-blur border-b border-white/10">
                {['Channel', 'Spend', 'Clicks', 'Conversions', 'Conv. Rate', 'Cost/Conv.', 'ROI'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaignPerformance.map((row: any, idx: number) => {
                const isBest = idx === campaignPerformance.reduce((bestIdx: number, r: any, i: number) => r.roi > campaignPerformance[bestIdx].roi ? i : bestIdx, 0);
                const roiClass = row.roi >= 300 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : row.roi >= 200 ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
                const convClass = row.conversionRate >= 5 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : row.conversionRate >= 2 ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
                return (
                  <tr
                    key={row.channel}
                    className={`transition-colors hover:bg-white/10 ${isBest ? 'bg-bright/5' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{row.channel}</td>
                    <td className="px-4 py-3 text-white/65 tabular-nums whitespace-nowrap">{formatCurrency(row.spend)}</td>
                    <td className="px-4 py-3 text-white/65 tabular-nums">{row.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-white/65 tabular-nums">{row.conversions}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${convClass}`}>
                        {row.conversionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/65 tabular-nums">{formatCurrency(row.costPerConversion)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${roiClass}`}>
                        {row.roi}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
