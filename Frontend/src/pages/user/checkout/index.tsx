// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ProductImage } from '@/components/common/ProductImage';
import { Loader } from '@/components/common/Loader';

const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card', description: 'Visa, Mastercard, Amex' },
  { id: 'gcash', label: 'GCash', description: 'Pay via GCash wallet' },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when you receive' },
  { id: 'bank', label: 'Bank Transfer', description: 'Direct bank transfer' },
];

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const handleCheckout = async () => {
    setProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    const generatedId = Math.floor(Math.random() * 1000000) + 100000;
    setOrderId(generatedId);
    clearCart();
    setOrderComplete(true);
    setProcessing(false);
  };

  if (orderComplete && orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-strong rounded-2xl p-12 shadow-glow animate-scale-in">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Order Confirmed!</h1>
          <p className="text-white/60 mb-2 text-center">Thank you for your purchase.</p>
          <p className="text-sm text-white/40 mb-6 text-center">Order #{orderId}</p>
          <div className="glass-subtle rounded-xl p-4 mb-6">
            <p className="text-sm text-white/70">
              <span className="font-medium text-white">Total paid:</span>{' '}
              <span className="text-sky font-semibold">{formatCurrency(totalAmount)}</span>
            </p>
            <p className="text-sm text-white/70 mt-1">
              <span className="font-medium text-white">Payment method:</span>{' '}
              <span className="text-white">{paymentMethods.find(p => p.id === selectedPayment)?.label}</span>
            </p>
          </div>
          <Button variant="primary" className="w-full" onClick={() => navigate('/user/home')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    navigate('/user/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0">
                  <ProductImage product={item.product} className="w-16 h-16 rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.product.name}</p>
                    <p className="text-sm text-white/60">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-sky">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Methods */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedPayment === method.id
                      ? 'border-bright/60 bg-gradient-to-br from-bright/10 to-primary/10 shadow-[0_0_15px_rgba(12,150,156,0.2)]'
                      : 'border-white/10 glass-subtle hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    selectedPayment === method.id ? 'border-bright bg-bright/20' : 'border-white/30'
                  }`}>
                    {selectedPayment === method.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-bright" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{method.label}</p>
                    <p className="text-sm text-white/60">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Summary */}
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
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              disabled={processing}
              onClick={handleCheckout}
            >
              {processing ? <Loader /> : 'Place Order'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
