export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Product {
  id: number;
  name: string;
  category: 'Tools' | 'Accessories' | 'Computers' | 'Laptops';
  brand: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export interface Customer {
  id: number;
  userId?: number;
  name: string;
  email: string;
  city: string;
  signupDate: string; // ISO
  segment: 'Regular' | 'Premium' | 'Business';
}

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  customerId: number;
  campaignId?: number;
  orderDate: string; // ISO
  totalAmount: number;
  status: string;
  items: OrderItem[];
}

export interface Campaign {
  id: number;
  name: string;
  channel: 'Facebook' | 'Google Ads' | 'Email' | 'TikTok' | 'Instagram';
  startDate: string;
  endDate: string;
  budget: number;
  spend: number;
  clicks: number;
  conversions: number;
}

export interface AnalyticsDescriptive {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    profitMargin: number;
    totalCustomers: number;
  };
  salesByMonth: { month: string; revenue: number; orders: number }[];
  salesByCategory: { category: string; revenue: number }[];
  topProducts: { name: string; revenue: number; unitsSold: number }[];
  salesByCity: { city: string; revenue: number }[];
  campaignPerformance: {
    channel: string;
    spend: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
    costPerConversion: number;
    roi: number;
  }[];
}

export interface AnalyticsPredictive {
  method: string;
  equation: string;
  rSquared: number;
  history: { month: string; revenue: number }[];
  forecast: { month: string; revenue: number }[];
  channelModels: { channel: string; slope: number; intercept: number; rSquared: number }[];
}

export interface Allocation {
  channel: string;
  recommendedSpend: number;
  expectedRevenue: number;
  expectedRoi: number;
}

export interface AnalyticsPrescriptive {
  method: string;
  allocation: Allocation[];
  totalExpectedRevenue: number;
  stockRecommendations: { category: string; action: string; reason: string }[];
  explanation: string;
}
