// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/common/ProductImage';
import { formatCurrency } from '@/lib/utils';
import productService from '@/services/productService';
import type { Product } from '@/types';
import { Loader } from '@/components/common/Loader';
import { EmptyState } from '@/components/common/EmptyState';

const categories = [
  { name: 'Tools', gradient: 'from-steel to-deep', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { name: 'Accessories', gradient: 'from-bright to-primary', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  { name: 'Computers', gradient: 'from-sky to-primary', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Laptops', gradient: 'from-primary to-bright', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];

export default function UserHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getAll().then((data) => {
      setProducts(data.slice(0, 4));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-12 glass-strong p-8 md:p-14">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bright/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky/15 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 max-w-2xl">
          <Badge variant="accent" className="mb-4">New Season</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-sm">
            Your One-Stop Shop for Tech & Tools
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Discover premium products at unbeatable prices. From professional tools to cutting-edge computers.
          </p>
          <Link
            to="/user/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-bright text-white font-semibold px-8 py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_4px_20px_rgba(12,150,156,0.4)]"
          >
            Shop Now
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c, i) => (
            <Link
              key={c.name}
              to={`/user/products?category=${c.name}`}
              className="relative rounded-xl overflow-hidden h-32 glass group transition-all duration-300 hover:-translate-y-1 hover:shadow-glass"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
              <svg className="absolute top-3 right-3 w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
              </svg>
              <div className="relative z-10 h-full flex items-end p-4">
                <span className="text-white font-bold text-lg">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Featured Products</h2>
          <Link to="/user/products" className="text-sky hover:text-white text-sm font-medium transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-6 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState message="No products found" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <Card key={product.id} className="p-4 hover:shadow-glass transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${i * 100}ms` }}>
                <ProductImage product={product} className="mb-4" />
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                <h3 className="font-semibold text-white">{product.name}</h3>
                <p className="text-sm text-white/60 mt-1">{product.brand}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sky font-bold text-lg">{formatCurrency(product.price)}</span>
                  {product.stock < 20 && (
                    <Badge variant="danger">Low Stock</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
