import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['Tools', 'Accessories', 'Computers', 'Laptops']),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const orderSchema = z.object({
  campaignId: z.number().int().positive().optional(),
  paymentMethod: z.enum(['Card', 'GCash', 'COD', 'Bank Transfer']),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
});

export const prescriptiveSchema = z.object({
  totalBudget: z.number().positive('Total budget must be positive'),
  minPerChannel: z.record(z.string(), z.number()),
  maxPerChannel: z.record(z.string(), z.number()),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  channel: z.enum(['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budget: z.number().positive('Budget must be positive'),
  spend: z.number().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
});
