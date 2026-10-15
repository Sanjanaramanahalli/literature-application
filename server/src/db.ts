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
    } else {
      // Ensure essential admin and reader accounts exist
      await ensureSeedUsers();
    }
    isInitialized = true;
    return prismaMongoAdapter;
  } catch (err) {
    console.error('[Database] MongoDB initialization error:', err);
    throw err;
  }
}

async function ensureSeedUsers() {
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const readerPasswordHash = await bcrypt.hash('ReaderPassword123!', 10);

    const usersToEnsure = [
      { email: 'admin@literature.org', name: 'Eleanor Vance (Chief Curator)', role: 'ADMIN', hash: adminPasswordHash },
      { email: 'sanjanalramanahalli@gmail.com', name: 'Sanjana Ramanahalli (Curator)', role: 'ADMIN', hash: adminPasswordHash },
      { email: 'julian@literature.org', name: 'Julian Croft', role: 'READER', hash: readerPasswordHash },
      { email: 'sanjanalr8@gmail.com', name: 'Sanjana Ramanahalli', role: 'READER', hash: readerPasswordHash },
    ];

    for (const u of usersToEnsure) {
      const existing = await prismaMongoAdapter.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        await prismaMongoAdapter.user.create({
          data: {
            name: u.name,
            email: u.email,
            passwordHash: u.hash,
            role: u.role,
          },
        });
        console.log(`[Database] Seeded missing user: ${u.email} (${u.role})`);
      }
    }
  } catch (e: any) {
    console.warn('[Database] Could not ensure seed users:', e.message);
  }
}

// Export prisma as the adapter for drop-in backward compatibility with existing route imports
export const prisma = prismaMongoAdapter;
