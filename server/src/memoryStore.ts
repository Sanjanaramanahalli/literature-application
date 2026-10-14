import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
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
import { expandedClassicalLibrary } from './expandedClassicalLibrary.js';
import { indianArtCraftsData } from './seedArtCraftData.js';

export interface MemoryStore {
  users: any[];
  creators: any[];
  categories: any[];
  tags: any[];
  literatureTags: any[];
  literatures: any[];
  ratings: any[];
  saves: any[];
  comments: any[];
  votes: any[];
  artCrafts: any[];
  externalSavedWorks: any[];
}

export const memoryStore: MemoryStore = {
  users: [],
  creators: [],
  categories: [],
  tags: [],
  literatureTags: [],
  literatures: [],
  ratings: [],
  saves: [],
  comments: [],
  votes: [],
  artCrafts: [],
  externalSavedWorks: [],
};

let isSeeded = false;

export async function seedMemoryStore() {
  if (isSeeded && memoryStore.literatures.length > 0) return;

  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const readerPasswordHash = await bcrypt.hash('ReaderPassword123!', 10);

  const adminUser = {
    id: 'user_admin_001',
    name: 'Eleanor Vance (Chief Curator)',
    email: 'admin@literature.org',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const readerUser = {
    id: 'user_reader_001',
    name: 'Julian Croft',
    email: 'julian@literature.org',
    passwordHash: readerPasswordHash,
    role: 'READER',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.users = [adminUser, readerUser];

  // Categories
  const catClassics = {
    id: 'cat_classics',
    name: 'Classics',
    slug: 'classics',
    description: 'Enduring works of literature that have stood the test of centuries.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const catDrama = {
    id: 'cat_drama',
    name: 'Drama',
    slug: 'drama',
    description: 'Theatrical compositions in verse or prose depicting life and character.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const catPoetry = {
    id: 'cat_poetry',
    name: 'Poetry',
    slug: 'poetry',
    description: 'Literary work in which expression of feelings and ideas is given by rhythm and style.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const catPhilosophy = {
    id: 'cat_philosophy',
    name: 'Philosophy',
    slug: 'philosophy',
    description: 'Fundamental nature of knowledge, reality, and human existence.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.categories = [catClassics, catDrama, catPoetry, catPhilosophy];

  // Creators
  const shakespeare = {
    id: 'creator_shakespeare',
    name: 'William Shakespeare',
    bio: 'English playwright, poet, and actor, widely regarded as the greatest writer in the English language.',
    avatarUrl: null,
    roleType: 'BOTH',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const kuvempu = {
    id: 'creator_kuvempu',
    name: 'Kuppali Venkatappa Puttappa (Kuvempu)',
    bio: 'Revered Kannada novelist, poet, playwright, and scholar; recipient of the prestigious Jnanpith Award.',
    avatarUrl: null,
    roleType: 'BOTH',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const premchand = {
    id: 'creator_premchand',
    name: 'Munshi Premchand',
    bio: 'Indian pioneer of modern Hindi-Urdu social realism and fiction literature.',
    avatarUrl: null,
    roleType: 'AUTHOR',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.creators = [shakespeare, kuvempu, premchand];

  // Literatures
  const hamlet = {
    id: 'lit_hamlet',
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
    coverImage: '/covers/hamlet.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const godan = {
    id: 'lit_godan',
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
    coverImage: '/covers/hindi-godan.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const malegalalli = {
    id: 'lit_malegalalli',
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
    coverImage: '/covers/kannada-malegalalli.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ramayana = {
    id: 'lit_ramayana',
    title: 'Sri Ramayana Darshanam (ಶ್ರೀ ರಾಮಾಯಣ ದರ್ಶನಂ)',
    subheading: 'Mahakavya in Modern Kannada',
    brief: 'Kuvempu’s monumental epic poem reimagining Valmiki’s Ramayana through spiritual humanism.',
    content: ramayanaDarshanamPages.join('\n\n---page---\n\n'),
    language: 'Kannada',
    genre: 'Epic Poetry',
    subject: 'Dharma, transformation, epic verse, spiritual humanism',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1949-01-01'),
    creatorId: kuvempu.id,
    categoryId: catPoetry.id,
    coverImage: '/covers/kannada-ramayana-darshanam.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const nakutanti = {
    id: 'lit_nakutanti',
    title: 'Naku Tanti (ನಾಕು ತಂತಿ)',
    subheading: 'The Four Strings of Consciousness',
    brief: 'Da Ra Bendre’s mystic masterpiece synthesizing sensory lyricism and Vedic consciousness.',
    content: nakutantiPages.join('\n\n---page---\n\n'),
    language: 'Kannada',
    genre: 'Mystic Lyric Poetry',
    subject: 'Consciousness, poetic mysticism, cadence, transcendental vision',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1964-01-01'),
    creatorId: kuvempu.id,
    categoryId: catPoetry.id,
    coverImage: '/covers/kannada-nakutanti.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const samskara = {
    id: 'lit_samskara',
    title: 'Samskara: A Rite for a Dead Man (ಸಂಸ್ಕಾರ)',
    subheading: 'Existential Crisis in an Agrahara',
    brief: 'U.R. Ananthamurthy’s pioneering modernist novel examining tradition, desire, and moral responsibility.',
    content: samskaraPages.join('\n\n---page---\n\n'),
    language: 'Kannada',
    genre: 'Existential Novel',
    subject: 'Tradition vs conscience, death, morality, cultural crisis',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1965-01-01'),
    creatorId: kuvempu.id,
    categoryId: catClassics.id,
    coverImage: '/covers/kannada-samskara.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const beralge = {
    id: 'lit_beralge',
    title: 'Beralge Koral (ಬೆರಳ್ಗೆ ಕೊರಳ್)',
    subheading: 'Sacrifice of Ekalavya',
    brief: 'Kuvempu’s tragic verse-drama challenging caste hierarchies through Ekalavya and Drona.',
    content: beralgeKoralPages.join('\n\n---page---\n\n'),
    language: 'Kannada',
    genre: 'Verse Drama',
    subject: 'Justice, sacrifice, archery, righteousness',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1947-01-01'),
    creatorId: kuvempu.id,
    categoryId: catDrama.id,
    coverImage: '/covers/kannada-natakagalu.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const kavya = {
    id: 'lit_kavya',
    title: 'Kavya Manjari (ಕಾವ್ಯ ಮಂಜರಿ)',
    subheading: 'Blossoms of Malnad Lyricism',
    brief: 'Celebrated anthology of early lyric poetry celebrating Karnataka’s landscape, love, and spiritual awe.',
    content: kavyaManjariPages.join('\n\n---page---\n\n'),
    language: 'Kannada',
    genre: 'Lyric Poetry',
    subject: 'Malnad hills, romanticism, national awakening, divine love',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1930-01-01'),
    creatorId: kuvempu.id,
    categoryId: catPoetry.id,
    coverImage: '/covers/kannada-kavya.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const kamayani = {
    id: 'lit_kamayani',
    title: 'Kamayani (कामायनी)',
    subheading: 'The Great Chhayavadi Epic of Human Consciousness',
    brief: 'Jaishankar Prasad’s Chhayavadi epic tracing the psychological and emotional evolution of humanity.',
    content: kamayaniPages.join('\n\n---page---\n\n'),
    language: 'Hindi',
    genre: 'Epic Chhayavadi Poetry',
    subject: 'Human psyche, Manu, Shraddha, Ida, intellect vs feeling',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1936-01-01'),
    creatorId: premchand.id,
    categoryId: catPoetry.id,
    coverImage: '/covers/hindi-kamayani.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const madhushala = {
    id: 'lit_madhushala',
    title: 'Madhushala (मधुशाला)',
    subheading: 'The Tavern of Life and Metaphysics',
    brief: 'Harivansh Rai Bachchan’s iconic verse collection using the metaphor of the tavern to reflect on life, mortality, and unity.',
    content: madhushalaPages.join('\n\n---page---\n\n'),
    language: 'Hindi',
    genre: 'Philosophical Lyric',
    subject: 'Mortality, companionship, human equality, mysticism',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1935-01-01'),
    creatorId: premchand.id,
    categoryId: catPhilosophy.id,
    coverImage: '/covers/hindi-madhushala.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const rashmirathi = {
    id: 'lit_rashmirathi',
    title: 'Rashmirathi (रश्मिरथी)',
    subheading: 'The Sun-Charioteer: Valor and Destiny of Karna',
    brief: 'Ramdhari Singh Dinkar’s heroic epic centered on Karna’s moral complexity, loyalty, and tragic dignity.',
    content: rashmirathiPages.join('\n\n---page---\n\n'),
    language: 'Hindi',
    genre: 'Heroic Epic Poetry',
    subject: 'Karna, honor, moral duty, caste, friendship, Mahabharata',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1952-01-01'),
    creatorId: premchand.id,
    categoryId: catPoetry.id,
    coverImage: '/covers/hindi-rashmirathi.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const gaban = {
    id: 'lit_gaban',
    title: 'Gaban (ग़बन)',
    subheading: 'Embezzlement, Vanity, and Social Awakening',
    brief: 'Premchand’s masterly psychological and social novel exposing middle-class pretension and moral redemption.',
    content: gabanPages.join('\n\n---page---\n\n'),
    language: 'Hindi',
    genre: 'Social Realism Novel',
    subject: 'Middle-class aspirations, debt, moral courage, independence',
    publicationStatus: 'PUBLISHED',
    publicationDate: new Date('1931-01-01'),
    creatorId: premchand.id,
    categoryId: catClassics.id,
    coverImage: '/covers/hindi-gaban.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.literatures = [
    hamlet,
    godan,
    malegalalli,
    ramayana,
    nakutanti,
    samskara,
    beralge,
    kavya,
    kamayani,
    madhushala,
    rashmirathi,
    gaban,
  ];

  // Integrate all 135 expanded canonical masterworks (45 English, 45 Hindi, 45 Kannada)
  const categoryMap: Record<string, string> = {
    classics: catClassics.id,
    drama: catDrama.id,
    poetry: catPoetry.id,
    philosophy: catPhilosophy.id,
  };

  const creatorMap = new Map<string, string>();
  for (const c of memoryStore.creators) {
    creatorMap.set(c.name.toLowerCase().trim(), c.id);
  }

  for (const item of expandedClassicalLibrary) {
    // If literature already exists by title or id, skip or update
    const existingLit = memoryStore.literatures.find(
      (l) => l.id === item.id || l.title.toLowerCase() === item.title.toLowerCase()
    );
    if (existingLit) continue;

    // Ensure creator exists
    const authorNorm = item.author.trim();
    let creatorId = creatorMap.get(authorNorm.toLowerCase());
    if (!creatorId) {
      creatorId = 'creator_' + Math.abs(authorNorm.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(16);
      const newCreator = {
        id: creatorId,
        name: authorNorm,
        bio: `Eminent author and literary visionary of classical ${item.language} letters.`,
        avatarUrl: null,
        roleType: 'AUTHOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.creators.push(newCreator);
      creatorMap.set(authorNorm.toLowerCase(), creatorId);
    }

    const assignedCatId = categoryMap[item.categorySlug] || catClassics.id;

    memoryStore.literatures.push({
      id: item.id,
      title: item.title,
      subheading: item.subheading,
      brief: item.brief,
      content: item.content,
      language: item.language,
      genre: item.genre,
      subject: item.subject,
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('1900-01-01'),
      creatorId,
      categoryId: assignedCatId,
      coverImage: item.coverImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Ratings
  memoryStore.ratings = [
    {
      id: 'rating_001',
      value: 5,
      userId: readerUser.id,
      literatureId: hamlet.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'rating_002',
      value: 5,
      userId: readerUser.id,
      literatureId: godan.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Saves
  memoryStore.saves = [
    {
      id: 'save_001',
      userId: readerUser.id,
      literatureId: hamlet.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'save_002',
      userId: readerUser.id,
      literatureId: malegalalli.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Art & Crafts
  if (Array.isArray(indianArtCraftsData) && indianArtCraftsData.length > 0) {
    memoryStore.artCrafts = indianArtCraftsData.slice(0, 30).map((c: any) => ({
      id: c.id || randomUUID(),
      ...c,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  isSeeded = true;
}
