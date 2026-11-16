// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ProductImage } from '@/components/common/ProductImage';
import { EmptyState } from '@/components/common/EmptyState';

export default function CartPage() {
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Your cart is empty"
          message="Start shopping to add items to your cart."
          action="Browse Products"
          onAction={() => navigate('/user/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id} className="flex items-center gap-4 p-4 hover:shadow-glass transition-all duration-200">
              <ProductImage product={item.product} className="w-24 h-24 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{item.product.name}</h3>
                <p className="text-sm text-white/60">{item.product.brand}</p>
                <p className="text-sky font-bold mt-1">{formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="ml-2 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  aria-label="Remove item"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="font-bold text-white">{formatCurrency(item.product.price * item.quantity)}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 glass-strong">
            <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span className="text-emerald-400">Free</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white text-lg">
                <span>Total</span>
                <span className="text-sky font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <Button variant="primary" className="w-full mb-3" onClick={() => navigate('/user/checkout')}>
              Proceed to Checkout
            </Button>
            <Button variant="secondary" className="w-full" onClick={clearCart}>
              Clear Cart
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
