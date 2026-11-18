import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { csrfMiddleware } from './middlewares/csrf';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/orders.routes';
import customerRoutes from './routes/customers.routes';
import analyticsRoutes from './routes/analytics.routes';
import campaignRoutes from './routes/campaigns.routes';
import chatRoutes from './routes/chat.routes';

const app: Express = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(csrfMiddleware);
app.use(express.json());

// Welcome endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to ReneStore API',
    version: '1.0.0',
    frontend: env.CLIENT_URL,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      products: '/api/products/*',
      orders: '/api/orders/*',
      chat: '/api/chat/*',
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api', chatRoutes);

app.use(errorHandler);

export default app;
