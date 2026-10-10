import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let memoryServerInstance: any = null;

export async function connectMongo(): Promise<typeof mongoose> {
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
      console.log('[MongoDB] Connected successfully to MongoDB:', mongoose.connection.host);
      return mongoose;
    } catch (err: any) {
      console.error('[MongoDB] Connection error with configured URI:', err.message || err);
      // Fallback for development/testing if URI is unreachable
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MongoDB] Falling back to automated in-memory MongoDB server for testing...');
        return await startInMemoryMongo();
      }
      throw err;
    }
  }

  // 2. In development or test mode, if no MONGODB_URI is provided yet, auto-spin Memory Server
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
