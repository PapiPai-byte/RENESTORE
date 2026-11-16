import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = req.headers.origin;
    const isDevelopment = env.NODE_ENV === 'development';

    if (origin) {
      if (origin !== env.CLIENT_URL) {
        return res.status(403).json({ message: 'Forbidden: invalid origin' });
      }
    } else if (!isDevelopment) {
      return res.status(403).json({ message: 'Forbidden: origin required' });
    }
  }
  next();
};
