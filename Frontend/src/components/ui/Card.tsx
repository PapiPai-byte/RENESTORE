// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('glass p-6 transition-all duration-300 hover:bg-white/15 hover:shadow-glass hover:-translate-y-1 relative overflow-hidden', className)}>
    {children}
  </div>
);
