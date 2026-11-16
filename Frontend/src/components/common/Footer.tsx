// @ts-nocheck
import React from 'react';

export const Footer = () => (
  <footer className="glass-subtle border-t border-white/10 py-8 text-center mt-auto"
    aria-label="Footer"
  >
    <div className="max-w-7xl mx-auto px-4">
      <p className="font-semibold text-white tracking-wide text-lg">
        Rene<span className="text-bright">Store</span>
      </p>
      <p className="text-sm text-white/50 mt-2">
        © {new Date().getFullYear()} ReneStore. All rights reserved. Precision tools & tech solutions.
      </p>
    </div>
  </footer>
);
