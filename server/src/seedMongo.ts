import bcrypt from 'bcryptjs';
import { prismaMongoAdapter as prisma } from './dbAdapter.js';
import {
  hamletPages,
  godanPages,
  malegalalliPages,
  ramayanaDarshanamPages,
  nakutantiPages,
  samskaraPages,
  beralgeKoralPages,
  kavyaManjariPages,
  kamayaniPages,
  madhushalaPages,
  rashmirathiPages,
  gabanPages,
} from './classicalLiteratureTexts.js';
import { indianArtCraftsData } from './seedArtCraftData.js';

export async function seedMongoDatabase() {
  console.log('[Seeder] Seeding initial data into MongoDB...');

  // 1. Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const readerPasswordHash = await bcrypt.hash('ReaderPassword123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Eleanor Vance (Chief Curator)',
      email: 'admin@literature.org',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const reader1 = await prisma.user.create({
    data: {
      name: 'Julian Croft',
      email: 'julian@literature.org',
      passwordHash: readerPasswordHash,
      role: 'READER',
    },
  });

  // 2. Categories
  const catClassics = await prisma.category.create({
    data: {
      name: 'Classics',
      slug: 'classics',
      description: 'Enduring works of literature that have stood the test of centuries.',
    },
  });

  const catDrama = await prisma.category.create({
    data: {
      name: 'Drama',
      slug: 'drama',
      description: 'Theatrical compositions in verse or prose depicting life and character.',
    },
  });

  const catPoetry = await prisma.category.create({
    data: {
      name: 'Poetry',
      slug: 'poetry',
      description: 'Literary work in which expression of feelings and ideas is given by rhythm and style.',
    },
  });

  const catPhilosophy = await prisma.category.create({
    data: {
      name: 'Philosophy',
      slug: 'philosophy',
      description: 'Fundamental nature of knowledge, reality, and human existence.',
    },
  });

  // 3. Creators
  const shakespeare = await prisma.creator.create({
    data: {
      name: 'William Shakespeare',
      bio: 'English playwright, poet, and actor, widely regarded as the greatest writer in the English language.',
      roleType: 'BOTH',
    },
  });

  const kuvempu = await prisma.creator.create({
    data: {
      name: 'Kuppali Venkatappa Puttappa (Kuvempu)',
      bio: 'Revered Kannada novelist, poet, playwright, and scholar; recipient of the prestigious Jnanpith Award.',
      roleType: 'BOTH',
    },
  });

  const premchand = await prisma.creator.create({
    data: {
      name: 'Munshi Premchand',
      bio: 'Indian pioneer of modern Hindi-Urdu social realism and fiction literature.',
      roleType: 'AUTHOR',
    },
  });

  // 4. Literatures
  const hamlet = await prisma.literature.create({
    data: {
      title: 'Hamlet, Prince of Denmark',
      subheading: 'The Tragedy of the Danish Prince',
      brief: 'Shakespeare’s supreme masterpiece exploring tragedy, existential sorrow, indecision, and moral duty.',
      content: hamletPages.join('\n\n---page---\n\n'),
      language: 'English',
      genre: 'Tragedy',
      subject: 'Revenge, sanity, existential inquiry, mortality',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('1603-01-01'),
      creatorId: shakespeare.id,
      categoryId: catDrama.id,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85',
    },
  });

  const godan = await prisma.literature.create({
    data: {
      title: 'Godan (गोदान)',
      subheading: 'The Epic of the Indian Peasantry',
      brief: 'Munshi Premchand’s monumental Hindi novel chronicling the struggles, dignity, and socioeconomic realities of rural India.',
      content: godanPages.join('\n\n---page---\n\n'),
      language: 'Hindi',
      genre: 'Social Realism',
      subject: 'Rural life, caste realities, social inequality, human empathy',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('1936-01-01'),
      creatorId: premchand.id,
      categoryId: catClassics.id,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85',
    },
  });

  const malegalalli = await prisma.literature.create({
    data: {
      title: 'Malegalalli Madumagalu (ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು)',
      subheading: 'The Bride of the Malnad Hills',
      brief: 'Kuvempu’s magnum opus depicting the panoramic tapestry of life, love, folklore, and nature in Karnataka’s Western Ghats.',
      content: malegalalliPages.join('\n\n---page---\n\n'),
      language: 'Kannada',
      genre: 'Epic Novel',
      subject: 'Malnad nature, culture, human destiny, sociological realism',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('1967-01-01'),
      creatorId: kuvempu.id,
      categoryId: catClassics.id,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85',
    },
  });

  // 5. Initial Ratings and Saves
  await prisma.rating.create({
    data: {
      value: 5,
      userId: reader1.id,
      literatureId: hamlet.id,
    },
  });

  await prisma.save.create({
    data: {
      userId: reader1.id,
      literatureId: hamlet.id,
    },
  });

  // 6. Seed Art & Crafts
  if (Array.isArray(indianArtCraftsData) && indianArtCraftsData.length > 0) {
    for (const craft of indianArtCraftsData.slice(0, 30)) {
      await prisma.artCraft.create({ data: craft });
    }
  }

  console.log('[Seeder] MongoDB data seed complete!');
}
