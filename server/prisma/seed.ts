import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Classic Literature database...');

  // 1. Clear existing records safely
  await prisma.comment.deleteMany();
  await prisma.save.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.literatureTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.literature.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users (Admin and Readers)
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

  const reader2 = await prisma.user.create({
    data: {
      name: 'Clara Oswald',
      email: 'clara@literature.org',
      passwordHash: readerPasswordHash,
      role: 'READER',
    },
  });

  console.log('Created Users: 1 Admin, 2 Readers');

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Classics',
        slug: 'classics',
        description: 'Enduring works of literature that have stood the test of centuries.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Drama',
        slug: 'drama',
        description: 'Theatrical compositions in verse or prose depicting life and character.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Poetry',
        slug: 'poetry',
        description: 'Metrical writing, verse, and lyric expressions of profound human emotion.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Essays',
        slug: 'essays',
        description: 'Reflective and critical analytical writings on culture, philosophy, and mind.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Short Stories',
        slug: 'short-stories',
        description: 'Concentrated literary narratives focusing on a unified character or incident.',
      },
    }),
  ]);

  const [catClassics, catDrama, catPoetry, catEssays, catShortStories] = categories;

  // 4. Create Creators
  const creators = await Promise.all([
    prisma.creator.create({
      data: {
        name: 'William Shakespeare',
        bio: 'English playwright, poet, and actor, widely regarded as the greatest writer in the English language.',
        roleType: 'BOTH',
      },
    }),
    prisma.creator.create({
      data: {
        name: 'Leo Tolstoy',
        bio: 'Russian writer who is regarded as one of the greatest authors of all time, master of realist fiction.',
        roleType: 'AUTHOR',
      },
    }),
    prisma.creator.create({
      data: {
        name: 'Virginia Woolf',
        bio: 'English writer, considered one of the most important modernist 20th-century authors and a pioneer in stream of consciousness.',
        roleType: 'AUTHOR',
      },
    }),
    prisma.creator.create({
      data: {
        name: 'Anton Chekhov',
        bio: 'Russian playwright and short-story writer, celebrated for his profound psychological naturalism.',
        roleType: 'BOTH',
      },
    }),
    prisma.creator.create({
      data: {
        name: 'Munshi Premchand',
        bio: 'Pioneering Hindi and Urdu novelist, regarded as the Upanyas Samrat (Emperor of Novels) of Indian literature.',
        roleType: 'AUTHOR',
      },
    }),
    prisma.creator.create({
      data: {
        name: 'Kuvempu (K. V. Puttappa)',
        bio: 'Celebrated Kannada poet and author, widely regarded as the greatest Kannada literary titan of the 20th century.',
        roleType: 'BOTH',
      },
    }),
  ]);

  const [shakes, tolstoy, woolf, chekhov, premchand, kuvempu] = creators;

  // 5. Create Tags
  const tagNames = ['Tragedy', 'Philosophy', 'Morality', 'Modernism', 'Victorian', 'Existentialism'];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.create({ data: { name } }))
  );

  // Helper to generate 15-page canonical manuscript texts
  const create15PageContent = (headerTitle: string, baseText: string): string => {
    const pages: string[] = [];
    for (let p = 1; p <= 15; p++) {
      pages.push(`[ Folio ${p} — ${headerTitle} ]\n\n${baseText}\n\n[End of Folio ${p} archival entry]`);
    }
    return pages.join('\n\n---page---\n\n');
  };

  // 6. Create Literatures
  const lit1 = await prisma.literature.create({
    data: {
      title: 'Hamlet, Prince of Denmark',
      subheading: 'A Tragedy of Solitude, Betrayal, and the Burden of Vengeance',
      brief: 'Shakespeare’s quintessential tragedy explores the psychological fracture of Denmark’s grieving prince confronted by spectral revelation.',
      content: create15PageContent(
        'Hamlet, Prince of Denmark',
        `ACT I. SCENE I. Elsinore. A platform before the Castle.
FRANCISCO at his post. Enter to him BERNARDO.
BERNARDO: Who’s there?
FRANCISCO: Nay, answer me. Stand and unfold yourself.
BERNARDO: Long live the king!
HAMLET: To be, or not to be, that is the question:
Whether ’tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles
And by opposing end them. To die—to sleep,
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to: ’tis a consummation
Devoutly to be wish’d.`
      ),
      language: 'English',
      subject: 'Morality and Revenge',
      genre: 'Tragedy',
      coverImage: '/uploads/covers/hamlet.jpg',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('2026-08-15T10:00:00Z'),
      creatorId: shakes.id,
      categoryId: catDrama.id,
    },
  });

  const lit2 = await prisma.literature.create({
    data: {
      title: 'The Death of Ivan Ilyich',
      subheading: 'An Inquest into an Ordinary Life and the Awakening of the Spirit',
      brief: 'Tolstoy’s novella examining the mortal dread, bureaucratic vanity, and ultimate spiritual grace of a high-court judge.',
      content: create15PageContent(
        'The Death of Ivan Ilyich',
        `During an interval in the Melvinski trial in the large building of the Law Courts the members and public prosecutor met in Ivan Egorovich Shebek’s private room, where the conversation turned on the celebrated Krasovski case.
Ivan Ilyich’s life had been most simple and most ordinary and therefore most terrible. He had been a member of the Court of Justice, and died at the age of forty-five. His father was an official who had made his career in Petersburg in various ministries and departments.`
      ),
      language: 'English',
      subject: 'Mortality & Ethics',
      genre: 'Philosophical Fiction',
      coverImage: '/uploads/covers/ivan_ilyich.jpg',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('2026-09-01T12:00:00Z'),
      creatorId: tolstoy.id,
      categoryId: catClassics.id,
    },
  });

  const lit3 = await prisma.literature.create({
    data: {
      title: 'Modern Fiction & The Common Reader',
      subheading: 'Observations on Form, Consciousness, and the Art of the Novel',
      brief: 'Virginia Woolf dismantles Edwardian materialism to champion an authentic rendering of the luminous halo of lived consciousness.',
      content: create15PageContent(
        'Modern Fiction & The Common Reader',
        `In making any survey, even the freest and loosest, of modern fiction, it is difficult not to take it for granted that the modern practice of the art is somehow an improvement upon the old.
Look within and life, it seems, is very far from being “like this”. Examine for a moment an ordinary mind on an ordinary day. The mind receives a myriad impressions—trivial, fantastic, evanescent, or engraved with the sharpness of steel.`
      ),
      language: 'English',
      subject: 'Literary Criticism',
      genre: 'Essay',
      coverImage: '/uploads/covers/modern_fiction.jpg',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('2026-09-10T14:30:00Z'),
      creatorId: woolf.id,
      categoryId: catEssays.id,
    },
  });

  const lit4Draft = await prisma.literature.create({
    data: {
      title: 'The Seagull (Draft Archival Translation)',
      subheading: 'A Comedy in Four Acts',
      brief: 'Chekhov’s exploration of romantic entanglements, theatrical ambition, and artistic vanity at a Russian country estate.',
      content: `ACT I. The park on SORIN’S estate. A broad avenue leads toward a lake. A makeshift stage has been erected for an outdoor theatrical performance.

MEDVEDENKO: Why do you always wear black?
MASHA: I am in mourning for my life. I am unhappy.`,
      language: 'English',
      subject: 'Art and Unrequited Love',
      genre: 'Drama',
      coverImage: '/uploads/covers/seagull.jpg',
      publicationStatus: 'DRAFT',
      creatorId: chekhov.id,
      categoryId: catDrama.id,
    },
  });

  const lit5Hindi = await prisma.literature.create({
    data: {
      title: 'गोदान (Godan)',
      subheading: 'भारतीय ग्रामीण जीवन एवं किसान चेतना का अमर महाकाव्य',
      brief: 'मुंशी प्रेमचंद का कालजयी उपन्यास जो भारतीय ग्रामीण समाज, आर्थिक संघर्ष, और मानवीय गरिमा का जीवंत चित्रण करता है।',
      content: create15PageContent(
        'गोदान (Godan)',
        `होरी महतो ने बैलों को सानी-पानी देकर अपने छोटे भाई सोभा के घर की ओर देखा। सोभा अपने द्वार पर बैठा चिलम पी रहा था।
होरी ने कहा — क्यों भाई, आज कुछ काम-धंधा नहीं है क्या?
सोभा ने चिलम का कश खींचते हुए उत्तर दिया — काम-धंधा क्या करें महतो, जब खेती में बरक्कत ही न रही। लगान चुकाते-चुकाते देह की खाल खिंच गई।
होरी मन ही मन सोचने लगा कि किसान का धर्म केवल धरती को सींचना और मर्यादा की रक्षा करना है। एक गाय की लालसा उसके हृदय में वर्षों से पल रही थी। गोदान केवल एक दान नहीं, अपितु जीवन की अंतिम आकांक्षा और मुक्ति का प्रतीक था।`
      ),
      language: 'Hindi',
      subject: 'सामाजिक यथार्थ एवं ग्रामीण जीवन',
      genre: 'Classic Realism',
      coverImage: '/uploads/covers/godan.jpg',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('2026-09-12T10:00:00Z'),
      creatorId: premchand.id,
      categoryId: catClassics.id,
    },
  });

  const lit6Kannada = await prisma.literature.create({
    data: {
      title: 'ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Malegalalli Madumagalu)',
      subheading: 'ಮಲೆನಾಡಿನ ಪ್ರಕೃತಿ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ಜೀವಸ್ಪಂದನದ ಮಹಾಕಾವ್ಯ',
      brief: 'ರಾಷ್ಟ್ರಕವಿ ಕುವೆಂಪು ಅವರ ಮೇರು ಕೃತಿ, ಮಲೆನಾಡಿನ ಗಿರಿ-ಕಂದರಗಳ ನಡುವಿನ ಮನುಷ್ಯ ಬದುಕಿನ ಅನನ್ಯ ಚಿತ್ರಣವನ್ನು ಕಟ್ಟಿಕೊಡುತ್ತದೆ.',
      content: create15PageContent(
        'ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Malegalalli Madumagalu)',
        `ಮಲೆನಾಡಿನ ಹಸುರು ಕಾನನದ ನಡುವೆ ಕಾವೇರಿಯಂತೆ ಹರಿಯುವ ನಿಸರ್ಗದ ಸಿರಿಯಲ್ಲಿ ಬದುಕು ಒಂದು ಸುಂದರ ವಿಸ್ಮಯ. ತೀರ್ಥಹಳ್ಳಿಯ ಸುತ್ತಲಿನ ಗುಡ್ಡ-ಬೆಟ್ಟಗಳ ನಡುವೆ, ಮಳೆಗಾಲದ ಮಂಜು ಮುಸುಕಿದ ಬೆಟ್ಟಗಳ ಸಾಲಿನಲ್ಲಿ ಹುಟ್ಟಿದ ಕಥೆ ಇದು.
ಚಿನ್ನಮ್ಮ ಮತ್ತು ಮುಕುಂದಯ್ಯನ ಪ್ರೇಮ ಕಥೆಯು ಕೇವಲ ಇಬ್ಬರ ಹೃದಯದ ಮಿಡಿತವಲ್ಲ; ಅದು ಮಲೆನಾಡಿನ ಸಮಗ್ರ ಸಂಸ್ಕೃತಿ, ಪರಿಸರ ಮತ್ತು ನಿತ್ಯ ನೂತನ ಚೇತನದ ಅನಾವರಣ. ಮನುಷ್ಯನ ಆಸೆ-ನಿರಾಶೆಗಳು ಪ್ರಕೃತಿಯ ಮಹಾ ಲಯದೊಂದಿಗೆ ಹೇಗೆ ಒಂದಾಗುತ್ತವೆ ಎಂಬುದನ್ನು ಕುವೆಂಪು ಅವರು ತಮ್ಮ ಅಪೂರ್ವ ಲೇಖನಿಯಿಂದ ಜಾದೂವಿನಂತೆ ಮೂಡಿಸಿದ್ದಾರೆ.`
      ),
      language: 'Kannada',
      subject: 'ಪರಿಸರ ಪ್ರಜ್ಞೆ ಮತ್ತು ಮಾನವೀಯ ಸಂಬಂಧಗಳು',
      genre: 'Epic Novel',
      coverImage: '/uploads/covers/malegalalli.jpg',
      publicationStatus: 'PUBLISHED',
      publicationDate: new Date('2026-09-14T11:00:00Z'),
      creatorId: kuvempu.id,
      categoryId: catClassics.id,
    },
  });

  // Attach Tags
  await prisma.literatureTag.createMany({
    data: [
      { literatureId: lit1.id, tagId: tags[0].id }, // Tragedy
      { literatureId: lit1.id, tagId: tags[1].id }, // Philosophy
      { literatureId: lit2.id, tagId: tags[1].id }, // Philosophy
      { literatureId: lit2.id, tagId: tags[2].id }, // Morality
      { literatureId: lit3.id, tagId: tags[3].id }, // Modernism
      { literatureId: lit5Hindi.id, tagId: tags[2].id }, // Morality
      { literatureId: lit6Kannada.id, tagId: tags[1].id }, // Philosophy
    ],
  });

  // 7. Seed Ratings
  await prisma.rating.create({
    data: {
      value: 5,
      userId: reader1.id,
      literatureId: lit1.id,
    },
  });
  await prisma.rating.create({
    data: {
      value: 4,
      userId: reader2.id,
      literatureId: lit1.id,
    },
  });
  await prisma.rating.create({
    data: {
      value: 5,
      userId: reader1.id,
      literatureId: lit2.id,
    },
  });
  await prisma.rating.create({
    data: {
      value: 5,
      userId: reader2.id,
      literatureId: lit5Hindi.id,
    },
  });
  await prisma.rating.create({
    data: {
      value: 5,
      userId: reader1.id,
      literatureId: lit6Kannada.id,
    },
  });

  // 8. Seed Saves
  await prisma.save.create({
    data: {
      userId: reader1.id,
      literatureId: lit1.id,
    },
  });
  await prisma.save.create({
    data: {
      userId: reader2.id,
      literatureId: lit2.id,
    },
  });

  // 9. Seed Comments and 2-Level Threaded Replies
  const comment1 = await prisma.comment.create({
    data: {
      content: 'The psychological depth of Hamlet’s soliloquy remains unmatched in dramatic literature. The hesitation is not weakness, but hyper-consciousness.',
      userId: reader1.id,
      literatureId: lit1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Precisely, Julian. Coleridge famously termed it “an overbalance of the contemplative faculty.” A masterclass in tragic inaction.',
      userId: reader2.id,
      literatureId: lit1.id,
      parentId: comment1.id, // Direct reply
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Ivan Ilyich’s sudden realization that his respectable decorum was an illusion is chillingly relevant even in our modern corporate era.',
      userId: reader2.id,
      literatureId: lit2.id,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Summary:');
  console.log('- 1 Admin, 2 Readers');
  console.log('- 5 Categories, 4 Creators, 6 Tags');
  console.log('- 3 Published Literatures, 1 Draft Literature');
  console.log('- 3 Ratings, 2 Saves, 3 Comments (including 1 threaded reply)');
}

main()
  .catch((e) => {
    console.error(e);
    const proc = (globalThis as { process?: { exit?: (code: number) => void } }).process;
    proc?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
