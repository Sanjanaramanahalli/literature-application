import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let memoryServerInstance: any = null;
let isMemoryMode = false;

export function isUsingMemoryStore(): boolean {
  return isMemoryMode;
}

export async function connectMongo(): Promise<typeof mongoose | null> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  // 1. If a valid MongoDB URI is provided (Atlas or local), connect directly
  if (uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) {
    try {
      console.log('[MongoDB] Connecting to MongoDB Atlas / cluster...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      isConnected = true;
      isMemoryMode = false;
      console.log('[MongoDB] Connected successfully to MongoDB:', mongoose.connection.host);
      return mongoose;
    } catch (err: any) {
      console.error('[MongoDB] Connection error with configured URI:', err.message || err);
      // In serverless/Vercel, if external Mongo fails or is unconfigured, fall back to memoryStore
      if (process.env.VERCEL) {
        console.warn('[MongoDB] Vercel environment detected. Using fast zero-dependency in-memory data store.');
        isMemoryMode = true;
        return null;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MongoDB] Falling back to automated in-memory MongoDB server for testing...');
        return await startInMemoryMongo();
      }
      throw err;
    }
  }

  // 2. On Vercel serverless environment, MongoMemoryServer cannot run binaries; use fast pure JS memoryStore
  if (process.env.VERCEL) {
    console.log('[MongoDB] Serverless environment without external MONGODB_URI. Using fast in-memory store.');
    isMemoryMode = true;
    return null;
  }

  // 3. In local development or test mode, auto-spin Memory Server
  console.log('[MongoDB] No external MONGODB_URI found. Initializing automated MongoDB instance...');
  return await startInMemoryMongo();
}

async function startInMemoryMongo(): Promise<typeof mongoose> {
  if (memoryServerInstance) {
    return mongoose;
  }
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = memoryServerInstance.getUri();
    console.log('[MongoDB] In-Memory MongoDB Server running at:', memoryUri);
    await mongoose.connect(memoryUri);
    isConnected = true;
    return mongoose;
  } catch (err) {
    console.error('[MongoDB] Failed to start automated memory server:', err);
    throw err;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}
