// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Tabs } from '@/components/ui/Tabs';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import analyticsService from '@/services/analyticsService';
import DescriptiveTab from '@/components/features/dashboard/Descriptive';
import PredictiveTab from '@/components/features/dashboard/Predictive';
import PrescriptiveTab from '@/components/features/dashboard/Prescriptive';
import CaseStudyTab from '@/components/features/dashboard/CaseStudy';
import ProcessFlowTab from '@/components/features/dashboard/ProcessFlow';

/* Skeleton KPI card */
const SkeletonKpiCard = () => (
  <div className="glass relative overflow-hidden min-h-[132px] animate-shimmer" aria-label="Loading metric" role="status">
    <div className="flex items-center gap-3 px-5 pt-5">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="h-3 w-24 rounded bg-white/10" />
    </div>
    <div className="mt-4 ml-5 h-8 w-32 rounded bg-white/10" />
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 rounded-t-[1rem]" />
  </div>
);

export default function AdminHome() {
  const sampleDataMode = import.meta.env.VITE_USE_MOCK === 'true';
  const [activeTab, setActiveTab] = useState('Descriptive');
  const [kpis, setKpis] = useState<any>(null);
  const [dataOverview, setDataOverview] = useState<any>(null);
  const [showDataOverview, setShowDataOverview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [descriptive, overview] = await Promise.all([
        analyticsService.getDescriptive(),
        analyticsService.getDataOverview().catch(() => null),
      ]);
      setKpis(descriptive.kpis);
      setDataOverview(overview);
      setLastUpdated(new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const tabs = ['Descriptive', 'Predictive', 'Prescriptive', 'Case Study', 'Process Flow'];

  const tabContent: Record<string, React.ReactNode> = {
    'Descriptive': <DescriptiveTab />,
    'Predictive': <PredictiveTab />,
    'Prescriptive': <PrescriptiveTab />,
    'Case Study': <CaseStudyTab onTabChange={setActiveTab} />,
    'Process Flow': <ProcessFlowTab onTabChange={setActiveTab} />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] leading-tight font-bold text-white tracking-wide">
              Analytics Dashboard
            </h1>
            <span className="glass-subtle text-xs px-2.5 py-1 rounded-full text-bright font-medium border border-bright/30">
              Capstone BA
            </span>
            {sampleDataMode && (
              <span className="bg-amber-500/20 text-amber-100 text-xs px-2.5 py-1 rounded-full border border-amber-300/50 font-bold">
                SAMPLE DATA
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1">
            Data-driven intelligence: Descriptive, Predictive, and Prescriptive decision pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDataOverview(!showDataOverview)}
            className="glass px-3.5 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/15"
          >
            <svg className="w-4 h-4 text-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM9 9h6M9 13h6M9 17h4" />
            </svg>
            Data Overview ({dataOverview?.allVariablesPass ? '5/5 Counts ≥ 50' : 'Data Audit'})
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {lastUpdated && (
            <span className="glass-subtle text-[11px] text-white/65 px-3 py-2 rounded-xl flex-shrink-0">
              Updated: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* Data Overview Collapsible Drawer (R3 verification) */}
      {showDataOverview && dataOverview && (
        <div className="glass rounded-2xl p-6 mb-8 border border-bright/30 shadow-glass animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Database Record Counts (Requirement R3)</span>
                {dataOverview.allVariablesPass && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    All Required Tables ≥ 50 Rows
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Counts show stored rows only; they do not verify that records are real or representative.
              </p>
            </div>
            <button
              onClick={() => setShowDataOverview(false)}
              className="text-white/40 hover:text-white text-sm px-2 py-1"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {dataOverview.tables?.map((t: any) => (
              <div
                key={t.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  t.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30 glass-subtle'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white/80 truncate" title={t.name}>{t.name}</span>
                  {t.passed ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 font-bold">FAIL</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white tabular-nums">{t.count}</span>
                  <span className="text-xs text-white/50">/ min {t.minRequired}</span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  {t.required ? 'Required variable' : 'Additional table'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60 flex-wrap gap-2">
            <span>Date Range: <strong>{dataOverview.dateRange?.start?.slice(0, 10)}</strong> to <strong>{dataOverview.dateRange?.end?.slice(0, 10)}</strong></span>
            <span>Import script available: <code className="text-bright bg-white/10 px-2 py-0.5 rounded font-mono">npm run import:data</code></span>
          </div>
        </div>
      )}

      {loading ? (
        <>
          {/* Skeleton KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonKpiCard key={i} />
            ))}
          </div>
        </>
      ) : error ? (
        <div className="glass rounded-2xl p-8 text-center mb-8">
          <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <ErrorMessage message={error} />
          <button
            onClick={fetchDashboardData}
            className="mt-4 inline-flex items-center gap-2 glass-subtle text-white/80 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* 6 Comprehensive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <KpiCard title="Total Revenue" value={kpis?.totalRevenue ?? 0} delay={0} />
            <KpiCard title="Total Profit" value={kpis?.totalProfit ?? 0} delay={40} />
            <KpiCard title="Total Orders" value={kpis?.totalOrders ?? 0} delay={80} />
            <KpiCard title="Avg Order Value" value={kpis?.avgOrderValue ?? 0} delay={120} />
            <KpiCard title="Profit Margin" value={`${kpis?.profitMargin ?? 0}%`} delay={160} />
            <KpiCard title="Stockout Items" value={kpis?.stockoutCount ?? 0} delay={200} />
          </div>

          {/* Navigation Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

          {/* Active Tab Content */}
          <div key={activeTab} className="mt-6 animate-slide-up">
            {tabContent[activeTab]}
          </div>
        </>
      )}
    </div>
  );
}
