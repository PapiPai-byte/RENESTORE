// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/common/ProductImage';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import productService from '@/services/productService';
import type { Product } from '@/types';
import { Loader } from '@/components/common/Loader';
import { EmptyState } from '@/components/common/EmptyState';

const categories = ['All', 'Tools', 'Accessories', 'Computers', 'Laptops'];

export default function UserProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (searchParams.get('category') && searchParams.get('category') !== 'All') {
      params.category = searchParams.get('category');
    }
    if (searchParams.get('search')) {
      params.search = searchParams.get('search');
    }
    if (searchParams.get('sort')) {
      params.sort = searchParams.get('sort');
    }
    productService.getAll(params).then((data) => {
      setProducts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearch(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategory = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleSort = (value: string) => {
    setSort(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('sort', value);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">All Products</h1>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 sticky top-20 z-30 shadow-glow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="glass-input text-white px-4 py-2 rounded-xl"
          >
            <option value="" className="bg-[#031716]">Sort by</option>
            <option value="price_asc" className="bg-[#031716]">Price: Low to High</option>
            <option value="price_desc" className="bg-[#031716]">Price: High to Low</option>
            <option value="name" className="bg-[#031716]">Name: A-Z</option>
          </select>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                searchParams.get('category') === cat || (cat === 'All' && !searchParams.get('category'))
                  ? 'bg-gradient-to-r from-bright to-primary text-white shadow-glowSm'
                  : 'glass-subtle text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-6 bg-white/10 rounded w-1/3" />
                <div className="h-10 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState message="No products found matching your criteria" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-4 hover:shadow-glass transition-all duration-300 hover:-translate-y-1 group">
              <ProductImage product={product} className="mb-4" />
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h3 className="font-semibold text-white line-clamp-1">{product.name}</h3>
              <p className="text-sm text-white/60 mt-1">{product.brand}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sky font-bold text-lg">{formatCurrency(product.price)}</span>
                {product.stock < 20 && (
                  <Badge variant="danger">Low Stock</Badge>
                )}
              </div>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => handleAddToCart(product)}
                disabled={addedId === product.id}
              >
                {addedId === product.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                  </span>
                ) : (
                  'Add to Cart'
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
