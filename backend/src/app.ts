import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import { globalErrorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // Security headers — must come before routes
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    })
  );

  // CORS — only allows requests from the configured frontend origin
  app.use(
    cors({
      origin: env.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // Body parsing with size limit to prevent payload attacks
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // HTTP request logging
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // Health check — no auth required
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'TrigreExam backend is running',
      timestamp: new Date().toISOString(),
      env: env.nodeEnv,
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);

  // 404 handler — must come after all routes
  app.use(notFoundMiddleware);

  // Global error handler — must be last
  app.use(globalErrorMiddleware);

  return app;
}
