import { prisma } from './src/db.js';

async function check() {
  const db = prisma as any;
  const count = await db.artCraft.count();
  const states = await db.artCraft.findMany({ select: { state: true }, distinct: ['state'] });
  console.log('Total ArtCraft in DB:', count);
  console.log('Distinct states count:', states.length);
  const channapatna = await db.artCraft.findFirst({ where: { name: 'Channapatna Toys' } });
  console.log('Channapatna Toys verified:', !!channapatna, channapatna?.localName, 'Place:', channapatna?.place);
  const rajasthan = await db.artCraft.findMany({ where: { state: 'Rajasthan' } });
  console.log('Rajasthan crafts:', rajasthan.map((r: any) => `${r.name} (${r.region} / ${r.place})`));
  
  // Verify Literature still present
  const litCount = await prisma.literature.count();
  console.log('Literature count:', litCount);
  await prisma.$disconnect();
}

check();
