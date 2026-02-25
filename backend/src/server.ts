import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  // Connect to database before accepting requests
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`[Server] TrigreExam backend running on port ${env.port}`);
    console.log(`[Server] Environment: ${env.nodeEnv}`);
    console.log(`[Server] CORS origin: ${env.corsOrigin}`);
    console.log(`[Server] Health check: http://localhost:${env.port}/health`);
    console.log(`[Server] Login endpoint: POST http://localhost:${env.port}/api/auth/login`);
  });

  // Graceful shutdown — Docker/PM2/cloud platforms send SIGTERM
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received — shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase();
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });

  // Graceful shutdown — Ctrl+C in development
  process.on('SIGINT', () => {
    console.log('[Server] SIGINT received — shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  });

  // Log unhandled rejections and exit — prevents silent failures
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled promise rejection:', reason);
    server.close(() => {
      process.exit(1);
    });
  });
}

bootstrap().catch((err: unknown) => {
  console.error('[Server] Bootstrap failed:', err);
  process.exit(1);
});
