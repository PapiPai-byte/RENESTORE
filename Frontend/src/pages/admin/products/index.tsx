// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import productService from '@/services/productService';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ProductImage } from '@/components/common/ProductImage';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Tools',
    brand: '',
    price: 0,
    cost: 0,
    stock: 0,
    description: '',
    imageUrl: '',
  });

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      description: p.description,
      imageUrl: p.imageUrl,
    });
    setShowModal(true);
  };

  const startAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      category: 'Tools',
      brand: '',
      price: 0,
      cost: 0,
      stock: 0,
      description: '',
      imageUrl: '',
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowModal(false);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'price' || name === 'cost' || name === 'stock' ? Number(value) : value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        const updated = await productService.update(editing.id, form);
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      } else {
        const created = await productService.create(form);
        setProducts(prev => [...prev, created]);
      }
      cancelEdit();
    } catch (e: any) {
      setError(e.message ?? 'Save error');
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const remove = async () => {
    if (!deletingId) return;
    try {
      await productService.delete(deletingId);
      setProducts(prev => prev.filter(p => p.id !== deletingId));
    } catch (e: any) {
      setError(e.message ?? 'Delete failed');
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Product Management</h1>
        <Button variant="primary" onClick={startAdd}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Button>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : (
        <div className="glass rounded-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  {['Image', 'Name', 'Category', 'Brand', 'Price', 'Stock', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-sm font-medium text-white/80">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p, idx) => (
                  <tr key={p.id} className={`transition-colors hover:bg-white/10 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                    <td className="px-6 py-4">
                      <ProductImage product={p} className="w-16 h-16 rounded-lg" />
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-4 text-white/60">{p.category}</td>
                    <td className="px-6 py-4 text-white/60">{p.brand}</td>
                    <td className="px-6 py-4 font-semibold text-sky">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4">
                      {p.stock < 20 ? (
                        <span className="glass-subtle text-red-300 px-2 py-1 rounded-full text-xs font-medium">Low Stock ({p.stock})</span>
                      ) : (
                        <span className="text-white/60">{p.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(p)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => confirmDelete(p.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={cancelEdit}>
        <h2 className="text-xl font-bold text-white mb-6">
          {editing ? 'Edit Product' : 'Add New Product'}
        </h2>
        {error && <ErrorMessage message={error} className="mb-4" />}
        <form onSubmit={submit} className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Brand" name="brand" value={form.brand} onChange={handleChange} required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="glass-input text-white w-full"
            >
              {['Tools', 'Accessories', 'Computers', 'Laptops'].map(c => (
                <option key={c} value={c} className="bg-[#031716]">{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" name="price" type="number" value={String(form.price)} onChange={handleChange} required />
            <Input label="Cost" name="cost" type="number" value={String(form.cost)} onChange={handleChange} required />
          </div>
          <Input label="Stock" name="stock" type="number" value={String(form.stock)} onChange={handleChange} required />
          <Input label="Image URL" name="imageUrl" value={form.imageUrl} onChange={handleChange} />
          <Input label="Description" name="description" value={form.description} onChange={handleChange} required />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editing ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete Product?</h3>
          <p className="text-white/60 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={remove}>Delete</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
