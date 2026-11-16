// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

export const Badge = ({
  children,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'success';
  className?: string;
}) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md';
  const variants = {
    primary: 'bg-bright/20 text-sky border-bright/40',
    secondary: 'bg-white/10 text-white/80 border-white/20',
    danger: 'bg-red-500/20 text-red-300 border-red-500/40',
    accent: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return <span className={cn(base, variants[variant], className)}>{children}</span>;
};
