// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/common/Loader';
import analyticsService from '@/services/analyticsService';
import { formatCurrency } from '@/lib/utils';

export default function CaseStudyTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('renestore_data_sources_v2');
    return saved
      ? JSON.parse(saved)
      : {
          products: 'Not documented',
          customers: 'Not documented',
          orders: 'Not documented',
          marketing_campaigns: 'Not documented',
          inventory_purchases: 'Not documented',
        };
  });
  const [editingSource, setEditingSource] = useState<string | null>(null);

  useEffect(() => {
    analyticsService.getCaseStudy()
      .then((d) => {
        setData(d);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load the case study data.');
        setLoading(false);
      });
  }, []);

  const handleSaveSource = (tableKey: string, value: string) => {
    const updated = { ...dataSources, [tableKey]: value };
    setDataSources(updated);
    localStorage.setItem('renestore_data_sources_v2', JSON.stringify(updated));
    setEditingSource(null);
  };

  const exportDataVariables = () => {
    const rows = dataVariables.map((variable: any) => ({
      name: variable.name,
      table: variable.table,
      records: variable.records,
      start: variable.dateRange?.start ? String(variable.dateRange.start).slice(0, 10) : '',
      end: variable.dateRange?.end ? String(variable.dateRange.end).slice(0, 10) : '',
      source: dataSources[variable.table] || variable.source || 'Not documented',
    }));
    const csv = [
      'Variable,Table,Rows,Start Date,End Date,Data Source',
      ...rows.map((row: any) => [row.name, row.table, row.records, row.start, row.end, row.source]
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')),
    ].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = 'case-study-data-overview.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 animate-shimmer min-h-[300px]" />
      </div>
    );
  }
  if (!data) return <Card><p className="text-sm text-red-200">{error || 'Case study data is unavailable.'}</p></Card>;

  const { company, industry, problemBackground, dataVariables, computedResults } = data;

  return (
    <div className="space-y-6 print:space-y-4 print:text-black">
      {/* 1. Header with Export/Print Button */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-wide">{company}</h2>
              <Badge variant="primary">Capstone BA Case Study</Badge>
            </div>
            <p className="text-white/60 text-sm mt-0.5">{industry}</p>
          </div>
          <button
            onClick={handlePrint}
            className="glass px-4 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/15 print:hidden"
          >
            <svg className="w-4 h-4 text-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export as PDF / Print
          </button>
        </div>

        {/* Defined Problem Background (Requirement R2) */}
        <div className="p-4 rounded-xl bg-bright/10 border-l-4 border-bright glass-subtle space-y-2">
          <p className="text-xs uppercase tracking-wider text-bright font-bold">Requirement R2: Problem Background & Business Question</p>
          <p className="text-white text-sm leading-relaxed font-medium">
            "{problemBackground}"
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-bold text-white mb-2">Company Background</h3>
        <p className="text-sm text-white/75 leading-relaxed">
          ReneStore is an e-commerce business for computers, laptops, tools, and accessories. This case study uses the currently available ReneStore database tables; the data owner must verify and document the source of each dataset.
        </p>
      </Card>

      {/* 2. Objectives & Methodology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-bold text-white mb-2">Project Objectives</h3>
          <ul className="space-y-2 text-xs text-white/75">
            <li className="flex items-start gap-2">
              <span className="text-bright font-bold">1.</span>
              <span><strong>Identify Profit Drivers:</strong> Uncover which product categories, channels, and customer segments yield the highest gross profit margins.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bright font-bold">2.</span>
              <span><strong>Forecast Monthly Demand:</strong> Predict future store revenues and product order rates using statistical regression and moving average models.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bright font-bold">3.</span>
              <span><strong>Prescribe Resource Allocation:</strong> Scientifically distribute the monthly marketing budget and inventory purchase capital to maximize profit.</span>
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-white mb-2">Analytics Methodology (BA Process)</h3>
          <div className="space-y-2.5 text-xs text-white/75">
            <div className="glass-subtle p-2.5 rounded-lg border border-white/5">
              <strong className="text-bright block">Descriptive Analytics ("What Happened?"):</strong>
              Historical sales analysis, statistical distribution of orders, gross profit margins, and actual marketing ROI.
            </div>
            <div className="glass-subtle p-2.5 rounded-lg border border-white/5">
              <strong className="text-sky-300 block">Predictive Analytics ("What Will Happen?"):</strong>
              Comparative model evaluation (Linear Regression vs Moving Average, R², RMSE) and stockout risk assessment.
            </div>
            <div className="glass-subtle p-2.5 rounded-lg border border-white/5">
              <strong className="text-amber-300 block">Prescriptive Analytics ("What Should We Do?"):</strong>
              Campaign ROI-based linear programming with channel guardrails, plus Economic Order Quantity (EOQ) reorder planning.
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Database counts and owner-provided sources */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Data Description & Sources</h3>
            <p className="text-xs text-white/60">
              Counts are read from the database. Record provenance must be documented by the data owner.
            </p>
          </div>
          <span className="text-xs text-amber-200 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 font-semibold">
            Row counts do not verify data provenance
          </span>
          <button onClick={exportDataVariables} className="glass px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white border border-white/15">
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider">
                <th className="py-2.5 px-3">Variable (Table)</th>
                <th className="py-2.5 px-3 text-right">Database Rows</th>
                <th className="py-2.5 px-3">Date Range</th>
                <th className="py-2.5 px-3">Data Source (edit to document)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataVariables.map((v: any) => {
                const isEditing = editingSource === v.table;
                return (
                  <tr key={v.table} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {v.name}
                      <span className="block text-[10px] text-white/40 font-mono">table: {v.table}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-bright tabular-nums">
                      {v.records} rows
                    </td>
                    <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                      {v.dateRange?.start
                        ? `${String(v.dateRange.start).slice(0, 10)} – ${String(v.dateRange.end).slice(0, 10)}`
                        : 'Not available'}
                    </td>
                    <td className="py-3 px-3 text-white/80">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={dataSources[v.table] || v.source}
                            id={`input-${v.table}`}
                            className="glass-input text-white text-xs px-2 py-1 rounded w-full"
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`input-${v.table}`) as HTMLInputElement;
                              handleSaveSource(v.table, input.value);
                            }}
                            className="bg-bright text-abyss px-2 py-1 rounded text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span>{dataSources[v.table] || v.source}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        v.records >= 50
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : 'bg-amber-500/20 text-amber-200'
                      }`}>
                      {v.records >= 50 ? 'Count ≥ 50' : 'Below 50'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right print:hidden">
                      <button
                        onClick={() => setEditingSource(isEditing ? null : v.table)}
                        className="text-xs text-bright hover:underline"
                      >
                        {isEditing ? 'Cancel' : 'Edit Source'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Real Computed Results & Key Findings */}
      <Card>
        <h3 className="text-base font-bold text-white mb-1">Key Empirical Findings</h3>
        <p className="text-xs text-white/60 mb-4">
          All metrics dynamically computed from database records (no hardcoded figures)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl glass-subtle text-center">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Total Revenue</span>
            <span className="text-xl font-bold text-bright tabular-nums">{formatCurrency(computedResults.totalRevenue)}</span>
            <span className="text-[10px] text-white/40 block mt-1">{computedResults.totalOrders} completed orders</span>
          </div>
          <div className="p-4 rounded-xl glass-subtle text-center">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Gross Profit Margin</span>
            <span className="text-xl font-bold text-emerald-300 tabular-nums">{computedResults.profitMargin}%</span>
            <span className="text-[10px] text-white/40 block mt-1">Total profit: {formatCurrency(computedResults.totalProfit)}</span>
          </div>
          <div className="p-4 rounded-xl glass-subtle text-center">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Model Fit (R²)</span>
            <span className="text-xl font-bold text-sky-300 tabular-nums">{computedResults.rSquared?.toFixed(2) ?? '—'}</span>
            <span className="text-[10px] text-white/40 block mt-1">{computedResults.recommendedModel} chosen</span>
          </div>
          <div className="p-4 rounded-xl glass-subtle text-center">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Prescriptive Uplift</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">
              {computedResults.marketingUpliftPct == null ? '—' : `${computedResults.marketingUpliftPct}%`}
            </span>
              <span className="text-[10px] text-white/40 block mt-1">computed vs historical campaign mix</span>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-white/80">
          <p>
            • <strong>Descriptive Finding:</strong> The top category is {computedResults.topCategory || 'not available from current records'}. The highest complete-month revenue was {computedResults.peakMonth || 'not available'} ({computedResults.peakMonthRevenue == null ? '—' : formatCurrency(computedResults.peakMonthRevenue)}). The highest observed channel ROI is {computedResults.bestChannel || 'not available'} ({computedResults.bestChannelRoi == null ? '—' : `${computedResults.bestChannelRoi}%`}).
          </p>
          <p>
            • <strong>Predictive Finding:</strong> {computedResults.modelInterpretation} The selected comparison model is {computedResults.recommendedModel}; regression RMSE is {formatCurrency(computedResults.rmse)}. The input includes {computedResults.historicalMonths} complete monthly observations and flags {computedResults.inventoryItemsToReorder} reorder candidates.
          </p>
          <p>
            • <strong>Prescriptive Finding:</strong> The current budget scenario estimates {formatCurrency(computedResults.prescriptiveExpectedRevenue)} campaign revenue and {computedResults.prescriptiveRoi}% ROI. Its estimated change versus the historical campaign mix is {computedResults.marketingUpliftPct == null ? 'not available' : `${computedResults.marketingUpliftPct}%`}; this is a model output, not a guaranteed result.
          </p>
        </div>
      </Card>

      {/* 5. Database-derived recommendations and limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-bold text-white mb-2">Prescriptive Recommendations</h3>
          <ul className="space-y-2 text-xs text-white/75">
            {(computedResults.actionList || []).map((action: any) => (
              <li key={action.channel} className="flex items-start gap-2">
                <span className="text-emerald-300 font-bold">•</span>
                <span><strong>{action.actionText}.</strong> {action.rationale}</span>
              </li>
            ))}
            {(computedResults.reorderItems || []).map((item: any) => (
              <li key={item.name} className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <span><strong>Reorder {item.name}:</strong> {item.quantity} units, estimated purchase cost {formatCurrency(item.totalCost)}.</span>
              </li>
            ))}
            {computedResults.actionList?.length === 0 && computedResults.reorderItems?.length === 0 && (
              <li>No recommendations can be computed from the available records.</li>
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-white mb-2">Analytical Limitations</h3>
          <ul className="space-y-2 text-xs text-white/75">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">!</span>
              <span><strong>Sample Horizon:</strong> The forecast uses {computedResults.historicalMonths} complete monthly observations. Longer seasonal patterns require more history.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">!</span>
              <span><strong>Model Fit:</strong> {computedResults.modelInterpretation} Forecast errors and future outcomes can differ.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">!</span>
              <span><strong>Provenance:</strong> Database row counts do not establish that records are real or representative. Confirm the source and completeness of each table before using results for business decisions.</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-bold text-white mb-2">Conclusion</h3>
        <p className="text-sm text-white/75 leading-relaxed">
          The current database supports a repeatable descriptive, predictive, and prescriptive workflow. Use the computed findings and recommendations as planning evidence only after verifying the data sources and reviewing the model limitations above.
        </p>
      </Card>
    </div>
  );
}
