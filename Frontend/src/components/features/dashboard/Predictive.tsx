// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function PredictiveTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthsAhead, setMonthsAhead] = useState(6);

  useEffect(() => {
    setLoading(true);
    analyticsService.getPredictive(monthsAhead).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [monthsAhead]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-4 animate-shimmer min-h-[56px]" />
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[400px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-shimmer min-h-[100px]" />
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const combinedData = [...data.history, ...data.forecast.slice(0, monthsAhead)];
  const historyLen = data.history.length;

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
    const isForecast = entry.isForecast;
    return (
      <div style={commonTooltipStyle} className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${isForecast ? 'bg-sky border border-sky/60' : 'bg-bright'}`} />
          <span className="text-white/90 text-sm font-medium">{label}</span>
          {isForecast && <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30 ml-auto">Forecast</span>}
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-bold text-white">Forecast Period</h3>
          <div className="flex rounded-xl overflow-hidden glass">
            {[3, 6, 12].map((n) => (
              <button
                key={n}
                onClick={() => setMonthsAhead(n)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright/60 ${
                  monthsAhead === n
                    ? 'bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
              >
                {n} Months
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="min-h-[380px]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-white">Revenue Forecast</h3>
            <p className="text-sm text-white/65 mt-0.5">Historical revenue with {monthsAhead}-month forward projection</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={combinedData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="predLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6BA3BE" />
                <stop offset={`${(historyLen / combinedData.length) * 100}%`} stopColor="#0C969C" />
                <stop offset={`${(historyLen / combinedData.length) * 100 + 1}%`} stopColor="#6BA3BE" />
                <stop offset="100%" stopColor="#6BA3BE" />
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
            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0C969C"
              strokeWidth={3}
              dot={{ fill: '#0C969C', stroke: '#fff', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#0C969C' }}
              connectNulls
              name="Revenue"
              animationDuration={600}
            />
            {/* Forecast segment (dashed, lighter) */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6BA3BE"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{ fill: '#6BA3BE', stroke: '#0B2E33', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#6BA3BE' }}
              connectNulls
              name="Forecast"
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="min-h-[100px]">
          <p className="text-sm text-white/65 mb-1">Method</p>
          <p className="text-xl font-bold text-white">{data.method}</p>
        </Card>
        <Card className="min-h-[100px]">
          <p className="text-sm text-white/65 mb-1">Equation</p>
          <span className="inline-block glass-subtle text-bright font-mono text-sm font-semibold px-3 py-1.5 rounded-xl">
            {data.equation}
          </span>
        </Card>
        <Card className="min-h-[100px]">
          <p className="text-sm text-white/65 mb-1">R² Score</p>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="url(#r2Grad)"
                  strokeWidth="3"
                  strokeDasharray={`${parseFloat(data.rSquared) * 87.96} 87.96`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="r2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0C969C" />
                    <stop offset="100%" stopColor="#6BA3BE" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-xl font-bold text-white">{data.rSquared}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
