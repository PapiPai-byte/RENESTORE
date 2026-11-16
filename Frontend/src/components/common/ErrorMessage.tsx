// @ts-nocheck
import React from 'react';

export const ErrorMessage = ({ message, className }: { message: string; className?: string }) => (
  <div className={className ? `glass border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 rounded-xl relative ${className}` : 'glass border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 rounded-xl relative'} role="alert">
    <svg className="w-5 h-5 text-red-400 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <strong className="font-bold">Error:</strong> <span className="block sm:inline">{message}</span>
  </div>
);
