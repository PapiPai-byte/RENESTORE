// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = ({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: string[];
  activeTab: string;
  onSelect: (tab: string) => void;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (!trackRef.current) return;
    const activeBtn = trackRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <div className="w-full sm:w-auto">
      <div
        ref={trackRef}
        className="glass inline-flex gap-1 p-1 rounded-2xl overflow-x-auto scrollbar-thin max-w-full"
        role="tablist"
        aria-label="Analytics tabs"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
            role="tab"
            aria-selected={tab === activeTab}
            data-active={tab === activeTab}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-250 whitespace-nowrap flex-shrink-0',
              'min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              tab === activeTab
                ? 'bg-white/20 text-white font-semibold shadow-[0_0_15px_rgba(12,150,156,0.35)] border-b-2 border-bright/70'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-transparent',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};
