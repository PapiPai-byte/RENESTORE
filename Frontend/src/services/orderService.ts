// @ts-nocheck
import api from '@/services/api';
import type { Order } from '@/types';
import { mockData } from '@/lib/mock';

const orderService = {
  create: async (payload: {
    paymentMethod: string;
    items: { productId: number; quantity: number }[];
    campaignId?: number;
  }) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      // Simple mock order – total amount is sum of quantity * 1000 (dummy price)
      const total = payload.items.reduce((sum, i) => sum + i.quantity * 1000, 0);
      const mockOrder: Order = {
        id: Date.now(),
        customerId: 1,
        campaignId: payload.campaignId,
        orderDate: new Date().toISOString(),
        totalAmount: total,
        status: 'completed',
        items: payload.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: 1000,
        })),
      };
      return mockOrder;
    }
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },
};

export default orderService;
