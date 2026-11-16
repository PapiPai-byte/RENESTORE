// @ts-nocheck
import React from 'react';

export const Loader = () => (
  <div className="flex justify-center items-center py-12" role="status">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-bright animate-spin"></div>
      <div className="absolute inset-0 rounded-full bg-bright/20 blur-lg"></div>
    </div>
    <span className="sr-only">Loading...</span>
  </div>
);
