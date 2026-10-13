/**
 * wikimediaDirectService.ts
 * Client-side direct access & fallback for Indian-language Wikimedia & Wikisource official REST / Action APIs.
 * Restricted strictly to SUPPORTED_INDIAN_LANGUAGES.
 */

import {
  SUPPORTED_INDIAN_LANGUAGES,
  SUPPORTED_INDIAN_LANGUAGE_CODES,
  getIndianLanguageByCode,
  detectIndianLanguageCode,
  type IndianLanguageConfig,
} from '../config/indianLanguages';

export interface ClientExternalSearchResult {
  id: string;
  title: string;
  originalTitle?: string;
  author?: string;
  snippet?: string;
  excerpt: string;
  extract: string;
  description?: string;
  language: string;
  languageCode: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  itemType: 'WORK' | 'AUTHOR' | 'LITERATURE';
  literatureType?: string;
  source: 'WIKIMEDIA';
  sourceProject?: string;
  sourceUrl: string;
  canonicalUrl?: string;
  isFullTextAvailable: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
  attribution: {
    source: string;
    license: string;
    url: string;
  };
}

export interface ClientExternalWorkDetail extends ClientExternalSearchResult {
  content?: string;
  sections?: { title: string; content: string }[];
}

export class WikimediaDirectService {
  public static getSupportedLanguages(): IndianLanguageConfig[] {
    return SUPPORTED_INDIAN_LANGUAGES;
  }

  public static detectLanguageCode(text: string): string | null {
    return detectIndianLanguageCode(text);
  }

  public static getLanguageName(code: string): string {
    const lang = getIndianLanguageByCode(code);
    return lang ? `${lang.name} (${lang.nativeName})` : code.toUpperCase();
  }

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

  private static isLiteratureRelated(title: string, extract: string): boolean {
    const combined = `${title} ${extract}`.toLowerCase();
    const literatureKeywords = [
      'novel', 'novelist', 'poetry', 'poem', 'poet', 'short story', 'play', 'drama',
      'epic', 'folklore', 'literature', 'literary', 'author', 'writer', 'book', 'kavya', 'sahitya',
      'purana', 'vachana', 'kriti', 'upanyas', 'kavita', 'natak', 'geethe', 'kadambari',
      'ಕಾದಂಬರಿ', 'ಕವಿ', 'ಕಾವ್ಯ', 'ನಾಟಕ', 'ಸಾಹಿತ್ಯ', 'ಕೃತಿ', 'ಪುಸ್ತಕ', 'ಲೇಖಕ', 'ಕಥೆ', 'ವಚನ',
      'उपन्यास', 'कवि', 'कविता', 'साहित्य', 'नाटक', 'कहानी', 'रचना', 'लेखक', 'ग्रंथ',
      'நாவல்', 'கவிஞர்', 'கவிதை', 'இலக்கியம்', 'நாடகம்', 'கதை', 'காப்பியம்',
      'నవల', 'కవి', 'కవిత్వం', 'సాహిత్యం', 'నాటకం', 'కథ', 'కావ్యము',
      'നോവൽ', 'കവി', 'കവിത', 'സാഹിത്യം', 'നാടകം',
      'উপন্যাস', 'কবি', 'কবিতা', 'সাহিত্য', 'নাটক', 'গল্প',
      'ନାଟକ', 'କବିତା', 'ଉପନ୍ୟାସ', 'କବି', 'ଲେଖକ'
    ];

    for (const kw of literatureKeywords) {
      if (combined.includes(kw)) return true;
    }

    const negativeKeywords = [
      'airport', 'railway station', 'highway', 'constituency', 'cricketer', 'footballer'
    ];
    for (const neg of negativeKeywords) {
      if (combined.includes(neg)) return false;
    }
    return true;
  }

  public static classifyLiteratureItem(
    title: string,
    extract: string
  ): {
    itemType: 'WORK' | 'AUTHOR' | 'LITERATURE';
    literatureType: string;
    author?: string;
  } {
    const combined = `${title} ${extract}`.toLowerCase();
    let literatureType = 'Literary Work';
    let isWork = false;

    if (combined.includes('novel') || combined.includes('ಕಾದಂಬರಿ') || combined.includes('उपन्यास')) {
      literatureType = 'Novel';
      isWork = true;
    } else if (combined.includes('epic') || combined.includes('ಮಹಾಕಾವ್ಯ') || combined.includes('महाकाव्य')) {
      literatureType = 'Epic';
      isWork = true;
    } else if (combined.includes('play') || combined.includes('ನಾಟಕ') || combined.includes('नाटक')) {
      literatureType = 'Play';
      isWork = true;
    } else if (combined.includes('poem') || combined.includes('poetry') || combined.includes('ಕಾವ್ಯ') || combined.includes('कविता')) {
      literatureType = 'Poetry';
      isWork = true;
    } else if (combined.includes('short story') || combined.includes('ಕಥೆ') || combined.includes('कहानी')) {
      literatureType = 'Short Story';
      isWork = true;
    } else if (combined.includes('vachana') || combined.includes('ವಚನ')) {
      literatureType = 'Vachana Sahitya';
      isWork = true;
    }

    const bioPatterns = [
      /(?:was|is)\s+(?:an?|the)\s+(?:indian|kannada|hindi|tamil|telugu|bengali|marathi|malayalam|sanskrit|gujarati|odia|assamese)?\s*(?:writer|poet|novelist|author|playwright|dramatist|scholar)/i,
      /(?:ಒಬ್ಬ\s+ಕನ್ನಡ\s+ಲೇಖಕ|ಪ್ರಮುಖ\s+ಕವಿ|ಕಾದಂಬರಿಕಾರ|ಸಾಹಿತಿಯಾಗಿದ್ದಾರೆ|ಸಾಹಿತಿ)/,
      /(?:एक\s+भारतीय\s+लेखक|हिंदी\s+के\s+कवि|उपन्यासकार\s+थे|साहित्यकार)/,
      /(?:ഒരു\s+മലയാളം\s+എഴുത്തുകാരൻ|കവിയാണ്)/,
      /(?:ఒక\s+ప్రముఖ\s+రచయిత|కవి)/
    ];

    const matchesBio = bioPatterns.some((pattern) => pattern.test(extract));
    let itemType: 'WORK' | 'AUTHOR' | 'LITERATURE' = 'WORK';
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

  public static async searchSingle(
    query: string,
    langCode: string,
    limit: number = 10
  ): Promise<ClientExternalSearchResult[]> {
    const lang = getIndianLanguageByCode(langCode);
    if (!lang) return [];

    try {
      const searchUrl = `https://${lang.wiki}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=1&format=json&srlimit=${limit}&origin=*`;

      const res = await fetch(searchUrl);
      if (!res.ok) return [];
      const data = await res.json();
      const items = data?.query?.search || [];
      if (items.length === 0) return [];

      const pageTitles = items.map((i: any) => i.title).join('|');
      const detailsUrl = `https://${lang.wiki}/w/api.php?action=query&titles=${encodeURIComponent(
        pageTitles
      )}&redirects=1&prop=extracts|pageimages|info&inprop=url&exintro=1&explaintext=1&exchars=350&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

      const detailsRes = await fetch(detailsUrl);
      if (!detailsRes.ok) return [];
      const detailsData = await detailsRes.json();
      const pagesObj = detailsData?.query?.pages || {};
      const redirects = detailsData?.query?.redirects || [];

      const results: ClientExternalSearchResult[] = [];
      for (const item of items) {
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

        if (!this.isLiteratureRelated(item.title, cleanExtract)) {
          continue;
        }

        const sourceUrl =
          page?.canonicalurl ||
          page?.fullurl ||
          `https://${lang.wiki}/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;

        const classification = this.classifyLiteratureItem(item.title, cleanExtract);

        let thumbnailUrl = page?.thumbnail?.source;
        if (thumbnailUrl) {
          const lowerThumb = thumbnailUrl.toLowerCase();
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
          snippet: cleanExtract.substring(0, 160),
          excerpt: cleanExtract,
          extract: cleanExtract,
          description: cleanExtract.substring(0, 160),
          language: `${lang.name} (${lang.nativeName})`,
          languageCode: lang.code,
          thumbnailUrl,
          thumbnail: thumbnailUrl,
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

      return results;
    } catch (e) {
      console.warn(`[WikimediaDirectService] Search error for ${lang.name}:`, e);
      return [];
    }
  }

  public static async search(
    query: string,
    requestedLang?: string
  ): Promise<ClientExternalSearchResult[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const detectedLangCode = detectIndianLanguageCode(trimmed);
    let primaryLangCode = requestedLang && requestedLang !== 'auto' ? requestedLang : detectedLangCode;
    if (!primaryLangCode || !SUPPORTED_INDIAN_LANGUAGE_CODES.has(primaryLangCode)) {
      primaryLangCode = detectedLangCode || 'en';
    }

    const secondaryLangs = SUPPORTED_INDIAN_LANGUAGES.filter((l) => l.code !== primaryLangCode);

    const primaryPromise = this.searchSingle(trimmed, primaryLangCode, 15);
    const secondaryPromises = secondaryLangs.map((l) => this.searchSingle(trimmed, l.code, 4));

    const [primaryResults, ...secondaryArrays] = await Promise.all([
      primaryPromise,
      ...secondaryPromises,
    ]);

    const combined = [...primaryResults, ...secondaryArrays.flat()];

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated: ClientExternalSearchResult[] = [];
    for (const r of combined) {
      const key = `${r.languageCode}:${r.title.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(r);
      }
    }

    // Rank: exact match first, starts with, contains
    const qLower = trimmed.toLowerCase();
    return deduplicated.sort((a, b) => {
      const aTitle = a.title.toLowerCase().trim();
      const bTitle = b.title.toLowerCase().trim();

      const aExact = aTitle === qLower ? 1 : 0;
      const bExact = bTitle === qLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = aTitle.startsWith(qLower) ? 1 : 0;
      const bStarts = bTitle.startsWith(qLower) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      const aContains = aTitle.includes(qLower) ? 1 : 0;
      const bContains = bTitle.includes(qLower) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;

      const aIsPrimary = a.languageCode === primaryLangCode ? 1 : 0;
      const bIsPrimary = b.languageCode === primaryLangCode ? 1 : 0;
      if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;

      return (b.excerpt?.length || 0) - (a.excerpt?.length || 0);
    });
  }

  public static async getWorkDetail(langCode: string, title: string): Promise<ClientExternalWorkDetail | null> {
    const lang = getIndianLanguageByCode(langCode) || SUPPORTED_INDIAN_LANGUAGES[0];
    const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
    let fullText = '';
    let sections: { title: string; content: string }[] = [];
    let isWikisourceAvailable = false;
    const wikisourceUrl = `https://${lang.code}.wikisource.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, '_'))}`;

    try {
      const textUrl = `https://${lang.code}.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
        cleanTitle
      )}&prop=text|sections&format=json&origin=*`;
      const wsRes = await fetch(textUrl);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        const rawHtml = wsData?.parse?.text?.['*'] || '';
        if (rawHtml) {
          fullText = this.cleanText(rawHtml);
          isWikisourceAvailable = true;
          const rawSections = wsData?.parse?.sections || [];
          sections = rawSections.map((s: any) => ({ title: s.line, content: '' }));
        }
      }
    } catch {
      // Wikisource not available
    }

    const wikiUrl = `https://${lang.wiki}/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&redirects=1&prop=extracts|pageimages|info&inprop=url&explaintext=1&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl);
    if (!wikiRes.ok) return null;
    const wikiData = await wikiRes.json();
    const pages = wikiData?.query?.pages || {};
    const page: any = Object.values(pages)[0];
    if (!page || page.missing) return null;

    const cleanExtract = this.cleanText(page.extract || '');
    const sourceUrl =
      page.canonicalurl ||
      page.fullurl ||
      `https://${lang.wiki}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    const classification = this.classifyLiteratureItem(page.title, cleanExtract);

    return {
      id: `wiki-${lang.code}-${encodeURIComponent(title)}`,
      title: page.title,
      originalTitle: page.title,
      author: classification.author,
      snippet: cleanExtract.substring(0, 160),
      excerpt: cleanExtract,
      extract: cleanExtract,
      language: `${lang.name} (${lang.nativeName})`,
      languageCode: lang.code,
      thumbnailUrl: page.thumbnail?.source,
      thumbnail: page.thumbnail?.source,
      itemType: classification.itemType,
      literatureType: classification.literatureType,
      source: 'WIKIMEDIA',
      sourceProject: lang.wiki,
      sourceUrl,
      canonicalUrl: sourceUrl,
      isFullTextAvailable: isWikisourceAvailable && !!fullText,
      fullTextSource: isWikisourceAvailable && fullText ? 'Wikisource' : 'None',
      fullTextUrl: isWikisourceAvailable ? wikisourceUrl : undefined,
      content: fullText || undefined,
      sections: sections.length > 0 ? sections : undefined,
      attribution: {
        source: fullText
          ? `Wikisource & Wikipedia (${lang.name})`
          : `Wikimedia / ${lang.name} Wikipedia (${lang.wiki})`,
        license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
        url: isWikisourceAvailable ? wikisourceUrl : sourceUrl,
      },
    };
  }
}
