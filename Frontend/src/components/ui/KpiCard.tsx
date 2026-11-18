// @ts-nocheck
import React from 'react';
import { cn, formatCompactCurrency } from '@/lib/utils';

const iconMap: Record<string, JSX.Element> = {
  'Total Revenue': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Total Orders': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'Avg Order Value': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  'Profit Margin': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  'Total Customers': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-12 0v1zm-3 3a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  'Total Profit': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  'Stockout Items': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const iconColor: Record<string, string> = {
  'Total Revenue': 'text-sky',
  'Total Profit': 'text-emerald-300',
  'Total Orders': 'text-bright',
  'Avg Order Value': 'text-amber-400',
  'Profit Margin': 'text-emerald-400',
  'Total Customers': 'text-sky',
  'Stockout Items': 'text-amber-400',
};

const accentGradient: Record<string, string> = {
  'Total Revenue': 'linear-gradient(90deg, #6BA3BE, #0C969C)',
  'Total Profit': 'linear-gradient(90deg, #10B981, #059669)',
  'Total Orders': 'linear-gradient(90deg, #0C969C, #0A7075)',
  'Avg Order Value': 'linear-gradient(90deg, #E3A008, #0C969C)',
  'Profit Margin': 'linear-gradient(90deg, #1F9D6B, #0C969C)',
  'Total Customers': 'linear-gradient(90deg, #0C969C, #6BA3BE)',
  'Stockout Items': 'linear-gradient(90deg, #F59E0B, #EF4444)',
};

export const KpiCard = ({
  title,
  value,
  description,
  delay = 0,
}: {
  title: string;
  value: string | number | null | undefined;
  description?: string;
  delay?: number;
}) => {
  const num = typeof value === 'number' ? value : 0;
  const displayValue = num >= 1000 ? formatCompactCurrency(num) : String(value ?? '0');
  const colorClass = iconColor[title] ?? 'text-bright';
  const grad = accentGradient[title] ?? 'linear-gradient(90deg, #0C969C, #6BA3BE)';

  return (
    <div
      className={cn(
        'glass relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]',
        'animate-slide-up',
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      role="region"
      aria-label={title}
    >
      {/* Gradient top accent — clipped by overflow-hidden */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-[1rem]"
        style={{ background: grad }}
        aria-hidden="true"
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: 'inset 0 0 40px rgba(12,150,156,0.10)' }}
        aria-hidden="true"
      />

      {/* Icon chip + title row */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15 ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-105',
            colorClass,
          )}
        >
          {iconMap[title] ?? iconMap['Total Revenue']}
        </div>
        <p className="text-xs font-medium text-white/65 uppercase tracking-wider leading-tight">{title}</p>
      </div>

      {/* Value on its own row below */}
      <p className="text-2xl xl:text-3xl font-bold text-white mt-4 relative z-10 whitespace-nowrap tabular-nums">
        {displayValue}
        <span className="sr-only">{title}, value is {typeof value === 'number' ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value) : value}</span>
      </p>

      {description && (
        <p className="text-xs text-white/50 mt-1 truncate relative z-10">{description}</p>
      )}
    </div>
  );
};
