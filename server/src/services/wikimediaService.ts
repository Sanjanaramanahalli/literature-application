/**
 * WikimediaService.ts
 * Integrates official Wikipedia and Wikisource REST/Action APIs for multilingual literature discovery.
 * Ensures legal full-text access for public domain works and rich encyclopedic metadata for reference works.
 */

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
  extract: string;
  thumbnailUrl?: string;
  sourceUrl: string;
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
  private static userAgent = 'AthenaeumLiteratureApplication/1.0 (scholar@literature.org)';

  /**
   * Automatically detect language from Unicode script ranges if not explicitly provided
   */
  public static detectLanguageCode(text: string): string {
    if (!text) return 'en';
    const trimmed = text.trim();

    // Kannada script: \u0C80-\u0CFF
    if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn';
    // Devanagari (Hindi, Sanskrit, Marathi): \u0900-\u097F
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi';
    // Tamil script: \u0B80-\u0BFF
    if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta';
    // Telugu script: \u0C00-\u0C7F
    if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te';
    // Malayalam script: \u0D00-\u0D7F
    if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml';
    // Bengali script: \u0980-\u09FF
    if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn';
    // Gujarati script: \u0A80-\u0AFF
    if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu';
    // Gurmukhi / Punjabi: \u0A00-\u0A7F
    if (/[\u0A00-\u0A7F]/.test(trimmed)) return 'pa';
    // Arabic / Urdu: \u0600-\u06FF
    if (/[\u0600-\u06FF]/.test(trimmed)) return 'ur';
    // Cyrillic (Russian): \u0400-\u04FF
    if (/[\u0400-\u04FF]/.test(trimmed)) return 'ru';
    // Chinese: \u4E00-\u9FFF
    if (/[\u4E00-\u9FFF]/.test(trimmed)) return 'zh';
    // Japanese: \u3040-\u30FF
    if (/[\u3040-\u30FF]/.test(trimmed)) return 'ja';

    return 'en';
  }

  public static getLanguageName(code: string): string {
    const langNames: Record<string, string> = {
      en: 'English',
      kn: 'Kannada (ಕನ್ನಡ)',
      hi: 'Hindi (हिन्दी)',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      ml: 'Malayalam (മലയാളം)',
      bn: 'Bengali (বাংলা)',
      gu: 'Gujarati (ગુજરાતી)',
      pa: 'Punjabi (ਪੰਜਾਬੀ)',
      ur: 'Urdu (اردو)',
      sa: 'Sanskrit (संस्कृतम्)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      es: 'Spanish (Español)',
      it: 'Italian (Italiano)',
      ru: 'Russian (Русский)',
      zh: 'Chinese (中文)',
      ja: 'Japanese (日本語)',
      ar: 'Arabic (العربية)',
    };
    return langNames[code] || code.toUpperCase();
  }

  /**
   * Search Wikipedia and simultaneously check Wikisource availability for complete text
   */
  public static async searchLiterature(
    query: string,
    requestedLang?: string
  ): Promise<ExternalLiteratureResult[]> {
    const lang = requestedLang && requestedLang !== 'auto' ? requestedLang : this.detectLanguageCode(query);
    const cacheKey = `search:${lang}:${query.toLowerCase().trim()}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      // 1. Search Wikipedia for articles
      const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=1&format=json&srlimit=10&origin=*`;

      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!wikiRes.ok) {
        throw new Error(`Wikipedia API error: ${wikiRes.statusText}`);
      }

      const wikiData: any = await wikiRes.json();
      const searchItems = wikiData?.query?.search || [];

      if (searchItems.length === 0) {
        return [];
      }

      // 2. Fetch page details (extracts, page images) in bulk
      const pageTitles = searchItems.map((item: any) => item.title).join('|');
      const detailsUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        pageTitles
      )}&prop=extracts|pageimages|info&inprop=url&exintro=1&explaintext=1&exchars=350&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

      const detailsRes = await fetch(detailsUrl, {
        headers: { 'User-Agent': this.userAgent },
      });
      const detailsData: any = await detailsRes.json();
      const pagesObj = detailsData?.query?.pages || {};

      // 3. Simultaneously lookup Wikisource for public-domain matches
      const results: ExternalLiteratureResult[] = [];

      for (const item of searchItems) {
        const page = Object.values(pagesObj).find((p: any) => p.title === item.title) as any;
        const extract = page?.extract || item.snippet.replace(/<\/?[^>]+(>|$)/g, '');
        const thumbnailUrl = page?.thumbnail?.source;
        const sourceUrl = page?.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title)}`;

        // Check Wikisource availability
        const wikisourceInfo = await this.checkWikisource(item.title, lang);

        results.push({
          id: `wiki-${lang}-${encodeURIComponent(item.title)}`,
          title: item.title,
          language: this.getLanguageName(lang),
          languageCode: lang,
          extract: extract.trim(),
          thumbnailUrl,
          sourceUrl,
          isFullTextAvailable: wikisourceInfo.available,
          fullTextSource: wikisourceInfo.available ? 'Wikisource' : 'None',
          fullTextUrl: wikisourceInfo.url,
          attribution: {
            source: wikisourceInfo.available ? 'Wikisource & Wikipedia' : 'Wikipedia (The Free Encyclopedia)',
            license: 'Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)',
            url: wikisourceInfo.url || sourceUrl,
          },
        });
      }

      cache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });
      return results;
    } catch (err) {
      console.error('[WikimediaService] Search failure:', err);
      return [];
    }
  }

  /**
   * Check if a work is available in full text on Wikisource
   */
  public static async checkWikisource(
    title: string,
    lang: string
  ): Promise<{ available: boolean; url?: string }> {
    try {
      const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
      const wikisourceUrl = `https://${lang}.wikisource.org/w/api.php?action=query&titles=${encodeURIComponent(
        cleanTitle
      )}&format=json&origin=*`;

      const res = await fetch(wikisourceUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) return { available: false };
      const data: any = await res.json();
      const pages = data?.query?.pages || {};
      const page: any = Object.values(pages)[0];

      if (page && page.pageid && page.pageid > 0 && !page.missing) {
        return {
          available: true,
          url: `https://${lang}.wikisource.org/wiki/${encodeURIComponent(cleanTitle)}`,
        };
      }

      return { available: false };
    } catch {
      return { available: false };
    }
  }

  /**
   * Retrieve complete work details and legal full text from Wikisource if available,
   * or encyclopedic summary and metadata from Wikipedia.
   */
  public static async getWorkDetail(lang: string, title: string): Promise<ExternalWorkDetail | null> {
    const cacheKey = `work:${lang}:${title.toLowerCase().trim()}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();

      // Check Wikisource for legal full text
      const wikisourceInfo = await this.checkWikisource(cleanTitle, lang);
      let fullText = '';
      let sections: { title: string; content: string }[] = [];

      if (wikisourceInfo.available) {
        try {
          const textUrl = `https://${lang}.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
            cleanTitle
          )}&prop=text|sections&format=json&origin=*`;

          const textRes = await fetch(textUrl, {
            headers: { 'User-Agent': this.userAgent },
          });

          if (textRes.ok) {
            const textData: any = await textRes.json();
            const rawHtml = textData?.parse?.text?.['*'] || '';
            // Clean HTML tags for reading view while preserving paragraph line breaks
            fullText = rawHtml
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .trim();

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

      // Fetch comprehensive Wikipedia article summary and metadata
      const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        title
      )}&prop=extracts|pageimages|info&inprop=url&explaintext=1&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;

      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      const wikiData: any = await wikiRes.json();
      const pages = wikiData?.query?.pages || {};
      const page: any = Object.values(pages)[0];

      if (!page || page.missing) {
        return null;
      }

      const detail: ExternalWorkDetail = {
        id: `wiki-${lang}-${encodeURIComponent(title)}`,
        title: page.title,
        language: this.getLanguageName(lang),
        languageCode: lang,
        extract: page.extract || 'No extract available.',
        thumbnailUrl: page.thumbnail?.source,
        sourceUrl: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        isFullTextAvailable: !!fullText,
        fullTextSource: fullText ? 'Wikisource' : 'None',
        fullTextUrl: wikisourceInfo.url,
        content: fullText || undefined,
        sections: sections.length > 0 ? sections : undefined,
        attribution: {
          source: fullText ? 'Wikisource & Wikipedia' : 'Wikipedia (The Free Encyclopedia)',
          license: 'Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)',
          url: wikisourceInfo.url || page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        },
      };

      cache.set(cacheKey, { data: detail, expiry: Date.now() + CACHE_TTL_MS });
      return detail;
    } catch (err) {
      console.error('[WikimediaService] Failed to get work detail:', err);
      return null;
    }
  }
}
