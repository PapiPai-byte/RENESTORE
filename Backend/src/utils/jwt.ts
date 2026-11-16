import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const ACCESS_TOKEN_EXPIRES = '15m';
export const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type JwtPayload = {
  userId: number;
  role: string;
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET || env.JWT_SECRET, {
    expiresIn: `${Math.floor(REFRESH_TOKEN_EXPIRES_MS / 1000)}s`,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET || env.JWT_SECRET) as JwtPayload;
}

export function getRefreshExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
}