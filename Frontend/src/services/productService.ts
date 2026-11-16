// @ts-nocheck
import api from '@/services/api';
import type { Product } from '@/types';
import { mockProducts } from '@/lib/mock/products';

const productService = {
  getAll: async (params?: Record<string, any>) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      let products = [...mockProducts];
      if (params?.category) {
        products = products.filter(p => p.category === params.category);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
        );
      }
      if (params?.sort) {
        if (params.sort === 'price_asc') {
          products = [...products].sort((a, b) => a.price - b.price);
        } else if (params.sort === 'price_desc') {
          products = [...products].sort((a, b) => b.price - a.price);
        } else if (params.sort === 'name') {
          products = [...products].sort((a, b) => a.name.localeCompare(b.name));
        }
      }
      return products;
    }
    const { data } = await api.get<Product[]>('/products', { params });
    return data;
  },
  getById: async (id: number) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return mockProducts.find(p => p.id === id) || mockProducts[0];
    }
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },
  create: async (payload: Omit<Product, 'id'>) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const product = { ...payload, id: Date.now() };
      mockProducts.push(product);
      return product;
    }
    const { data } = await api.post<Product>('/products', payload);
    return data;
  },
  update: async (id: number, payload: Partial<Product>) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx >= 0) {
        mockProducts[idx] = { ...mockProducts[idx], ...payload };
        return mockProducts[idx];
      }
      return null;
    }
    const { data } = await api.put<Product>(`/products/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx >= 0) mockProducts.splice(idx, 1);
      return;
    }
    await api.delete(`/products/${id}`);
  },
};

export default productService;
