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
  reorderLevel?: number;
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
  paymentMethod?: string;
  shippingCost?: number;
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

export interface InventoryPurchase {
  id: number;
  supplier: string;
  productId: number;
  quantity: number;
  unitCost: number;
  purchaseDate: string;
  leadTimeDays: number;
}

export interface DescriptiveStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface AnalyticsDescriptive {
  kpis: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    avgOrderValue: number;
    profitMargin: number;
    totalCustomers: number;
    stockoutCount: number;
  };
  salesByMonth: { month: string; revenue: number; profit: number; orders: number; isPartial?: boolean }[];
  salesByCategory: { category: string; revenue: number; unitsSold: number }[];
  topProducts: { name: string; category: string; revenue: number; unitsSold: number }[];
  bottomProducts: { name: string; category: string; revenue: number; unitsSold: number; stock: number }[];
  salesByCity: { city: string; revenue: number; orders: number }[];
  salesByPaymentMethod: { method: string; revenue: number; orders: number; percentage: number }[];
  ordersByStatus: { status: string; count: number; percentage: number }[];
  customersBySegment: { segment: string; customers: number }[];
  inventoryPurchasesBySupplier: { supplier: string; records: number; quantity: number; spend: number }[];
  inventoryPurchasesByMonth: { month: string; spend: number; quantity: number }[];
  campaignPerformance: {
    channel: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    costPerOrder: number;
    revenue: number;
    roi: number;
  }[];
  statistics: {
    orderValue: DescriptiveStats;
    monthlyRevenue: DescriptiveStats;
  };
}

export interface AnalyticsPredictive {
  sharedDateRange: {
    startMonth: string;
    endMonth: string;
    totalHistoricalMonths: number;
  };
  models: {
    linearRegression: {
      equation: string;
      slope: number;
      intercept: number;
      rSquared: number;
      rmse: number;
      interpretation: string;
    };
    movingAverage: {
      windowSize: number;
      rmse: number;
      interpretation: string;
    };
    recommendedModel: 'Linear Regression' | 'Moving Average';
    recommendationReason: string;
  };
  history: {
    month: string;
    revenue: number;
    profit: number;
    orders: number;
    lrFitted: number | null;
    maFitted: number | null;
    isPartial?: boolean;
  }[];
  forecast: {
    month: string;
    linearRegression: number;
    movingAverage: number;
  }[];
  channelPredictions: {
    channel: string;
    historicalRoi: number;
    predictedRoi: number;
    historicalSpend: number;
    historicalRevenue: number;
    observations: number;
    trend: 'increasing' | 'stable' | 'diminishing';
  }[];
  stockoutRisks: {
    productId: number;
    name: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    monthlyDemand: number;
    leadTimeDays: number;
    daysOfInventory: number | null;
    riskLevel: 'High' | 'Medium' | 'Low';
    suggestedReorderQty: number;
    supplier: string;
  }[];
  dataConfidenceNote: string;
}

export interface BudgetAllocation {
  channel: string;
  budget: number;
  sharePct: number;
  expectedRevenue: number;
  roi: number;
  roas: number;
  marginalRoas: number;
  boundHit: 'MIN' | 'MAX' | null;
  historicalSpend: number;
  changePct: number;
}

export interface Baseline {
  name: string;
  expectedRevenue: number;
  upliftPct: number;
}

export interface ActionRecommendation {
  type: 'increase' | 'maintain' | 'decrease';
  channel: string;
  actionText: string;
  rationale: string;
}

export interface InventoryPlanItem {
  productId: number;
  productName: string;
  category: string;
  supplier: string;
  currentStock: number;
  reorderLevel: number;
  reorderPoint: number;
  economicOrderQty: number;
  recommendedOrderQty: number;
  unitCost: number;
  totalCost: number;
  priority: 'Immediate' | 'Upcoming' | 'Adequate';
  leadTimeDays: number;
  projectedRevenue: number;
}

export interface InventoryPlanResponse {
  purchaseBudget: number;
  totalCommittedCost: number;
  remainingBudget: number;
  itemsToReorderCount: number;
  projectedProfit: number;
  items: InventoryPlanItem[];
}

export interface AnalyticsPrescriptive {
  totalBudget: number;
  totalAllocated: number;
  totalExpectedRevenue: number;
  overallROI: number;
  overallROAS: number;
  allocations: BudgetAllocation[];
  baselines: Baseline[];
  actionList: ActionRecommendation[];
  insights: string[];
  inventoryPlan: InventoryPlanResponse;
  generatedAt: string;
  dataRange: { from: string; to: string; recordsUsed: number };
}
