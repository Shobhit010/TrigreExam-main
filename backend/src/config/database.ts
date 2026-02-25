import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`[Database] Connected: ${connection.connection.host}/${env.mongoDbName}`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] Connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] Disconnected from MongoDB');
      isConnected = false;
    });
  } catch (error) {
    console.error('[Database] Initial connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Database] Disconnected gracefully');
}
