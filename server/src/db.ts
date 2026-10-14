import { connectMongo } from './dbMongo.js';
import { prismaMongoAdapter } from './dbAdapter.js';
import { seedMongoDatabase } from './seedMongo.js';

let isInitialized = false;

export async function initDatabase(): Promise<typeof prismaMongoAdapter> {
  if (isInitialized) {
    return prismaMongoAdapter;
  }

  try {
    const conn = await connectMongo();
    if (!conn) {
      // Running in serverless in-memory mode
      const { seedMemoryStore } = await import('./memoryStore.js');
      await seedMemoryStore();
      isInitialized = true;
      return prismaMongoAdapter;
    }
    // Auto-seed if the database is currently empty
    const count = await prismaMongoAdapter.literature.count();
    if (count === 0) {
      console.log('[Database] Empty MongoDB detected. Running initial data seeder...');
      await seedMongoDatabase();
    }
    isInitialized = true;
    return prismaMongoAdapter;
  } catch (err) {
    console.error('[Database] MongoDB initialization error:', err);
    throw err;
  }
}

// Export prisma as the adapter for drop-in backward compatibility with existing route imports
export const prisma = prismaMongoAdapter;
