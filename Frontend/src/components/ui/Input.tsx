// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          'w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-bright/60',
          'border',
          error
            ? 'border-red-400/60 bg-red-500/10 text-red-200 focus-visible:ring-red-400/60'
            : 'border-white/20 bg-white/10 focus:bg-white/15 focus:border-bright/60',
          'disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-white/40',
        )}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  ),
);

Input.displayName = 'Input';
