// @ts-nocheck
import React from 'react';

export const EmptyState = ({ title, description, message, onAction }: { title?: string; description?: string; message?: string; onAction?: () => void }) => (
  <div className="py-12 text-center glass-strong inline-block w-full max-w-md px-8 animate-scale-in" role="alert">
    <svg className="w-12 h-12 text-white/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h2 className="text-xl font-semibold text-white mb-2">{title || message}</h2>
    {description && <p className="text-white/60">{description}</p>}
  </div>
);
