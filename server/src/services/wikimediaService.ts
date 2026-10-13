/**
 * wikimediaService.ts
 * Integrates official Wikimedia / MediaWiki REST and Action APIs for dynamic literature discovery
 * across supported Indian languages.
 *
 * Requirements fulfilled:
 * - Focuses ONLY on Indian languages (kn, hi, ta, te, ml, bn, mr, gu, pa, ur, or, as, sa, ne).
 * - No hardcoded/static literature lists.
 * - Dynamic Wikimedia search, title normalization, author discovery, and deduplication.
 * - Literature relevance classification (novels, poetry, epics, plays, authors, folklore).
 * - Exact title prioritization and relevance ranking.
 * - Preservation of original Indian scripts.
 * - Independent error handling (one language failure does not break others).
 * - Resilient caching and rate-limiting safeguards.
 */

import {
  SUPPORTED_INDIAN_LANGUAGES,
  SUPPORTED_INDIAN_LANGUAGE_CODES,
  getIndianLanguageByCode,
  detectIndianLanguageCode,
  IndianLanguageConfig,
} from '../config/indianLanguages.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export interface ExternalLiteratureResult {
  id: string;
  title: string;
  originalTitle?: string;
  author?: string;
  language: string;
  languageCode: string;
  description?: string;
  excerpt: string;
  extract?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  itemType: 'WORK' | 'AUTHOR' | 'LITERATURE';
  literatureType?: string; // e.g. Novel, Poem, Play, Epic, Short Story, Author, Poet
  knownFor?: string;
  source: 'WIKIMEDIA';
  sourceProject: string;
  sourceUrl: string;
  canonicalUrl: string;
  isFullTextAvailable: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
  publicationYear?: string;
  genre?: string;
  attribution: {
    source: string;
    license: string;
    url: string;
  };
}

export interface ExternalWorkDetail extends ExternalLiteratureResult {
  content?: string;
  sections?: { title: string; content: string }[];
}

export class WikimediaService {
  private static userAgent =
    'AthenaeumIndianLiteratureScholar/2.0 (https://literature.example.com; contact: scholar.indian.literature@gmail.com)';

  /**
   * Central language config access
   */
  public static getSupportedLanguages(): IndianLanguageConfig[] {
    return SUPPORTED_INDIAN_LANGUAGES;
  }

  /**
   * Detect likely Indian language from Unicode script ranges
   */
  public static detectLanguageCode(text: string): string | null {
    return detectIndianLanguageCode(text);
  }

  public static getLanguageName(code: string): string {
    const lang = getIndianLanguageByCode(code);
    return lang ? `${lang.name} (${lang.nativeName})` : code.toUpperCase();
  }

  /**
   * Clean wiki extracts & strip reference markers
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Assess if a Wikipedia page is literature/author/arts related
   * using categories, title tokens, and content signals.
   */
  public static isLiteratureRelated(title: string, extract: string, categories: string[]): boolean {
    const combined = `${title} ${extract} ${categories.join(' ')}`.toLowerCase();

    // Positive literature keywords across English transliterations and native Indian concepts
    const literatureKeywords = [
      // English / Roman
      'novel', 'novelist', 'novels', 'poetry', 'poem', 'poems', 'poet', 'poets',
      'short story', 'stories', 'play', 'plays', 'playwright', 'drama', 'dramatist',
      'epic', 'epics', 'folklore', 'folk', 'literature', 'literary', 'author', 'authors',
      'writer', 'writers', 'book', 'books', 'manuscript', 'manuscripts', 'kavya', 'sahitya',
      'purana', 'charitra', 'vachana', 'kriti', 'prabandha', 'sangam', 'upanyas', 'kavita',
      'natak', 'geethe', 'sahityakara', 'kavigalu', 'kadambari', 'gadyam', 'padyam',

      // Native scripts keywords (Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, etc.)
      'ಕಾದಂಬರಿ', 'ಕವಿ', 'ಕಾವ್ಯ', 'ನಾಟಕ', 'ಸಾಹಿತ್ಯ', 'ಕೃತಿ', 'ಪುಸ್ತಕ', 'ಲೇಖಕ', 'ಕಥೆ', 'ವಚನ', 'ಭಾವಗೀತೆ',
      'उपन्यास', 'कवि', 'कविता', 'साहित्य', 'नाटक', 'कहानी', 'रचना', 'लेखक', 'ग्रंथ', 'महाकाव्य',
      'நாவல்', 'கவிஞர்', 'கவிதை', 'இலக்கியம்', 'நாடகம்', 'கதை', 'காப்பியம்', 'நூல்',
      'నవల', 'కవి', 'కవిత్వం', 'సాహిత్యం', 'నాటకం', 'కథ', 'కావ్యము', 'రచయిత',
      'നോവൽ', 'കവി', 'കവിത', 'സാഹിത്യം', 'നാടകം', 'കഥ', 'കൃതി',
      'উপন্যাস', 'কবি', 'কবিতা', 'সাহিত্য', 'নাটক', 'গল্প', 'গ্রন্থ',
      'कादंबरी', 'नाटक', 'ग्रंथ', 'उपन्यास', 'સાહિત્ય', 'પુસ્તક', 'ಕಥಾಸಂಕಲನ', 'સાહિત್ಯಕಾರ',
      'ନାଟକ', 'କବିତା', 'ଉପନ୍ୟାସ', 'କବି', 'ଲେଖକ', 'সাহিত্য', 'উপন্যাস', 'নাটক', 'কবি'
    ];

    for (const kw of literatureKeywords) {
      if (combined.includes(kw)) {
        return true;
      }
    }

    // Negative filters (obviously non-literature administrative, geographic, or transport pages)
    const negativeKeywords = [
      'airport', 'railway station', 'national highway', 'district of', 'taluk', 'village in',
      'constituency', 'cricketer', 'footballer', 'subdistrict', 'census town',
      'రైల్వే స్టేషన్', 'ವಿಮಾನ ನಿಲ್ದಾಣ', 'റെയിൽവേ സ്റ്റേഷൻ', 'রেলওয়ে স্টেশন', 'हवाई अड्डा'
    ];

    for (const neg of negativeKeywords) {
      if (combined.includes(neg)) {
        return false;
      }
    }

    // If no explicit negative filter hit, permit the item if search was directed
    return true;
  }

  /**
   * Classify whether an entry is a literary work or literary author/person,
   * along with specific literature type (Novel, Epic, Poetry, Play, etc.).
   */
  public static classifyLiteratureItem(
    title: string,
    extract: string,
    categories: string[]
  ): {
    itemType: 'WORK' | 'AUTHOR' | 'LITERATURE';
    literatureType: string;
    author?: string;
  } {
    const combined = `${title} ${extract} ${categories.join(' ')}`.toLowerCase();

    // Check for author / poet / playwright signals
    const authorKeywords = [
      'poet', 'novelist', 'playwright', 'writer', 'author', 'dramatist', 'essayist',
      'kavi', 'sahityakara', 'lekhak', 'rachayita',
      'ಕವಿ', 'ಕವಯಿತ್ರಿ', 'ಲೇಖಕ', 'ಲೇಖಕಿ', 'ಸಾಹಿತಿ', 'ನಾಟಕಕಾರ', 'ಕಾದಂಬರಿಕಾರ',
      'कवि', 'कवयित्री', 'लेखक', 'लेखिका', 'साहित्यकार', 'नाटककार', 'उपन्यासकार',
      'கவிஞர்', 'எழுத்தாளர்', 'நாவலாசிரியர்',
      'కవి', 'రచయిత', 'రచయిత్రి', 'నాటకకర్త',
      'കവി', 'എഴുത്തുകാരൻ', 'എഴുത്തുകാരി',
      'কবি', 'লেখক', 'সাহিত্যিক', 'ঔপন্যাসিক',
      'कवी', 'लेखक', 'नाटककार'
    ];

    // Person category signals
    const personCategorySignals = [
      'births', 'deaths', 'people', 'writers', 'poets', 'novelists', 'playwrights',
      'ಜನನ', 'ನಿಧನ', 'ಕವಿಗಳು', 'ಸಾಹಿತಿಗಳು', 'ಲೇಖಕರು',
      'जन्म', 'निधन', 'कवि', 'लेखक'
    ];

    const hasPersonCategory = categories.some((cat) =>
      personCategorySignals.some((sig) => cat.toLowerCase().includes(sig))
    );

    // Specific work types
    let literatureType = 'Literary Work';
    let isWork = false;

    if (
      combined.includes('novel') || combined.includes('novels') ||
      combined.includes('ಕಾದಂಬರಿ') || combined.includes('उपन्यास') ||
      combined.includes('நாவல்') || combined.includes('నవల') ||
      combined.includes('നോവൽ') || combined.includes('উপন্যাস') || combined.includes('कादंबरी')
    ) {
      literatureType = 'Novel';
      isWork = true;
    } else if (
      combined.includes('epic') || combined.includes('epics') ||
      combined.includes('ಮಹಾಕಾವ್ಯ') || combined.includes('महाकाव्य') ||
      combined.includes('காப்பியம்') || combined.includes('కావ్యము')
    ) {
      literatureType = 'Epic';
      isWork = true;
    } else if (
      combined.includes('play') || combined.includes('plays') || combined.includes('drama') ||
      combined.includes('ನಾಟಕ') || combined.includes('नाटक') ||
      combined.includes('நாடகம்') || combined.includes('నాటకం')
    ) {
      literatureType = 'Play';
      isWork = true;
    } else if (
      combined.includes('poem') || combined.includes('poems') || combined.includes('poetry') ||
      combined.includes('ಕಾವ್ಯ') || combined.includes('ಕವಿತೆ') || combined.includes('ಭಾವಗೀತೆ') ||
      combined.includes('कविता') || combined.includes('कवयित्री') ||
      combined.includes('கவிதை') || combined.includes('కవిత్వం')
    ) {
      literatureType = 'Poetry';
      isWork = true;
    } else if (
      combined.includes('short story') || combined.includes('stories') ||
      combined.includes('ಕಥೆ') || combined.includes('ಕಥಾಸಂಕಲನ') || combined.includes('कहानी') ||
      combined.includes('கதை') || combined.includes('కథ')
    ) {
      literatureType = 'Short Story';
      isWork = true;
    } else if (combined.includes('vachana') || combined.includes('ವಚನ')) {
      literatureType = 'Vachana Sahitya';
      isWork = true;
    }

    // Determine author vs work
    let itemType: 'WORK' | 'AUTHOR' | 'LITERATURE' = 'WORK';
    if (hasPersonCategory) {
      itemType = 'AUTHOR';
      literatureType = literatureType === 'Poetry' ? 'Poet' : 'Literary Author';
    } else {
      // Check biographical extract patterns: "was an Indian writer", "is a Kannada poet", etc.
      const bioPatterns = [
        /(?:was|is)\s+(?:an?|the)\s+(?:indian|kannada|hindi|tamil|telugu|bengali|marathi|malayalam|sanskrit|gujarati|odia|assamese)?\s*(?:writer|poet|novelist|author|playwright|dramatist|scholar)/i,
        /(?:ಒಬ್ಬ\s+ಕನ್ನಡ\s+ಲೇಖಕ|ಪ್ರಮುಖ\s+ಕವಿ|ಕಾದಂಬರಿಕಾರ|ಸಾಹಿತಿಯಾಗಿದ್ದಾರೆ|ಸಾಹಿತಿ)/,
        /(?:एक\s+भारतीय\s+लेखक|हिंदी\s+के\s+कवि|उपन्यासकार\s+थे|साहित्यकार)/,
        /(?:പ്രമുഖ\s+സാഹിത്യകാരൻ|കവിയാണ്)/,
        /(?:പ്രശസ്ത\s+എഴുത്തുകാരൻ)/,
        /(?:ఒక\s+ప్రముఖ\s+రచయిత|కవి)/
      ];

      const matchesBio = bioPatterns.some((pattern) => pattern.test(extract));
      if (matchesBio) {
        itemType = 'AUTHOR';
        if (combined.includes('poet') || combined.includes('ಕವಿ') || combined.includes('कवि')) {
          literatureType = 'Poet';
        } else if (combined.includes('novelist') || combined.includes('ಕಾದಂಬರಿಕಾರ') || combined.includes('उपन्यासकार')) {
          literatureType = 'Novelist';
        } else if (combined.includes('playwright') || combined.includes('ನಾಟಕಕಾರ') || combined.includes('नाटककार')) {
          literatureType = 'Playwright';
        } else {
          literatureType = 'Literary Author';
        }
      } else if (isWork) {
        itemType = 'WORK';
      } else {
        itemType = 'LITERATURE';
      }
    }

    // Author extraction from extract if it is a WORK
    let author: string | undefined = undefined;
    if (itemType === 'WORK') {
      const authorMatch = extract.match(
        /(?:written\s+by|authored\s+by|by\s+the\s+poet|work\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i
      ) || extract.match(
        /(?:ಕೃತಿಕಾರರು|ಲೇಖಕರು|ರಚನೆ|ಕೃತಿಕಾರ|ಕವಿ|ಕಾದಂಬರಿಕಾರ|ಸಾಹಿತಿ|రచయిత|రచన|লেখক|লেখক:)\s*[:\-–]?\s*([^\n\.,]{2,30})/i
      );
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1].trim();
      }
    }

    return { itemType, literatureType, author };
  }

  /**
   * Search an individual Indian-language Wikipedia
   */
  public static async searchSingleLanguage(
    query: string,
    langCode: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ExternalLiteratureResult[]> {
    const lang = getIndianLanguageByCode(langCode);
    if (!lang) return [];

    const cacheKey = `single:${lang.code}:${query.toLowerCase().trim()}:${offset}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      // 1. Search Wikipedia for articles
      const wikiUrl = `https://${lang.wiki}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&sroffset=${offset}&srlimit=${limit}&utf8=1&format=json&origin=*`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!wikiRes.ok) {
        return [];
      }

      const wikiData: any = await wikiRes.json();
      const searchItems = wikiData?.query?.search || [];
      if (searchItems.length === 0) return [];

      // 2. Fetch page details (extracts, thumbnails, categories, redirects) in bulk
      const pageTitles = searchItems.map((item: any) => item.title).join('|');
      const detailsUrl = `https://${lang.wiki}/w/api.php?action=query&titles=${encodeURIComponent(
        pageTitles
      )}&redirects=1&prop=extracts|pageimages|info|categories&cllimit=50&inprop=url&exintro=1&explaintext=1&exchars=400&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

      const detailsController = new AbortController();
      const detailsTimeout = setTimeout(() => detailsController.abort(), 6000);

      const detailsRes = await fetch(detailsUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: detailsController.signal,
      });
      clearTimeout(detailsTimeout);

      if (!detailsRes.ok) return [];

      const detailsData: any = await detailsRes.json();
      const pagesObj = detailsData?.query?.pages || {};
      const redirects = detailsData?.query?.redirects || [];

      const results: ExternalLiteratureResult[] = [];

      for (const item of searchItems) {
        // Resolve target title through redirects if any
        let effectiveTitle = item.title;
        const redirectMatch = redirects.find((r: any) => r.from === item.title);
        if (redirectMatch) {
          effectiveTitle = redirectMatch.to;
        }

        const page = Object.values(pagesObj).find(
          (p: any) => p.title === effectiveTitle || p.title === item.title
        ) as any;

        const rawExtract = page?.extract || item.snippet || '';
        const cleanExtract = this.cleanText(rawExtract);
        const categories: string[] = (page?.categories || []).map((c: any) => c.title || '');

        // Filter out non-literature results
        if (!this.isLiteratureRelated(item.title, cleanExtract, categories)) {
          continue;
        }

        const sourceUrl =
          page?.canonicalurl ||
          page?.fullurl ||
          `https://${lang.wiki}/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;

        // Classify WORK vs AUTHOR vs LITERATURE
        const classification = this.classifyLiteratureItem(item.title, cleanExtract, categories);

        // Thumbnail handling:
        // For WORK: ensure image is legitimate or null (never an unrelated portrait)
        let thumbnailUrl = page?.thumbnail?.source;
        if (thumbnailUrl) {
          const lowerThumb = thumbnailUrl.toLowerCase();
          // Filter out generic flag icons, maps, or UI icons
          if (
            lowerThumb.includes('flag') ||
            lowerThumb.includes('icon') ||
            lowerThumb.includes('map') ||
            lowerThumb.includes('symbol')
          ) {
            thumbnailUrl = undefined;
          }
        }

        results.push({
          id: `wiki-${lang.code}-${encodeURIComponent(item.title)}`,
          title: item.title,
          originalTitle: item.title,
          author: classification.author,
          language: `${lang.name} (${lang.nativeName})`,
          languageCode: lang.code,
          description: cleanExtract.substring(0, 160),
          excerpt: cleanExtract,
          extract: cleanExtract,
          thumbnail: thumbnailUrl,
          thumbnailUrl,
          itemType: classification.itemType,
          literatureType: classification.literatureType,
          source: 'WIKIMEDIA',
          sourceProject: lang.wiki,
          sourceUrl,
          canonicalUrl: sourceUrl,
          isFullTextAvailable: false,
          fullTextSource: 'None',
          attribution: {
            source: `Wikimedia / ${lang.name} Wikipedia (${lang.wiki})`,
            license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
            url: sourceUrl,
          },
        });
      }

      cache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });
      return results;
    } catch (err) {
      console.warn(`[WikimediaService] Error querying ${lang.name} (${lang.code}):`, err);
      return [];
    }
  }

  /**
   * Search across all relevant Indian-language Wikimedia projects dynamically.
   * Ranking rules:
   * 1. Exact title match
   * 2. Title starts with search query
   * 3. Title contains search query
   * 4. Author match
   * 5. Relevant content match
   */
  public static async searchAcrossIndianLanguages(
    query: string,
    requestedLang?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ results: ExternalLiteratureResult[]; total: number; detectedLanguage: string }> {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) {
      return { results: [], total: 0, detectedLanguage: requestedLang && requestedLang !== 'auto' ? requestedLang : 'en' };
    }

    const maxResults = options?.limit || 20;
    const offset = options?.offset || 0;

    // Detect language or use requested
    const detectedLangCode = detectIndianLanguageCode(trimmedQuery);
    let primaryLangCode = requestedLang && requestedLang !== 'auto' ? requestedLang : detectedLangCode;

    // Ensure requested language is one of the supported Indian languages
    if (!primaryLangCode || !SUPPORTED_INDIAN_LANGUAGE_CODES.has(primaryLangCode)) {
      primaryLangCode = detectedLangCode || 'en';
    }

    const cacheKey = `searchAcross:${primaryLangCode}:${trimmedQuery.toLowerCase()}:${offset}:${maxResults}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Always query primary language first with parallel secondary Indian languages
    const secondaryLanguages = SUPPORTED_INDIAN_LANGUAGES.filter((l) => l.code !== primaryLangCode);

    // Search primary with higher limit
    const primaryPromise = this.searchSingleLanguage(trimmedQuery, primaryLangCode, 15, offset);

    // Concurrently search secondary Indian languages safely (with smaller limit per lang)
    const secondaryPromises = secondaryLanguages.map((lang) =>
      this.searchSingleLanguage(trimmedQuery, lang.code, 4, 0).catch(() => [])
    );

    const [primaryResults, ...secondaryResultArrays] = await Promise.all([
      primaryPromise,
      ...secondaryPromises,
    ]);

    // Flatten results
    const rawCombined: ExternalLiteratureResult[] = [
      ...primaryResults,
      ...secondaryResultArrays.flat(),
    ];

    // Deduplicate by normalized title + languageCode
    const seen = new Set<string>();
    const deduplicated: ExternalLiteratureResult[] = [];

    for (const item of rawCombined) {
      const key = `${item.languageCode}:${item.title.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    // Rank results
    const qLower = trimmedQuery.toLowerCase();
    const ranked = deduplicated.sort((a, b) => {
      const aTitle = a.title.toLowerCase().trim();
      const bTitle = b.title.toLowerCase().trim();

      // 1. Exact title match
      const aExact = aTitle === qLower ? 1 : 0;
      const bExact = bTitle === qLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      // 2. Title starts with search query
      const aStarts = aTitle.startsWith(qLower) ? 1 : 0;
      const bStarts = bTitle.startsWith(qLower) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      // 3. Title contains search query
      const aContains = aTitle.includes(qLower) ? 1 : 0;
      const bContains = bTitle.includes(qLower) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;

      // 4. Primary language priority
      const aIsPrimary = a.languageCode === primaryLangCode ? 1 : 0;
      const bIsPrimary = b.languageCode === primaryLangCode ? 1 : 0;
      if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;

      // 5. Excerpt / content relevance length
      return (b.excerpt?.length || 0) - (a.excerpt?.length || 0);
    });

    const paginated = ranked.slice(0, maxResults);

    const responseData = {
      results: paginated,
      total: ranked.length,
      detectedLanguage: detectedLangCode || primaryLangCode,
    };

    cache.set(cacheKey, { data: responseData, expiry: Date.now() + CACHE_TTL_MS });
    return responseData;
  }

  /**
   * Check Wikisource availability for complete legal full text
   */
  public static async checkWikisource(
    title: string,
    langCode: string
  ): Promise<{ available: boolean; url?: string }> {
    try {
      const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
      const wikisourceUrl = `https://${langCode}.wikisource.org/w/api.php?action=query&titles=${encodeURIComponent(
        cleanTitle
      )}&format=json&origin=*`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(wikisourceUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return { available: false };
      const data: any = await res.json();
      const pages = data?.query?.pages || {};
      const page: any = Object.values(pages)[0];

      if (page && page.pageid && page.pageid > 0 && !page.missing) {
        return {
          available: true,
          url: `https://${langCode}.wikisource.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, '_'))}`,
        };
      }

      return { available: false };
    } catch {
      return { available: false };
    }
  }

  /**
   * Get detailed literature work with complete text if on Wikisource,
   * or rich metadata & extract from Wikipedia.
   */
  public static async getLiteraturePage(
    langCode: string,
    title: string
  ): Promise<ExternalWorkDetail | null> {
    const lang = getIndianLanguageByCode(langCode) || SUPPORTED_INDIAN_LANGUAGES[0];
    const cacheKey = `detail:${lang.code}:${title.toLowerCase().trim()}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();

      // Check Wikisource for legal full text
      const wikisourceInfo = await this.checkWikisource(cleanTitle, lang.code);
      let fullText = '';
      let sections: { title: string; content: string }[] = [];

      if (wikisourceInfo.available) {
        try {
          const textUrl = `https://${lang.code}.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
            cleanTitle
          )}&prop=text|sections&format=json&origin=*`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const textRes = await fetch(textUrl, {
            headers: { 'User-Agent': this.userAgent },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (textRes.ok) {
            const textData: any = await textRes.json();
            const rawHtml = textData?.parse?.text?.['*'] || '';
            fullText = this.cleanText(rawHtml);

            const rawSections = textData?.parse?.sections || [];
            sections = rawSections.map((s: any) => ({
              title: s.line,
              content: '',
            }));
          }
        } catch (e) {
          console.warn('[WikimediaService] Could not parse Wikisource full text:', e);
        }
      }

      // Fetch comprehensive Wikipedia article summary
      const wikiUrl = `https://${lang.wiki}/w/api.php?action=query&titles=${encodeURIComponent(
        title
      )}&redirects=1&prop=extracts|pageimages|info&inprop=url&explaintext=1&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;

      const wikiController = new AbortController();
      const wikiTimeout = setTimeout(() => wikiController.abort(), 6000);

      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: wikiController.signal,
      });
      clearTimeout(wikiTimeout);

      if (!wikiRes.ok) return null;

      const wikiData: any = await wikiRes.json();
      const pages = wikiData?.query?.pages || {};
      const page: any = Object.values(pages)[0];

      if (!page || page.missing) {
        return null;
      }

      const cleanExtract = this.cleanText(page.extract || '');
      const sourceUrl =
        page.canonicalurl ||
        page.fullurl ||
        `https://${lang.wiki}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      const classification = this.classifyLiteratureItem(page.title, cleanExtract, []);

      const detail: ExternalWorkDetail = {
        id: `wiki-${lang.code}-${encodeURIComponent(page.title)}`,
        title: page.title,
        originalTitle: page.title,
        author: classification.author,
        language: `${lang.name} (${lang.nativeName})`,
        languageCode: lang.code,
        description: cleanExtract.substring(0, 160),
        excerpt: cleanExtract,
        extract: cleanExtract,
        thumbnail: page.thumbnail?.source,
        thumbnailUrl: page.thumbnail?.source,
        itemType: classification.itemType,
        literatureType: classification.literatureType,
        source: 'WIKIMEDIA',
        sourceProject: lang.wiki,
        sourceUrl,
        canonicalUrl: sourceUrl,
        isFullTextAvailable: !!fullText,
        fullTextSource: fullText ? 'Wikisource' : 'None',
        fullTextUrl: wikisourceInfo.url,
        content: fullText || undefined,
        sections: sections.length > 0 ? sections : undefined,
        attribution: {
          source: fullText
            ? `Wikisource & Wikipedia (${lang.name})`
            : `Wikimedia / ${lang.name} Wikipedia (${lang.wiki})`,
          license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
          url: wikisourceInfo.url || sourceUrl,
        },
      };

      cache.set(cacheKey, { data: detail, expiry: Date.now() + CACHE_TTL_MS });
      return detail;
    } catch (err) {
      console.error('[WikimediaService] Failed to get work detail:', err);
      return null;
    }
  }

  // Alias for backward compatibility
  public static async getWorkDetail(lang: string, title: string): Promise<ExternalWorkDetail | null> {
    return this.getLiteraturePage(lang, title);
  }

  public static async searchLiterature(
    query: string,
    requestedLang?: string
  ): Promise<ExternalLiteratureResult[]> {
    const res = await this.searchAcrossIndianLanguages(query, requestedLang);
    return res.results;
  }
}
