import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { products } from '../db/schema';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../lib/app-error';
import { authenticate, authorize } from '../middlewares/auth';
import { eq } from 'drizzle-orm';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['Tools', 'Accessories', 'Computers', 'Laptops']),
  brand: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().nonnegative(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const { category, search, sort } = _req.query;
  let rows: any[];
  if (category) {
    rows = await db.select().from(products).where(eq(products.category, category as any));
  } else {
    rows = await db.select().from(products);
  }
  if (search) {
    const s = (search as string).toLowerCase();
    rows = rows.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s)
    );
  }
  if (sort === 'price_asc') {
    rows = [...rows].sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    rows = [...rows].sort((a, b) => b.price - a.price);
  } else if (sort === 'name') {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new AppError('Invalid product ID', 400);
  }
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) {
    throw new AppError('Product not found', 404);
  }
  res.json(row);
}));

router.post('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = productSchema.parse(req.body);
  const [row] = await db.insert(products).values(parsed).returning();
  res.status(201).json(row);
}));

router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new AppError('Invalid product ID', 400);
  }
  const parsed = productSchema.partial().parse(req.body);
  const [row] = await db.update(products).set(parsed).where(eq(products.id, id)).returning();
  if (!row) {
    throw new AppError('Product not found', 404);
  }
  res.json(row);
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new AppError('Invalid product ID', 400);
  }
  const [row] = await db.delete(products).where(eq(products.id, id)).returning();
  if (!row) {
    throw new AppError('Product not found', 404);
  }
  res.json({ message: 'Product deleted', id: row.id });
}));

export default router;
