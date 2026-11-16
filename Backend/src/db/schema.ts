import { pgTable, serial, text, integer, doublePrecision, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import type { InferInsertModel } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['admin', 'user']);
export const segmentEnum = pgEnum('segment', ['Regular', 'Premium', 'Business']);
export const categoryEnum = pgEnum('category', ['Tools', 'Accessories', 'Computers', 'Laptops']);
export const paymentMethodEnum = pgEnum('payment_method', ['Card', 'GCash', 'COD', 'Bank Transfer']);
export const campaignChannelEnum = pgEnum('campaign_channel', ['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'cancelled']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }).unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  city: text('city').notNull(),
  signupDate: timestamp('signup_date').notNull().defaultNow(),
  segment: segmentEnum('segment').notNull().default('Regular'),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: categoryEnum('category').notNull(),
  brand: text('brand').notNull(),
  price: doublePrecision('price').notNull(),
  cost: doublePrecision('cost').notNull(),
  stock: integer('stock').notNull().default(0),
  description: text('description'),
  imageUrl: text('image_url'),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  campaignId: integer('campaign_id'),
  orderDate: timestamp('order_date').notNull().defaultNow(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  amount: doublePrecision('amount').notNull(),
  paymentDate: timestamp('payment_date').notNull().defaultNow(),
  status: transactionStatusEnum('status').notNull().default('completed'),
});

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  channel: campaignChannelEnum('channel').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  budget: doublePrecision('budget').notNull(),
  spend: doublePrecision('spend').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
});

// ── Chat / FAQ tables ────────────────────────────────────────────────────────
export const faqStatusEnum = pgEnum('faq_status', ['active', 'archived']);

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull().default('general'),
  page: text('page').notNull().default('all'),       // which page this shows on ('all'|'checkout'|'product'|'admin')
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  status: faqStatusEnum('status').notNull().default('active'),
});

export const chatLogs = pgTable('chat_logs', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userMessage: text('user_message').notNull(),
  botReply: text('bot_reply'),
  matchedFaqIds: text('matched_faq_ids').array(),   // e.g. '{1,3}'
  wasAnswered: boolean('was_answered').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports
export type InsertUser = InferInsertModel<typeof users>;
export type InsertRefreshToken = InferInsertModel<typeof refreshTokens>;
export type InsertCustomer = InferInsertModel<typeof customers>;
export type InsertProduct = InferInsertModel<typeof products>;
export type InsertOrder = InferInsertModel<typeof orders>;
export type InsertOrderItem = InferInsertModel<typeof orderItems>;
export type InsertTransaction = InferInsertModel<typeof transactions>;
export type InsertCampaign = InferInsertModel<typeof marketingCampaigns>;
export type InsertFaq = InferInsertModel<typeof faqs>;
export type InsertChatLog = InferInsertModel<typeof chatLogs>;
