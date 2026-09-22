/**
 * wikimediaDirectService.ts
 * Client-side fallback for Wikimedia & Wikisource official REST / Action APIs.
 * Automatically engages if the backend serverless /api/external endpoint is unreachable
 * or deploying, ensuring World Literature search NEVER shows an empty or error state.
 */

export interface ClientExternalSearchResult {
  id: string;
  title: string;
  snippet: string;
  extract: string;
  language: string;
  languageCode: string;
  thumbnailUrl?: string;
  sourceUrl: string;
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
  public static detectLanguageCode(text: string): string {
    if (!text) return 'en';
    const trimmed = text.trim();
    if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn'; // Kannada
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi'; // Hindi / Sanskrit / Marathi
    if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te'; // Telugu
    if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml'; // Malayalam
    if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu'; // Gujarati
    if (/[\u0A00-\u0A7F]/.test(trimmed)) return 'pa'; // Punjabi
    if (/[\u0600-\u06FF]/.test(trimmed)) return 'ur'; // Urdu / Arabic
    if (/[\u0400-\u04FF]/.test(trimmed)) return 'ru'; // Russian
    if (/[\u4E00-\u9FFF]/.test(trimmed)) return 'zh'; // Chinese
    if (/[\u3040-\u30FF]/.test(trimmed)) return 'ja'; // Japanese
    return 'en';
  }

  public static getLanguageName(code: string): string {
    const names: Record<string, string> = {
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
    return names[code] || code.toUpperCase();
  }

  public static async search(query: string, requestedLang?: string): Promise<ClientExternalSearchResult[]> {
    const lang = requestedLang && requestedLang !== 'auto' ? requestedLang : this.detectLanguageCode(query);
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&utf8=1&format=json&srlimit=10&origin=*`;

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error('Wikimedia API search query error');
    const data = await res.json();
    const items = data?.query?.search || [];
    if (items.length === 0) return [];

    const pageTitles = items.map((i: any) => i.title).join('|');
    const detailsUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      pageTitles
    )}&prop=extracts|pageimages|info&inprop=url&exintro=1&explaintext=1&exchars=350&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    const pagesObj = detailsData?.query?.pages || {};

    const results: ClientExternalSearchResult[] = [];
    for (const item of items) {
      const page = Object.values(pagesObj).find((p: any) => p.title === item.title) as any;
      const cleanSnippet = item.snippet ? item.snippet.replace(/<\/?[^>]+(>|$)/g, '') : '';
      const extract = page?.extract || cleanSnippet;
      const cleanTitle = item.title.replace(/\s*\([^)]*\)/g, '').trim();

      // Check Wikisource availability directly
      let hasWikisource = false;
      let wikisourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(cleanTitle)}`;
      try {
        const wsRes = await fetch(
          `https://${lang}.wikisource.org/w/api.php?action=query&titles=${encodeURIComponent(
            cleanTitle
          )}&format=json&origin=*`
        );
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          const wsPages = wsData?.query?.pages || {};
          const wsPage: any = Object.values(wsPages)[0];
          if (wsPage && wsPage.pageid > 0 && !wsPage.missing) {
            hasWikisource = true;
          }
        }
      } catch {
        hasWikisource = false;
      }

      results.push({
        id: `wiki-${lang}-${encodeURIComponent(item.title)}`,
        title: item.title,
        snippet: cleanSnippet,
        extract: extract ? extract.trim() : cleanSnippet,
        language: this.getLanguageName(lang),
        languageCode: lang,
        thumbnailUrl: page?.thumbnail?.source,
        sourceUrl: page?.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        isFullTextAvailable: hasWikisource,
        fullTextSource: hasWikisource ? 'Wikisource' : 'None',
        fullTextUrl: hasWikisource ? wikisourceUrl : undefined,
        attribution: {
          source: hasWikisource ? 'Wikisource & Wikipedia' : 'Wikipedia (The Free Encyclopedia)',
          license: 'Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)',
          url: hasWikisource ? wikisourceUrl : `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        },
      });
    }

    return results;
  }

  public static async getWorkDetail(lang: string, title: string): Promise<ClientExternalWorkDetail | null> {
    const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
    let fullText = '';
    let sections: { title: string; content: string }[] = [];
    let isWikisourceAvailable = false;
    const wikisourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(cleanTitle)}`;

    try {
      const textUrl = `https://${lang}.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
        cleanTitle
      )}&prop=text|sections&format=json&origin=*`;
      const wsRes = await fetch(textUrl);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        const rawHtml = wsData?.parse?.text?.['*'] || '';
        if (rawHtml) {
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
          isWikisourceAvailable = true;
          const rawSections = wsData?.parse?.sections || [];
          sections = rawSections.map((s: any) => ({ title: s.line, content: '' }));
        }
      }
    } catch {
      // Wikisource not available for this work
    }

    const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&prop=extracts|pageimages|info&inprop=url&explaintext=1&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl);
    if (!wikiRes.ok) return null;
    const wikiData = await wikiRes.json();
    const pages = wikiData?.query?.pages || {};
    const page: any = Object.values(pages)[0];
    if (!page || page.missing) return null;

    return {
      id: `wiki-${lang}-${encodeURIComponent(title)}`,
      title: page.title,
      snippet: page.extract ? page.extract.substring(0, 250) + '...' : '',
      extract: page.extract || 'No extract available.',
      language: this.getLanguageName(lang),
      languageCode: lang,
      thumbnailUrl: page.thumbnail?.source,
      sourceUrl: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      isFullTextAvailable: isWikisourceAvailable && !!fullText,
      fullTextSource: isWikisourceAvailable && fullText ? 'Wikisource' : 'None',
      fullTextUrl: isWikisourceAvailable ? wikisourceUrl : undefined,
      content: fullText || undefined,
      sections: sections.length > 0 ? sections : undefined,
      attribution: {
        source: fullText ? 'Wikisource & Wikipedia' : 'Wikipedia (The Free Encyclopedia)',
        license: 'Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)',
        url: isWikisourceAvailable ? wikisourceUrl : page.fullurl,
      },
    };
  }
}
