// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'loading'>;

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const variantClasses = {
  primary: 'bg-gradient-to-r from-primary to-bright text-white font-semibold focus-visible:ring-2 focus-visible:ring-bright/60 shadow-[0_4px_20px_rgba(12,150,156,0.4)] hover:shadow-[0_6px_24px_rgba(12,150,156,0.6)] hover:brightness-110 active:scale-95 transition-all duration-200 rounded-xl',
  secondary: 'bg-white/5 border border-white/20 text-white hover:bg-white/15 backdrop-blur-md hover:border-white/40 active:scale-95 transition-all duration-200 rounded-xl focus-visible:ring-2 focus-visible:ring-white/30',
  danger: 'bg-gradient-to-r from-red-600/80 to-danger/90 text-white backdrop-blur-md focus-visible:ring-2 focus-visible:ring-danger/60 shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all duration-200 rounded-xl',
  link: 'bg-transparent text-sky hover:text-white underline-offset-4 hover:underline focus-visible:ring-bright/60 disabled:cursor-not-allowed transition-colors duration-150',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, className, type = 'button', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss disabled:cursor-not-allowed disabled:opacity-60',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
