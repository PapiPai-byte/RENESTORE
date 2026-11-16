// @ts-nocheck
import React from 'react';

const steps = [
  {
    id: 1,
    phase: 'Descriptive',
    description: 'Understand what happened through trend analysis and visualization',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    glow: 'shadow-[0_0_20px_rgba(12,150,156,0.5)]',
    gradient: 'from-bright to-primary',
  },
  {
    id: 2,
    phase: 'Predictive',
    description: 'Forecast future trends using regression and time series models',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    glow: 'shadow-[0_0_20px_rgba(107,163,190,0.4)]',
    gradient: 'from-sky to-primary',
  },
  {
    id: 3,
    phase: 'Prescriptive',
    description: 'Determine optimal decisions through optimization algorithms',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    glow: 'shadow-[0_0_20px_rgba(39,77,96,0.5)]',
    gradient: 'from-steel to-deep',
  },
  {
    id: 4,
    phase: 'Decision',
    description: 'Implement actions based on insights and monitor outcomes',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    glow: 'shadow-lg',
    gradient: 'from-deep to-abyss',
    border: 'border border-white/20',
  },
];

export default function ProcessFlowTab() {
  return (
    <div className="space-y-6">
      {/* Horizontal Stepper - Desktop */}
      <div className="hidden md:block">
        <div className="glass rounded-2xl p-8 shadow-glass">
          <h3 className="text-lg font-bold text-white mb-8 text-center">Analytics Decision Pipeline</h3>
          <div className="relative">
            {/* Animated connector lines */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 opacity-30">
              <div className="h-full w-full bg-gradient-to-r from-bright via-sky to-steel" />
              <div className="h-full w-full bg-gradient-to-r from-bright via-sky to-steel animate-pulse opacity-50" style={{ animationDuration: '3s' }} />
            </div>

            <div className="grid grid-cols-4 gap-4 relative">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex flex-col items-center text-center">
                  {/* Step Circle */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 z-10 transition-all duration-300 hover:scale-105 bg-gradient-to-br ${step.gradient} text-white ${step.glow} ${step.border || ''}`}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                  </div>

                  {/* Step Number */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-yellow-500 text-abyss text-xs font-bold flex items-center justify-center shadow-lg z-20">
                    {step.id}
                  </span>

                  {/* Step Content */}
                  <h4 className="font-bold text-white mb-2">{step.phase}</h4>
                  <p className="text-sm text-white/65">{step.description}</p>

                  {/* Arrow (except last) */}
                  {idx < steps.length - 1 && (
                    <svg className="absolute -right-4 top-8 w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Stepper - Mobile */}
      <div className="md:hidden glass rounded-2xl p-6 shadow-glass relative">
        <h3 className="text-lg font-bold text-white mb-6 text-center">Analytics Decision Pipeline</h3>
        {/* Connector line */}
        <div className="absolute left-10 top-20 bottom-8 w-px bg-gradient-to-b from-bright via-sky to-steel opacity-30" />

        <div className="space-y-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-4 relative">
              {/* Step Circle */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${step.gradient} text-white shadow-lg ${step.id < 4 ? 'border-bright/30' : ''}`}>
                <span className="font-bold text-lg">{step.id}</span>
              </div>

              {/* Connector line between steps */}
              {idx < steps.length - 1 && (
                <div className="absolute left-5 top-12 w-px h-8 bg-gradient-to-b from-bright/50 to-transparent" />
              )}

              {/* Step Content */}
              <div className="flex-1 pb-6 border-b border-white/10 last:border-0 last:pb-0">
                <h4 className="font-bold text-white">{step.phase}</h4>
                <p className="text-sm text-white/65 mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-4">Why This Pipeline Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.id} className="glass-subtle rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold mb-3 shadow-lg`}>
                {step.id}
              </div>
              <p className="font-bold text-white mb-2">{step.phase}</p>
              <p className="text-white/65 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
