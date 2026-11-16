import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { orders, orderItems, transactions, products, customers } from '../db/schema';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../lib/app-error';
import { authenticate, authorize } from '../middlewares/auth';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const orderSchema = z.object({
  campaignId: z.number().int().positive().optional(),
  paymentMethod: z.enum(['Card', 'GCash', 'COD', 'Bank Transfer']),
  items: z.array(orderItemSchema).min(1),
});

router.get('/', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.orderDate));
  const result = await Promise.all(rows.map(async (order) => {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  }));
  res.json(result);
}));

router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const parsed = orderSchema.parse(req.body);
  const userId = (req as any).user!.userId;

  const [customer] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  if (!customer) {
    throw new AppError('Customer account not found. Please contact support.', 400);
  }

  let total = 0;
  const stockUpdates: Array<{ productId: number; quantity: number }> = [];

  for (const item of parsed.items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 400);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
    }
    total += product.price * item.quantity;
    stockUpdates.push({ productId: item.productId, quantity: item.quantity });
  }

  const createdOrder = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      customerId: customer.id,
      campaignId: parsed.campaignId || null,
      totalAmount: total,
      status: 'completed',
    }).returning();

    for (const item of parsed.items) {
      const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product!.price,
      });
      await tx.update(products).set({ stock: product!.stock - item.quantity }).where(eq(products.id, item.productId));
    }

    await tx.insert(transactions).values({
      orderId: order.id,
      paymentMethod: parsed.paymentMethod,
      amount: total,
      status: 'completed',
    });

    return order;
  });

  const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, createdOrder.id));
  res.status(201).json({ ...createdOrder, items: orderItemsList });
}));

export default router;
