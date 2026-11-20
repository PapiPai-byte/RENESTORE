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
    purchaseBudget?: number;
  }) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return mockAnalytics.prescriptive;
    }
    const constraints: Record<string, { min: number; max: number }> = {};
    for (const ch of Object.keys(payload.minPerChannel)) {
      constraints[ch] = {
        min: payload.minPerChannel[ch],
        max: payload.maxPerChannel[ch] ?? payload.totalBudget,
      };
    }
    const { data } = await api.post<AnalyticsPrescriptive>('/analytics/prescriptive/optimize-budget', {
      totalBudget: payload.totalBudget,
      constraints,
      purchaseBudget: payload.purchaseBudget ?? 250000,
    });
    return data;
  },

  getInventoryPlan: async (budget: number = 250000) => {
    const { data } = await api.get(`/analytics/prescriptive/inventory-plan?budget=${budget}`);
    return data;
  },

  getDataOverview: async () => {
    const { data } = await api.get('/analytics/data-overview');
    return data;
  },

  getDataQuality: async () => {
    const { data } = await api.get('/analytics/data-quality');
    return data;
  },

  getProcessFlow: async (totalBudget: number = 100000, purchaseBudget: number = 250000) => {
    const params = new URLSearchParams({ totalBudget: String(totalBudget), purchaseBudget: String(purchaseBudget) });
    const { data } = await api.get(`/analytics/process-flow?${params.toString()}`);
    return data;
  },

  getCaseStudy: async () => {
    const { data } = await api.get('/analytics/case-study');
    return data;
  },

  getDataSources: async () => {
    const { data } = await api.get('/analytics/data-sources');
    return data;
  },

  updateDataSource: async (tableKey: string, source: string) => {
    const { data } = await api.put(`/analytics/data-sources/${tableKey}`, { source });
    return data;
  },
};

export default analyticsService;
