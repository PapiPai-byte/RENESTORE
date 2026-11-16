// @ts-nocheck
import api from '@/services/api';
import type { AnalyticsDescriptive, AnalyticsPredictive, AnalyticsPrescriptive } from '@/types';
import { mockAnalytics } from '@/lib/mock/analytics';

const analyticsService = {
  getDescriptive: async () => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return mockAnalytics.descriptive;
    }
    const { data } = await api.get<AnalyticsDescriptive>('/analytics/descriptive');
    return data;
  },
  getPredictive: async (months: number = 6) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return mockAnalytics.predictive;
    }
    const { data } = await api.get<AnalyticsPredictive>(`/analytics/predictive?months=${months}`);
    return data;
  },
  getPrescriptive: async (payload: {
    totalBudget: number;
    minPerChannel: Record<string, number>;
    maxPerChannel: Record<string, number>;
  }) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return mockAnalytics.prescriptive;
    }
    const { data } = await api.post<AnalyticsPrescriptive>('/analytics/prescriptive', payload);
    return data;
  },
};

export default analyticsService;
