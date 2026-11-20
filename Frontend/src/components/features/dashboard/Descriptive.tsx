// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import {
  LineChart, Line, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';

export default function DescriptiveTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productView, setProductView] = useState<'top' | 'bottom'>('top');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    analyticsService.getDescriptive().then((d) => {
      setData(d);
      setLoading(false);
      setError(null);
    }).catch((e) => {
      setError(e.message || 'Unable to load descriptive analytics.');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[340px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[300px]" />
          <div className="glass rounded-2xl p-6 animate-shimmer min-h-[300px]" />
        </div>
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[240px]" />
      </div>
    );
  }
  if (!data) return <Card><p className="text-sm text-red-200">{error || 'No descriptive analytics are available.'}</p></Card>;

  const {
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
  } = data;
  const isWithinDateRange = (month: string) =>
    (!dateFrom || month >= dateFrom) && (!dateTo || month <= dateTo);
  const filteredSalesByMonth = salesByMonth.filter((month: any) => isWithinDateRange(month.month));
  const filteredPurchasesByMonth = inventoryPurchasesByMonth.filter((month: any) => isWithinDateRange(month.month));
  const filteredSalesByCategory = salesByCategory.filter((row: any) =>
    categoryFilter === 'all' || row.category === categoryFilter
  );
  const filteredSalesByCity = salesByCity.filter((row: any) =>
    cityFilter === 'all' || row.city === cityFilter
  );
  const filteredCampaignPerformance = campaignPerformance.filter((row: any) =>
    channelFilter === 'all' || row.channel === channelFilter
  );
  const filteredProducts = (productView === 'top' ? topProducts : bottomProducts).filter((row: any) =>
    categoryFilter === 'all' || row.category === categoryFilter
  );

  const commonTooltipStyle = {
    backgroundColor: 'rgba(3,23,22,0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  const renderTooltip = (active: boolean, payload: any[], label: string) => {
    if (!active || !payload?.length) return null;
    const partial = salesByMonth.some((month: any) => month.month === label && month.isPartial);
    return (
      <div style={commonTooltipStyle} className="p-3">
        <p className="text-white/80 text-xs font-semibold mb-1.5">{label}</p>
        {partial && <p className="text-amber-200 text-xs mb-1.5">Partial month; excluded from model fitting</p>}
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color || '#0C969C' }} />
            <span className="text-white/70">{entry.name}:</span>
            <span className="text-white font-semibold tabular-nums">
              {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('rev') || entry.name?.toLowerCase().includes('profit')
                ? formatCurrency(entry.value)
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Raised contrast for axis & grid (Bug 3g)
  const gridStroke = 'rgba(255,255,255,0.12)';
  const axisColor = 'rgba(255,255,255,0.75)';

  // Peak month calculation
  const completeMonths = filteredSalesByMonth.filter((month: any) => !month.isPartial);
  const peakMonth = completeMonths.reduce(
    (peak: any, month: any) => !peak || month.revenue > peak.revenue ? month : peak,
    null
  );

  // Export to CSV helper
  const exportToCsv = (filename: string, rows: any[], headers: string[], keys: string[]) => {
    const csvContent = [
      headers.map(value => `"${value.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => keys.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const encodedUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentColors = ['#0C969C', '#6BA3BE', '#E3A008', '#274D60'];

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="text-xs text-white/70">
            From month
            <input type="month" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white" />
          </label>
          <label className="text-xs text-white/70">
            To month
            <input type="month" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white" />
          </label>
          <label className="text-xs text-white/70">
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white bg-slate-800">
              <option value="all" className="text-white bg-slate-800">All categories</option>
              {(salesByCategory?.length ? salesByCategory : [{category:'Tools'},{category:'Accessories'},{category:'Computers'},{category:'Laptops'}]).map((row: any) => <option key={row.category} value={row.category} className="text-white bg-slate-800">{row.category}</option>)}
            </select>
          </label>
          <label className="text-xs text-white/70">
            Channel
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white bg-slate-800">
              <option value="all" className="text-white bg-slate-800">All channels</option>
              {(campaignPerformance?.length ? campaignPerformance : [{channel:'Facebook'},{channel:'Google Ads'},{channel:'Email'},{channel:'TikTok'},{channel:'Instagram'}]).map((row: any) => <option key={row.channel} value={row.channel} className="text-white bg-slate-800">{row.channel}</option>)}
            </select>
          </label>
          <label className="text-xs text-white/70">
            City
            <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="glass-input mt-1 w-full px-3 py-2 rounded-lg text-white bg-slate-800">
              <option value="all" className="text-white bg-slate-800">All cities</option>
              {(salesByCity?.length ? salesByCity : []).map((row: any) => <option key={row.city} value={row.city} className="text-white bg-slate-800">{row.city}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {/* 1. Revenue & Profit Trend by Month */}
      <Card className="min-h-[360px]">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Monthly Revenue & Gross Profit
              <span className="text-xs font-normal text-white/65">({filteredSalesByMonth.length} months shown)</span>
            </h3>
            <p className="text-xs text-white/65 mt-0.5">Historical revenue and gross margin trends from completed customer orders</p>
          </div>
          {peakMonth && (
            <span className="bg-bright/20 border border-bright/50 text-white font-semibold text-xs px-3 py-1 rounded-full flex-shrink-0">
              Peak: {peakMonth.month} ({formatCompactCurrency(peakMonth.revenue)})
            </span>
          )}
        </div>

        {filteredSalesByMonth.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredSalesByMonth} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0C969C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0C969C" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area type="monotoneX" dataKey="revenue" stroke="none" fill="url(#revGrad)" legendType="none" />
            <Line
              type="monotoneX"
              dataKey="revenue"
              name="Revenue"
              stroke="#0C969C"
              strokeWidth={3}
              dot={{ fill: '#0C969C', stroke: '#fff', strokeWidth: 1.5, r: 3.5 }}
              activeDot={{ r: 6, fill: '#0C969C', stroke: '#fff' }}
            />
            <Line
              type="monotoneX"
              dataKey="profit"
              name="Gross Profit"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', stroke: '#fff', strokeWidth: 1, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
        ) : <p className="py-24 text-center text-sm text-white/75">No monthly sales match this date range.</p>}
      </Card>

      {/* 2. Revenue by Category & Revenue by City */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="min-h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-white">Revenue by Category</h3>
              <p className="text-xs text-white/75">Total revenue across product categories</p>
            </div>
          </div>
          {filteredSalesByCategory.length > 0 ? <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredSalesByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="category" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} width={64} tickLine={false} axisLine={false} />
              <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
              <Bar dataKey="revenue" name="Revenue" fill="#0C969C" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer> : <p className="py-24 text-center text-sm text-white/75">No category sales match this filter.</p>}
        </Card>

        {/* City Breakdown */}
        <Card className="min-h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-white">Revenue by Customer City</h3>
              <p className="text-xs text-white/75">Geographic customer demand</p>
            </div>
          </div>
          {filteredSalesByCity.length > 0 ? <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredSalesByCity} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="city" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} width={90} tickLine={false} axisLine={false} />
              <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
              <Bar dataKey="revenue" name="Revenue" fill="#6BA3BE" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer> : <p className="py-24 text-center text-sm text-white/75">No city sales match this filter.</p>}
        </Card>
      </div>

      {/* 3. Product Performance: Top 10 vs Bottom 10 */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Product Performance</h3>
            <p className="text-xs text-white/75">Top performers and slow-moving inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden glass p-0.5 border border-white/10">
              <button
                onClick={() => setProductView('top')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  productView === 'top' ? 'bg-bright text-abyss shadow' : 'text-white/75 hover:text-white'
                }`}
              >
                Top 10 Products
              </button>
              <button
                onClick={() => setProductView('bottom')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  productView === 'bottom' ? 'bg-amber-400 text-abyss shadow' : 'text-white/75 hover:text-white'
                }`}
              >
                Bottom 10 (Slow Moving)
              </button>
            </div>
            <button
              onClick={() => {
                const list = filteredProducts;
                exportToCsv(`${productView}_products`, list, ['Product Name', 'Category', 'Revenue', 'Units Sold'], ['name', 'category', 'revenue', 'unitsSold']);
              }}
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
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                {productView === 'bottom' && <th className="py-2.5 px-3 text-right">Current Stock</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 && (
                <tr><td colSpan={productView === 'bottom' ? 5 : 4} className="py-8 text-center text-white/75">No products match this filter.</td></tr>
              )}
              {filteredProducts.map((prod: any, idx: number) => (
                <tr key={idx} className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/75 font-mono">
                      {idx + 1}
                    </span>
                    {prod.name}
                  </td>
                  <td className="py-2.5 px-3 text-white/70">{prod.category}</td>
                  <td className="py-2.5 px-3 text-right text-white/80 tabular-nums">{prod.unitsSold}</td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold tabular-nums">{formatCurrency(prod.revenue)}</td>
                  {productView === 'bottom' && (
                    <td className="py-2.5 px-3 text-right text-amber-300 font-semibold tabular-nums">{prod.stock}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Payment Methods & Order Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <h3 className="text-base font-bold text-white mb-1">Payment Method Distribution</h3>
          <p className="text-xs text-white/75 mb-3">Revenue share by payment channel</p>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={salesByPaymentMethod}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {salesByPaymentMethod.map((_, i) => (
                    <Cell key={i} fill={paymentColors[i % paymentColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
                <Legend formatter={(v, entry: any) => <span className="text-white/80 text-xs">{v} ({entry?.payload?.percentage ?? 0}%)</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Orders by Status */}
        <Card>
          <h3 className="text-base font-bold text-white mb-1">Orders by Fulfillment Status</h3>
          <p className="text-xs text-white/75 mb-4">Completed, pending, and cancelled distribution</p>
          <div className="space-y-3">
            {ordersByStatus.map((s: any, idx: number) => {
              const color = s.status === 'completed' ? 'bg-emerald-400' : s.status === 'pending' ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div key={idx} className="glass-subtle p-3 rounded-xl">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="capitalize font-semibold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      {s.status}
                    </span>
                    <span className="text-white/80 font-mono">{s.count} orders ({s.percentage}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Customer and supplier/inventory variables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-base font-bold text-white mb-1">Customers by Segment</h3>
          <p className="text-xs text-white/75 mb-3">Customer profile counts from the customer table</p>
          {customersBySegment.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={customersBySegment} dataKey="customers" nameKey="segment" cx="50%" cy="50%" outerRadius={78} startAngle={0} endAngle={360} paddingAngle={2}>
                  {customersBySegment.map((_: any, index: number) => (
                    <Cell key={index} fill={paymentColors[index % paymentColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
                <Legend formatter={(value) => <span className="text-white/80 text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-white/75">No customer records available.</p>}
        </Card>

        <Card className="min-h-[300px]">
          <h3 className="text-base font-bold text-white mb-1">Inventory Purchases by Month</h3>
          <p className="text-xs text-white/75 mb-3">Recorded purchase spend and quantity</p>
          {filteredPurchasesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={filteredPurchasesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor, fontSize: 10 }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={formatCompactCurrency} />
                <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
                <Legend formatter={(value) => <span className="text-white/80 text-xs">{value}</span>} />
                <Bar dataKey="spend" name="Purchase Spend" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-white/75">No inventory purchase records available.</p>}
          <button
            onClick={() => exportToCsv('inventory_purchases_by_month', filteredPurchasesByMonth, ['Month', 'Spend', 'Quantity'], ['month', 'spend', 'quantity'])}
            className="mt-2 text-xs text-bright hover:underline"
          >
            Export CSV
          </button>
        </Card>

        <Card className="min-h-[300px]">
          <h3 className="text-base font-bold text-white mb-1">Purchase Spend by Supplier</h3>
          <p className="text-xs text-white/75 mb-3">Supplier names and values from recorded inventory purchases</p>
          {inventoryPurchasesBySupplier.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={inventoryPurchasesBySupplier} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={formatCompactCurrency} />
                <YAxis type="category" dataKey="supplier" stroke={axisColor} tick={{ fill: axisColor, fontSize: 9 }} width={140} />
                <Tooltip content={({ active, payload, label }) => renderTooltip(active, payload, label)} />
                <Bar dataKey="spend" name="Purchase Spend" fill="#6BA3BE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-white/75">No supplier purchase records available.</p>}
          <button
            onClick={() => exportToCsv('inventory_purchases_by_supplier', inventoryPurchasesBySupplier, ['Supplier', 'Records', 'Quantity', 'Spend'], ['supplier', 'records', 'quantity', 'spend'])}
            className="mt-2 text-xs text-bright hover:underline"
          >
            Export CSV
          </button>
        </Card>
      </div>

      {/* 5. Marketing Channel Performance Table (CTR, CVR, Cost/Order, ROI) */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Marketing Channel Performance</h3>
            <p className="text-xs text-white/75">Actual CTR, Conversion Rate, Cost per Order, and ROI computed from marketing records</p>
          </div>
          <button
            onClick={() => exportToCsv('marketing_performance', filteredCampaignPerformance, ['Channel', 'Spend', 'Impressions', 'Clicks', 'Orders', 'CTR (%)', 'CVR (%)', 'Cost/Order', 'Revenue', 'ROI (%)'], ['channel', 'spend', 'impressions', 'clicks', 'conversions', 'ctr', 'conversionRate', 'costPerOrder', 'revenue', 'roi'])}
            className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3 text-right">Spend</th>
                <th className="py-2.5 px-3 text-right">Impressions</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">CTR</th>
                <th className="py-2.5 px-3 text-right">Conv. Rate</th>
                <th className="py-2.5 px-3 text-right">Cost/Order</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right" title="Historical ROI = (attributed revenue - spend) / spend over all campaign-months.">Historical ROI ⓘ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCampaignPerformance.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-white/75">No campaign records match this filter.</td></tr>
              )}
              {filteredCampaignPerformance.map((c: any, i: number) => (
                <tr key={i} className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{c.channel}</td>
                  <td className="py-2.5 px-3 text-right text-white/70 tabular-nums">{formatCurrency(c.spend)}</td>
                  <td className="py-2.5 px-3 text-right text-white/70 tabular-nums">{c.impressions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-white/70 tabular-nums">{c.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-white/80 tabular-nums font-semibold">{c.conversions}</td>
                  <td className="py-2.5 px-3 text-right text-sky-300 font-mono">{c.ctr}%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-mono">{c.conversionRate}%</td>
                  <td className="py-2.5 px-3 text-right text-white/70 tabular-nums">{formatCurrency(c.costPerOrder)}</td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold tabular-nums">{formatCurrency(c.revenue)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      {c.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Descriptive Statistics Summary Table (Mean, Median, StdDev, Min, Max) */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white">Statistical Distribution Analysis</h3>
            <p className="text-xs text-white/75">Parametric and non-parametric summary measures computed from transaction records</p>
          </div>
          <button
            onClick={() => exportToCsv(
              'descriptive_statistics',
              [
                { metric: 'Order Value', ...statistics?.orderValue },
                { metric: 'Monthly Revenue', ...statistics?.monthlyRevenue },
              ],
              ['Metric', 'Mean', 'Median', 'Standard Deviation', 'Minimum', 'Maximum'],
              ['metric', 'mean', 'median', 'stdDev', 'min', 'max']
            )}
            className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/65 uppercase tracking-wider">
                <th className="py-2.5 px-4">Metric Variable</th>
                <th className="py-2.5 px-4 text-right">Mean (Average)</th>
                <th className="py-2.5 px-4 text-right">Median</th>
                <th className="py-2.5 px-4 text-right">Std. Deviation</th>
                <th className="py-2.5 px-4 text-right">Minimum</th>
                <th className="py-2.5 px-4 text-right">Maximum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-semibold text-white">Individual Order Value</td>
                <td className="py-3 px-4 text-right font-mono text-bright">{formatCurrency(statistics?.orderValue?.mean || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/80">{formatCurrency(statistics?.orderValue?.median || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/70">{formatCurrency(statistics?.orderValue?.stdDev || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/75">{formatCurrency(statistics?.orderValue?.min || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-300 font-semibold">{formatCurrency(statistics?.orderValue?.max || 0)}</td>
              </tr>
              <tr className="odd:bg-white/[0.03] hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-semibold text-white">Monthly Store Revenue</td>
                <td className="py-3 px-4 text-right font-mono text-bright">{formatCurrency(statistics?.monthlyRevenue?.mean || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/80">{formatCurrency(statistics?.monthlyRevenue?.median || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/70">{formatCurrency(statistics?.monthlyRevenue?.stdDev || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-white/75">{formatCurrency(statistics?.monthlyRevenue?.min || 0)}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-300 font-semibold">{formatCurrency(statistics?.monthlyRevenue?.max || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
