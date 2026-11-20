// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function PredictiveTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [modelView, setModelView] = useState<'both' | 'lr' | 'ma'>('both');
  const [stockRiskFilter, setStockRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  useEffect(() => {
    setLoading(true);
    analyticsService.getPredictive(monthsAhead)
      .then((d) => {
        setData(d);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load predictive analytics.');
        setLoading(false);
      });
  }, [monthsAhead]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[80px]" />
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[420px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[140px]" />
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[140px]" />
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[140px]" />
        </div>
      </div>
    );
  }
  if (!data) return <Card><p className="text-sm text-red-200">{error || 'No predictive analytics are available.'}</p></Card>;

  const { models, history, forecast, channelPredictions, stockoutRisks, dataConfidenceNote } = data;

  // Build continuous chart dataset: historical months followed by future forecast months
  const chartData = [
    ...history.map((h: any) => ({
      month: h.month,
      actualRevenue: h.revenue,
      lrFitted: h.lrFitted,
      maFitted: h.maFitted,
      lrForecast: null,
      maForecast: null,
      isHistorical: true,
    })),
    ...forecast.map((f: any, idx: number) => ({
      month: f.month,
      actualRevenue: null,
      lrFitted: null,
      maFitted: null,
      lrForecast: f.linearRegression,
      maForecast: f.movingAverage,
      isHistorical: false,
    })),
  ];

  // For visual connection between historical and forecast dashed lines:
  // Set the last historical month's forecast value equal to the last actual revenue
  const lastCompleteHistoryIndex = history.map((month: any) => !month.isPartial).lastIndexOf(true);
  if (lastCompleteHistoryIndex >= 0 && chartData.length > history.length) {
    chartData[lastCompleteHistoryIndex].lrForecast =
      history[lastCompleteHistoryIndex].lrFitted ?? history[lastCompleteHistoryIndex].revenue;
    chartData[lastCompleteHistoryIndex].maForecast =
      history[lastCompleteHistoryIndex].maFitted ?? history[lastCompleteHistoryIndex].revenue;
  }

  const commonTooltipStyle = {
    backgroundColor: 'rgba(3,23,22,0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  const renderTooltip = (active: boolean, payload: any[], label: string) => {
    if (!active || !payload?.length) return null;
    const isForecastMonth = forecast.some((f: any) => f.month === label);
    const partialMonth = history.find((month: any) => month.month === label && month.isPartial);

    return (
      <div style={commonTooltipStyle} className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold text-xs">{label}</span>
          {isForecastMonth ? (
            <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-0.5 rounded-full border border-sky-500/30 font-medium">
              Forecast Projection
            </span>
          ) : partialMonth ? (
            <span className="bg-amber-500/20 text-amber-200 text-xs px-2 py-0.5 rounded-full border border-amber-400/40 font-medium">
              Partial month
            </span>
          ) : (
            <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full border border-white/20 font-medium">
              Historical data
            </span>
          )}
        </div>
        {payload.map((entry: any, i: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={i} className="flex items-center gap-2 text-xs py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-white/70">{entry.name}:</span>
              <span className="text-white font-semibold tabular-nums">
                {formatCurrency(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const gridStroke = 'rgba(255,255,255,0.12)';
  const axisColor = 'rgba(255,255,255,0.75)';

  const filteredStockRisks = stockRiskFilter === 'all'
    ? stockoutRisks
    : stockoutRisks.filter((s: any) => s.riskLevel === stockRiskFilter);

  const exportStockToCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Product Name,Category,Current Stock,Reorder Level,Forecast Monthly Demand,Supplier,Lead Time Days,Days of Inventory,Risk Level,Suggested Reorder Qty',
        ...stockoutRisks.map((s: any) =>
          `"${s.name}","${s.category}",${s.currentStock},${s.reorderLevel},${s.monthlyDemand},"${s.supplier}",${s.leadTimeDays},${s.daysOfInventory},"${s.riskLevel}",${s.suggestedReorderQty}`
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'stockout_demand_forecast.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Forecast Controls & Model Comparison Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Demand & Revenue Forecasting
              <span className="bg-sky-500/20 text-sky-300 text-xs px-2.5 py-0.5 rounded-full border border-sky-500/30">
                Shared Source ({data.sharedDateRange?.startMonth} → {data.sharedDateRange?.endMonth})
              </span>
            </h3>
            <p className="text-xs text-white/65 mt-0.5">
              Comparative predictive modeling: Ordinary Least Squares Linear Regression vs 3-Month Moving Average
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Model Toggle */}
            <div className="flex rounded-xl overflow-hidden glass p-0.5 border border-white/10 text-xs">
              <button
                onClick={() => setModelView('both')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                  modelView === 'both' ? 'bg-bright text-abyss font-bold' : 'text-white/75 hover:text-white'
                }`}
              >
                Both Models
              </button>
              <button
                onClick={() => setModelView('lr')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                  modelView === 'lr' ? 'bg-bright text-abyss font-bold' : 'text-white/75 hover:text-white'
                }`}
              >
                Regression Only
              </button>
              <button
                onClick={() => setModelView('ma')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                  modelView === 'ma' ? 'bg-amber-400 text-abyss font-bold' : 'text-white/75 hover:text-white'
                }`}
              >
                Moving Avg Only
              </button>
            </div>

            {/* Forecast Horizon Selector (3, 6, 12 months) */}
            <div className="flex rounded-xl overflow-hidden glass p-0.5 border border-white/10 text-xs">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonthsAhead(m)}
                  className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                    monthsAhead === m ? 'bg-white/20 text-white font-bold shadow' : 'text-white/75 hover:text-white'
                  }`}
                >
                  +{m} Mo
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Primary Forecast Chart (Bug 3a, 3b, 3f fixed!) */}
      <Card className="min-h-[400px]">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white">Revenue Projection Horizon (+{monthsAhead} Months)</h3>
            <p className="text-xs text-white/75 mt-0.5">
              Solid line: Historical actuals | Dashed lines: Out-of-sample forward forecast projections
            </p>
            <p className="text-xs text-white/70 mt-1">
              Average monthly forecast: {data?.forecastMonthlyRevenue ? formatCurrency(data.forecastMonthlyRevenue) : 'Insufficient data'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Recommended: {models.recommendedModel}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(val: string) => {
                const parts = val.split('-');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const mIdx = parseInt(parts[1], 10) - 1;
                return `${months[mIdx]} '${parts[0].slice(2)}`;
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              width={68}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(val) => <span className="text-white/80 text-xs font-medium">{val}</span>}
            />

            {/* Historical Actual Revenue (Solid Teal Line) */}
            <Line
              type="monotoneX"
              dataKey="actualRevenue"
              name="Historical Actual Revenue"
              stroke="#0C969C"
              strokeWidth={3}
              dot={{ fill: '#0C969C', stroke: '#fff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#0C969C', stroke: '#fff' }}
              connectNulls
            />

            {/* Linear Regression Historical Fit & Forecast */}
            {(modelView === 'both' || modelView === 'lr') && (
              <>
                <Line
                  type="monotoneX"
                  dataKey="lrFitted"
                  name="Regression Trendline"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotoneX"
                  dataKey="lrForecast"
                  name="Linear Regression Forecast"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ fill: '#38BDF8', stroke: '#031716', strokeWidth: 2, r: 4 }}
                  connectNulls
                />
              </>
            )}

            {/* 3-Month Moving Average Forecast */}
            {(modelView === 'both' || modelView === 'ma') && (
              <>
                <Line
                  type="monotoneX"
                  dataKey="maFitted"
                  name="3-Mo Moving Avg (Fitted)"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotoneX"
                  dataKey="maForecast"
                  name="Moving Average Forecast"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ fill: '#F59E0B', stroke: '#031716', strokeWidth: 2, r: 4 }}
                  connectNulls
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 3. Model Performance & Evaluation Stats (Bug 3e fixed!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Regression Equation & Slope */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-white/65">Regression Equation</span>
            <span className="text-xs bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded font-mono">OLS</span>
          </div>
          <p className="text-xl font-bold text-white font-mono my-2">{models.linearRegression.equation}</p>
          <p className="text-xs text-white/75">
            Monthly trend: <strong className="text-bright">{models.linearRegression.slope >= 0 ? '+' : ''}₱{models.linearRegression.slope.toLocaleString()}</strong> per month
          </p>
        </Card>

        {/* R-Squared Score with Plain Language Interpretation */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-white/65">Coefficient of Determination (R²)</span>
            <span className="text-xs bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              R² = {models.linearRegression.rSquared.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-3 my-2">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-sky-400"
                style={{ width: `${Math.min(100, models.linearRegression.rSquared * 100)}%` }}
              />
            </div>
            <span className="text-lg font-bold text-white font-mono">
              {(models.linearRegression.rSquared * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-white/70 italic">
            "{models.linearRegression.interpretation}"
          </p>
        </Card>

        {/* Model Recommendation & RMSE comparison */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-white/65">Model Accuracy (RMSE)</span>
            <span className="text-xs bg-bright/20 text-bright px-2 py-0.5 rounded font-semibold">
              Fit Comparison
            </span>
          </div>
          <div className="space-y-1.5 my-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">Linear Regression RMSE:</span>
              <span className="font-mono text-white font-semibold">₱{models.linearRegression.rmse.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Moving Average RMSE:</span>
              <span className="font-mono text-white font-semibold">₱{models.movingAverage.rmse.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-emerald-300 font-medium">
            ✓ {models.recommendationReason}
          </p>
        </Card>
      </div>

      {/* 4. Channel ROI Prediction (Real data, no Math.random) */}
      <Card>
        <h3 className="text-base font-bold text-white mb-1">Marketing Channel ROI Predictions</h3>
        <p className="text-xs text-white/75 mb-4">
          Predicted ROI is the average ROI of each channel's most recent observed campaign months.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {channelPredictions.map((ch: any) => (
            <div key={ch.channel} className="glass-subtle p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white text-xs">{ch.channel}</span>
                <span className="text-xs text-sky-200 bg-sky-500/20 px-1.5 py-0.5 rounded font-mono">
                  {ch.observations} months
                </span>
              </div>
              <div>
                <p className="text-xs text-white/65">Predicted ROI</p>
                <p className="text-2xl font-bold text-bright tabular-nums">{ch.predictedRoi}%</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-sm text-white/75">
                <span>Hist. Avg: {ch.historicalRoi}%</span>
                <span className={ch.trend === 'increasing' ? 'text-emerald-400' : 'text-amber-400'}>
                  {ch.trend === 'increasing' ? '↑ Increasing' : ch.trend === 'diminishing' ? '↓ Decreasing' : '→ Stable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Stockout Risk Analysis Table per Product */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Product Stockout Risk & Reorder Planning
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                Demand vs Stock vs Lead Time
              </span>
            </h3>
            <p className="text-xs text-white/75">
              Evaluates inventory levels against forecast monthly demand and supplier delivery lead times
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex rounded-lg overflow-hidden glass p-0.5 text-xs">
              {(['all', 'High', 'Medium', 'Low'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setStockRiskFilter(lvl)}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    stockRiskFilter === lvl ? 'bg-white/20 text-white font-bold' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {lvl === 'all' ? 'All' : `${lvl} Risk`}
                </button>
              ))}
            </div>

            <button
              onClick={exportStockToCsv}
              className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Reorder Level</th>
                <th className="py-2.5 px-3 text-right">Mo. Demand</th>
                <th className="py-2.5 px-3 text-right">Days of Stock</th>
                <th className="py-2.5 px-3">Supplier (Lead Time)</th>
                <th className="py-2.5 px-3 text-center">Risk Level</th>
                <th className="py-2.5 px-3 text-right">Suggested Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStockRisks.slice(0, 15).map((item: any) => {
                const riskBadge =
                  item.riskLevel === 'High'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : item.riskLevel === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';

                return (
                  <tr key={item.productId} className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">{item.name}</td>
                    <td className="py-2.5 px-3 text-white/70">{item.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">{item.currentStock}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/75 tabular-nums">{item.reorderLevel}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/80 tabular-nums">{item.monthlyDemand}/mo</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/80 tabular-nums">                    {item.daysOfInventory === null ? '—' : `${item.daysOfInventory} days`}</td>
                    <td className="py-2.5 px-3 text-white/70">
                      <span className="truncate block max-w-[140px]" title={item.supplier}>{item.supplier}</span>
                      <span className="text-xs text-white/75">({item.leadTimeDays}d lead time)</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskBadge}`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-bright tabular-nums">
                      {item.suggestedReorderQty} units
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Data Confidence & Methodology Note */}
      <div className="glass-subtle p-4 rounded-xl border border-white/10 text-xs text-white/75 flex items-center justify-between">
        <span>Statistical Notice: {dataConfidenceNote}</span>
        <span className="font-mono text-white/75">Computed from currently available database rows</span>
      </div>
    </div>
  );
}
