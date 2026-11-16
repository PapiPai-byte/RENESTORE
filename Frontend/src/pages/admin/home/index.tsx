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

const kpiIcons = ['Total Revenue', 'Total Orders', 'Avg Order Value', 'Profit Margin', 'Total Customers'];

/* Skeleton KPI card — matches real card height */
const SkeletonKpiCard = () => (
  <div className="glass relative overflow-hidden min-h-[132px] animate-shimmer" aria-label="Loading metric" role="status">
    {/* Title bar placeholder */}
    <div className="flex items-center gap-3 px-5 pt-5">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="h-3 w-24 rounded bg-white/10" />
    </div>
    {/* Value placeholder */}
    <div className="mt-4 ml-5 h-8 w-32 rounded bg-white/10" />
    {/* Accent bar */}
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 rounded-t-[1rem]" />
  </div>
);

/* Skeleton chart card — matches Descriptive chart card heights */
const SkeletonChartCard = ({ height }: { height: number }) => (
  <div
    className="glass relative overflow-hidden animate-shimmer"
    style={{ minHeight: height }}
    aria-label="Loading chart"
    role="status"
  >
    {/* Title bar */}
    <div className="flex items-start justify-between px-6 pt-5 pb-2">
      <div>
        <div className="h-5 w-40 rounded bg-white/10 mb-1.5" />
        <div className="h-3 w-56 rounded bg-white/10" />
      </div>
    </div>
    {/* Chart placeholder */}
    <div className="px-6 pb-5 mt-1">
      <div className="w-full rounded-xl bg-white/8" style={{ height: height - 72 }} />
    </div>
  </div>
);

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('Descriptive');
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchKPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const descriptive = await analyticsService.getDescriptive();
      setKpis(descriptive.kpis);
      setLastUpdated(new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const tabs = ['Descriptive', 'Predictive', 'Prescriptive', 'Case Study', 'Process Flow'];

  const tabContent: Record<string, React.ReactNode> = {
    'Descriptive': <DescriptiveTab />,
    'Predictive': <PredictiveTab />,
    'Prescriptive': <PrescriptiveTab />,
    'Case Study': <CaseStudyTab />,
    'Process Flow': <ProcessFlowTab />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[30px] leading-tight font-bold text-white tracking-wide mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-white/60 text-sm">Sales performance, forecasts and recommendations at a glance</p>
        </div>
        {lastUpdated && (
          <span className="glass-subtle text-[11px] text-white/65 px-3 py-1.5 rounded-full flex-shrink-0 mt-1">
            Last updated: {lastUpdated}
          </span>
        )}
      </div>

      {loading ? (
        <>
          {/* Skeleton KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <SkeletonKpiCard key={i} />
            ))}
          </div>

          {/* Skeleton chart placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SkeletonChartCard height={340} />
            <SkeletonChartCard height={300} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SkeletonChartCard height={300} />
            <SkeletonChartCard height={300} />
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
            onClick={fetchKPIs}
            className="mt-4 inline-flex items-center gap-2 glass-subtle text-white/80 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <KpiCard title="Total Revenue" value={kpis?.totalRevenue ?? 0} delay={0} />
            <KpiCard title="Total Orders" value={kpis?.totalOrders ?? 0} delay={60} />
            <KpiCard title="Avg Order Value" value={kpis?.avgOrderValue ?? 0} delay={120} />
            <KpiCard title="Profit Margin" value={`${kpis?.profitMargin ?? 0}%`} delay={180} />
            <KpiCard title="Total Customers" value={kpis?.totalCustomers ?? 0} delay={240} />
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

          {/* Tab Content with fade transition */}
          <div key={activeTab} className="mt-6 animate-slide-up">
            {tabContent[activeTab]}
          </div>
        </>
      )}
    </div>
  );
}
