import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import { signAccessToken, signRefreshToken, getRefreshExpiresAt } from '../utils/jwt';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../lib/app-error';
import { authenticate } from '../middlewares/auth';
import { eq } from 'drizzle-orm';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const tokenSchema = z.object({ refreshToken: z.string() });

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.parse(req.body);
  const existing = await db.select().from(users).where(eq(users.email, parsed.email)).limit(1);
  if (existing.length > 0) {
    throw new AppError('Email already registered', 400);
  }
  const hashedPassword = await bcrypt.hash(parsed.password, 10);
  const [user] = await db.insert(users).values({
    name: parsed.name,
    email: parsed.email,
    passwordHash: hashedPassword,
    role: 'user',
  }).returning();
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  const expiresAt = getRefreshExpiresAt();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: await bcrypt.hash(refreshToken, 10),
    expiresAt,
    revoked: false,
  });
  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.parse(req.body);
  const [user] = await db.select().from(users).where(eq(users.email, parsed.email)).limit(1);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  const valid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  const expiresAt = getRefreshExpiresAt();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: await bcrypt.hash(refreshToken, 10),
    expiresAt,
    revoked: false,
  });
  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: rt } = tokenSchema.parse(req.body);
  const hash = await bcrypt.hash(rt, 10);
  const stored = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hash)).limit(1);
  if (!stored.length) {
    throw new AppError('Invalid refresh token', 401);
  }
  const tokenRecord = stored[0];
  if (tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
    throw new AppError('Refresh token expired or revoked', 401);
  }
  const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role });
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, tokenRecord.id));
  const expiresAt = getRefreshExpiresAt();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: await bcrypt.hash(newRefreshToken, 10),
    expiresAt,
    revoked: false,
  });
  res.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = tokenSchema.parse(req.body);
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.tokenHash, refreshToken));
  res.json({ message: 'Logged out' });
}));

router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const [user] = await db.select().from(users).where(eq(users.id, (req as any).user!.userId)).limit(1);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}));

export default router;
