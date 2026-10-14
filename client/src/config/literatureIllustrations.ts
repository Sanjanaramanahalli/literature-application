export interface LiteratureIllustration {
  src: string;
  caption: string;
  alt: string;
  sourceText?: string;
  page?: number; // specific page preference (e.g. 1, 2, 3...)
}

export const getLiteratureIllustrations = (title: string, _language?: string): LiteratureIllustration[] => {
  const normalized = (title || '').toLowerCase();

  if (normalized.includes('hamlet')) {
    return [
      {
        src: '/illustrations/hamlet-ghost.jpg',
        caption: 'Act I, Scene IV: Prince Hamlet encounters the Ghost of his father upon the battlements of Elsinore.',
        alt: 'Hamlet encountering the royal ghost on the castle ramparts',
        sourceText: 'Historical Engraving • Athenæum Folio Collection',
        page: 1,
      },
      {
        src: '/illustrations/hamlet-soliloquy.jpg',
        caption: 'Act III, Scene I: "To be, or not to be, that is the question" — The philosophical meditation in the royal hall.',
        alt: 'Prince Hamlet contemplating mortality in the castle chambers',
        sourceText: 'Shakespeare Memorial Archival Press',
        page: 2,
      },
    ];
  }

  if (normalized.includes('godan') || normalized.includes('गोदान')) {
    return [
      {
        src: '/illustrations/godan-village.jpg',
        caption: 'Belari Village: Hori Mahato and Dhaniya persevering amidst the timeless agrarian soil of Awadh.',
        alt: 'Rural Awadh village life depicting the peasant struggle of Premchand’s Godan',
        sourceText: 'Premchand Archival Memorial Collection',
        page: 1,
      },
      {
        src: '/illustrations/godan-pastoral.jpg',
        caption: 'The sacred cow and the twilight countryside — Hori gazing across the pastures.',
        alt: 'Hori observing the vast rustic fields in early dawn',
        sourceText: 'Classic Indian Realism Series',
        page: 2,
      },
    ];
  }

  if (normalized.includes('malegalalli') || normalized.includes('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು') || normalized.includes('madumagalu')) {
    return [
      {
        src: '/illustrations/malegalalli-western-ghats.jpg',
        caption: 'The misty evergreen canopy of Malnad: Kuppali, Megaravalli and the enchanted Western Ghats.',
        alt: 'Lush rainforest valley of Malnad under monsoon mist',
        sourceText: 'Kuvempu Sahitya Sansthana Archival Series',
        page: 1,
      },
      {
        src: '/illustrations/malegalalli-rain.jpg',
        caption: 'Monsoon deluge sweeping over the Tunga riverbanks and village manor.',
        alt: 'Monsoon rains falling through the verdant foliage of the Malnad hills',
        sourceText: 'Malegalalli Madumagalu Illustrated Centenary Edition',
        page: 2,
      },
    ];
  }

  if (normalized.includes('ramayana') || normalized.includes('ರಾಮಾಯಣ') || normalized.includes('darshanam')) {
    return [
      {
        src: '/illustrations/ramayana-epic.jpg',
        caption: 'The celestial hermitage and mountain dawn: The sublime epic universe of Sri Ramayana Darshanam.',
        alt: 'Epic mountain sunrise reflecting spiritual grandeur',
        sourceText: 'Jnanpith Commemorative Archival Plate',
        page: 1,
      },
    ];
  }

  if (normalized.includes('kamayani') || normalized.includes('कामायनी')) {
    return [
      {
        src: '/illustrations/kamayani-himalayas.jpg',
        caption: 'The icy peaks of the eternal Himalayas: Manu contemplating the cosmic deluge and human regeneration.',
        alt: 'Snow-capped Himalayan summits symbolizing the dawn of human consciousness',
        sourceText: 'Chhayavaad Poetic Gallery',
        page: 1,
      },
    ];
  }

  if (normalized.includes('madhushala') || normalized.includes('मधुशाला')) {
    return [
      {
        src: '/illustrations/madhushala-tavern.jpg',
        caption: 'The allegorical tavern of life: "मदिरालय जाने को घर से चलता है पीनेवला..."',
        alt: 'Mystic tavern and wine cup allegories of Harivansh Rai Bachchan',
        sourceText: 'Bachchan Centenary Archival Folio',
        page: 1,
      },
    ];
  }

  if (normalized.includes('rashmirathi') || normalized.includes('रश्मिरथी')) {
    return [
      {
        src: '/illustrations/rashmirathi-chariot.jpg',
        caption: 'Karna standing upon the battlefield of Kurukshetra: The blazing son of Surya.',
        alt: 'Sun chariot illuminating the martial sky of the Mahabharata',
        sourceText: 'Dinkar Rashtrakavi Memorial Editions',
        page: 1,
      },
    ];
  }

  if (normalized.includes('pride') || normalized.includes('prejudice')) {
    return [
      {
        src: '/illustrations/pride-prejudice-ballroom.jpg',
        caption: 'The Assembly Rooms of Meryton: Elizabeth Bennet observing Mr. Darcy.',
        alt: 'Regency era ballroom gathering',
        sourceText: 'Regency Classic Illustrated Library',
        page: 1,
      },
    ];
  }

  // Universal classical manuscript illustration fallback
  return [
    {
      src: '/illustrations/classical-manuscript-etching.jpg',
      caption: `Historical Archive Plate: An authentic engraving accompanying the classical study of "${title}".`,
      alt: `Classical literary engraving plate for ${title}`,
      sourceText: 'Athenæum Classic Manuscript Editions',
      page: 1,
    },
  ];
};

export const getIllustrationForFolio = (
  title: string,
  language: string | undefined,
  folioPage: number,
  _totalFolios: number
): LiteratureIllustration | null => {
  // Only show the unique frontispiece illustration on Folio 1.
  // All subsequent pages (2+) are purely focused on high text content to ensure
  // a balanced text-to-image ratio and eliminate repeated image clutter.
  if (folioPage !== 1) {
    return null;
  }

  const specificList = getLiteratureIllustrations(title, language);
  if (specificList.length > 0) {
    return specificList[0];
  }

  return null;
};

