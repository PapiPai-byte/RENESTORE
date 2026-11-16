// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

const categoryStyles = {
  Tools: { bg: 'from-steel to-deep', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  Accessories: { bg: 'from-bright to-primary', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  Computers: { bg: 'from-sky to-primary', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  Laptops: { bg: 'from-primary to-bright', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
};

export const ProductImage = ({ product, className }: { product?: { category: string; name: string }; className?: string }) => {
  if (!product) return (
    <div className={cn('w-full h-48 rounded-xl glass flex items-center justify-center', className)}>
      <svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    </div>
  );

  const style = categoryStyles[product.category] || categoryStyles.Tools;

  return (
    <div className={cn('w-full h-48 rounded-xl bg-gradient-to-br overflow-hidden relative group ring-1 ring-white/20', style.bg, className)}>
      <svg className="absolute inset-0 w-full h-full text-white/20 m-4 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={style.icon} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 p-3 glass-subtle backdrop-blur-sm">
        <p className="text-white text-xs font-medium truncate">{product.name}</p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};
