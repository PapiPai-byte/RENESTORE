import { Router, Request, Response } from 'express';
import { db } from '../db';
import { customers } from '../db/schema';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Admin: list customers
router.get('/', authenticate, authorize('admin'), asyncHandler(async (_req, res) => {
  const rows = await db.select().from(customers).orderBy(customers.signupDate);
  res.json(rows);
}));

export default router;
