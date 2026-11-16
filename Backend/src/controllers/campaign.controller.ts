import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { marketingCampaigns } from '../db/schema';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../lib/app-error';
import { authenticate, authorize } from '../middlewares/auth';
import { eq } from 'drizzle-orm';

const router = Router();

const campaignSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['Facebook', 'Google Ads', 'Email', 'TikTok', 'Instagram']),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  budget: z.number().positive(),
  spend: z.number().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
});

router.get('/', authenticate, authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  const rows = await db.select().from(marketingCampaigns).orderBy(marketingCampaigns.startDate);
  res.json(rows);
}));

router.post('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = campaignSchema.parse(req.body);
  const [row] = await db.insert(marketingCampaigns).values({
    ...parsed,
    startDate: parsed.startDate instanceof Date ? parsed.startDate : new Date(parsed.startDate),
    endDate: parsed.endDate instanceof Date ? parsed.endDate : new Date(parsed.endDate),
  }).returning();
  res.status(201).json(row);
}));

router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new AppError('Invalid campaign ID', 400);
  }
  const parsed = campaignSchema.partial().parse(req.body);
  const updateData: any = { ...parsed };
  if (parsed.startDate !== undefined) {
    updateData.startDate = parsed.startDate instanceof Date ? parsed.startDate : new Date(parsed.startDate);
  }
  if (parsed.endDate !== undefined) {
    updateData.endDate = parsed.endDate instanceof Date ? parsed.endDate : new Date(parsed.endDate);
  }
  const [row] = await db.update(marketingCampaigns).set(updateData).where(eq(marketingCampaigns.id, id)).returning();
  if (!row) {
    throw new AppError('Campaign not found', 404);
  }
  res.json(row);
}));

export default router;
