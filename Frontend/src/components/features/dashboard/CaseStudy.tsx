// @ts-nocheck
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

const caseStudyData = {
  company: 'ReneStore Electronics',
  industry: 'E-commerce (Tech & Tools)',
  challenge: 'Optimize marketing budget allocation across multiple channels to maximize ROI while maintaining brand presence and market share.',
  dataSources: [
    { name: 'Sales Data', source: 'Internal ERP System', records: '150K+', accuracy: '99.2%' },
    { name: 'Marketing Data', source: 'Google Analytics, Meta Ads', records: '2.1M', accuracy: '97.8%' },
    { name: 'Customer Data', source: 'CRM Database', records: '45K profiles', accuracy: '95.5%' },
    { name: 'Inventory Data', source: 'Warehouse Management', records: '8,500 SKUs', accuracy: '98.9%' },
  ],
  solutions: [
    { phase: 'Descriptive', tool: 'Trend Analysis, Cohort Analysis', outcome: 'Identified key revenue drivers' },
    { phase: 'Predictive', tool: 'Linear Regression, Time Series', outcome: 'Forecasted demand with 94% accuracy' },
    { phase: 'Prescriptive', tool: 'ROI Optimization, Linear Programming', outcome: 'Optimized budget allocation' },
  ],
  results: {
    revenueIncrease: '35%',
    costReduction: '22%',
    customerRetention: '18%',
    roiImprovement: '47%',
  },
};

const resultIcons: Record<string, JSX.Element> = {
  revenueIncrease: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  costReduction: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  customerRetention: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  roiImprovement: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function CaseStudyTab() {
  const { company, industry, challenge, dataSources, solutions, results } = caseStudyData;

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">{company}</h3>
            <p className="text-white/65 mt-1">{industry}</p>
          </div>
          <Badge variant="primary">Analytics Case Study</Badge>
        </div>
        <div className="glass-subtle rounded-xl p-6">
          <p className="text-sm font-medium text-white/65 mb-2">Business Challenge</p>
          <p className="text-white">{challenge}</p>
        </div>
      </Card>

      {/* Data Sources */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-4">Data Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dataSources.map((source, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 glass-subtle rounded-xl">
              <div>
                <p className="font-medium text-white">{source.name}</p>
                <p className="text-sm text-white/65">{source.source}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-bright">{source.records}</p>
                <p className="text-xs text-emerald-400">{source.accuracy} acc</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Solutions Applied - Timeline */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-6">Analytics Pipeline</h3>
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-bright via-sky to-steel opacity-30" />

          <div className="space-y-6">
            {solutions.map((sol, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {/* Step node */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg ${
                    idx === 0 ? 'bg-gradient-to-br from-bright to-primary text-abyss'
                    : idx === 1 ? 'bg-gradient-to-br from-sky to-primary text-white border border-white/20'
                    : 'bg-gradient-to-br from-steel to-deep text-white border border-white/20'
                  }`}
                  style={{
                    boxShadow: idx === 0
                      ? '0 0 20px rgba(12,150,156,0.5)'
                      : idx === 1
                        ? '0 0 15px rgba(107,163,190,0.4)'
                        : '0 0 15px rgba(39,77,96,0.5)',
                  }}
                >
                  <span className="font-bold text-sm">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="accent">{sol.phase}</Badge>
                    <p className="text-sm text-white/65">{sol.tool}</p>
                  </div>
                  <p className="text-white font-medium">{sol.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(results).map(([key, value]) => (
          <Card key={key} className="text-center p-6 hover:shadow-glass transition-all duration-200 hover:-translate-y-0.5 min-h-[120px] flex flex-col justify-center">
            <div className="w-10 h-10 rounded-xl bg-bright/10 text-bright flex items-center justify-center mx-auto mb-3">
              {resultIcons[key]}
            </div>
            <p
              className="text-3xl font-bold mb-1"
              style={{ background: 'linear-gradient(135deg, #0C969C 0%, #6BA3BE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              {value}
            </p>
            <p className="text-xs text-white/65 capitalize whitespace-nowrap">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
