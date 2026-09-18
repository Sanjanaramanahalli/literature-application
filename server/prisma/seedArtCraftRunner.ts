import { PrismaClient } from '@prisma/client';
import { indianArtCraftsData } from './seedArtCraftData.js';

const prisma = new PrismaClient();

export async function seedArtCrafts() {
  console.log('Seeding Indian Art & Craft collection (28 States)...');

  // Ensure ArtCraft table exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ArtCraft" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "localName" TEXT,
      "state" TEXT NOT NULL,
      "region" TEXT,
      "district" TEXT,
      "place" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "originPeriod" TEXT NOT NULL,
      "history" TEXT NOT NULL,
      "culturalSignificance" TEXT NOT NULL,
      "culturalBackground" TEXT NOT NULL,
      "materials" TEXT NOT NULL,
      "makingProcess" TEXT NOT NULL,
      "traditionalProducts" TEXT NOT NULL,
      "modernContext" TEXT NOT NULL,
      "coverImage" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ArtCraft_state_idx" ON "ArtCraft"("state");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ArtCraft_type_idx" ON "ArtCraft"("type");
  `);

  let added = 0;
  for (const craft of indianArtCraftsData) {
    const existing = await prisma.artCraft.findFirst({
      where: { name: craft.name, state: craft.state },
    });

    if (!existing) {
      await prisma.artCraft.create({
        data: {
          name: craft.name,
          localName: craft.localName,
          state: craft.state,
          region: craft.region,
          district: craft.district,
          place: craft.place,
          type: craft.type,
          originPeriod: craft.originPeriod,
          history: craft.history,
          culturalSignificance: craft.culturalSignificance,
          culturalBackground: craft.culturalBackground,
          materials: craft.materials,
          makingProcess: craft.makingProcess,
          traditionalProducts: craft.traditionalProducts,
          modernContext: craft.modernContext,
          coverImage: craft.coverImage,
          status: craft.status || 'PUBLISHED',
        },
      });
      added++;
    }
  }

  const totalCount = await prisma.artCraft.count();
  console.log(`Art & Craft seeding complete: ${added} new added, ${totalCount} total in database.`);
}

// Allow standalone execution
if (process.argv[1]?.includes('seedArtCraftRunner.ts') || process.argv[1]?.includes('seedArtCraftRunner.js')) {
  seedArtCrafts()
    .catch((e) => {
      console.error('ArtCraft seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
