import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { WikimediaService } from '../services/wikimediaService.js';
import { getIndianLanguageByCode, detectIndianLanguageCode } from '../config/indianLanguages.js';

export const searchRouter = Router();

// Unified / Combined Literature Discovery Search API
// Searches Application Database (Admin-published works) + Indian Wikimedia sources dynamically
searchRouter.get('/combined', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, author, lang, limit, offset } = req.query;
    const queryStr = q ? String(q).trim() : '';
    const authorStr = author ? String(author).trim() : '';
    const langStr = lang ? String(lang).trim() : 'auto';
    const numLimit = limit ? Math.min(60, Math.max(1, Number(limit))) : 20;
    const numOffset = offset ? Math.max(0, Number(offset)) : 0;

    // Combined search term for external & internal matching
    const effectiveQuery = queryStr || authorStr;

    // 1. Search Application's Published Literature from database
    const dbConditions: any[] = [{ publicationStatus: 'PUBLISHED' }];
    if (queryStr) {
      dbConditions.push({
        OR: [
          { title: { contains: queryStr } },
          { brief: { contains: queryStr } },
          { content: { contains: queryStr } },
          { creator: { name: { contains: queryStr } } },
          { subject: { contains: queryStr } },
          { genre: { contains: queryStr } },
        ],
      });
    }

    if (authorStr) {
      dbConditions.push({
        creator: { name: { contains: authorStr } },
      });
    }

    // Only strictly restrict DB literature by language when user is browsing without a specific title/content query,
    // or if the query itself is in that native script. If a user searches for a specific work title like "Hamlet" or "Godan",
    // matching database literature should be discovered and prioritized regardless of regional filter misalignments.
    if (langStr && langStr !== 'auto' && !queryStr) {
      const langConfig = getIndianLanguageByCode(langStr);
      const targetLangName = langConfig ? langConfig.name : langStr;
      dbConditions.push({
        language: { contains: targetLangName },
      });
    }

    const dbItemsPromise = prisma.literature.findMany({
      where: { AND: dbConditions },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        comments: true,
        votes: true,
      },
      orderBy: { publicationDate: 'desc' },
      take: numLimit,
    }).catch((dbErr) => {
      console.warn('[SearchRouter] DB literature query warning:', dbErr);
      return [];
    });

    // 2. Dynamically search Wikimedia Indian-language sources using title/keyword or author
    const fallbackDetectedLang = detectIndianLanguageCode(effectiveQuery) || (langStr && langStr !== 'auto' ? langStr : 'en');
    const wikiPromise = effectiveQuery
      ? WikimediaService.searchAcrossIndianLanguages(effectiveQuery, langStr, {
          limit: numLimit,
          offset: numOffset,
        }).catch((wikiErr) => {
          console.warn('[SearchRouter] Wikimedia discovery error (continuing with DB results):', wikiErr);
          return { results: [], total: 0, detectedLanguage: fallbackDetectedLang };
        })
      : Promise.resolve({ results: [], total: 0, detectedLanguage: fallbackDetectedLang });

    const [dbItems, wikiResult] = await Promise.all([dbItemsPromise, wikiPromise]);

    // Format DB items into normalized format
    const formattedDbItems = dbItems.map((item) => {
      const totalRatingsCount = item.ratings.length;
      const averageRating =
        totalRatingsCount > 0
          ? Number((item.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
          : 0;
      const likesCount = item.votes.filter((v) => v.type === 'LIKE').length;
      const downvotesCount = item.votes.filter((v) => v.type === 'DOWNVOTE').length;

      const itemLangCode =
        detectIndianLanguageCode(item.language) ||
        detectIndianLanguageCode(item.title) ||
        'kn';

      return {
        id: item.id,
        title: item.title,
        originalTitle: item.title,
        subheading: item.subheading,
        author: item.creator?.name || 'Unknown Author',
        creator: item.creator,
        language: item.language,
        languageCode: itemLangCode,
        description: item.brief || item.subheading,
        excerpt: item.brief,
        content: item.content,
        genre: item.genre,
        subject: item.subject,
        coverImage: item.coverImage,
        thumbnail: item.coverImage,
        thumbnailUrl: item.coverImage,
        publicationDate: item.publicationDate,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        source: 'APPLICATION' as const,
        sourceLabel: 'Published Literature',
        itemType: 'WORK' as const,
        literatureType: item.genre || 'Literature Work',
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        likesCount,
        downvotesCount,
      };
    });

    // Format Wikimedia items
    const formattedWikiItems = wikiResult.results.map((item) => ({
      id: item.id,
      title: item.title,
      originalTitle: item.originalTitle || item.title,
      author: item.author || undefined,
      language: item.language,
      languageCode: item.languageCode,
      description: item.description,
      excerpt: item.excerpt,
      thumbnail: item.thumbnail,
      thumbnailUrl: item.thumbnailUrl,
      itemType: item.itemType || 'WORK',
      literatureType: item.literatureType || 'Literature',
      source: 'WIKIMEDIA' as const,
      sourceLabel: `Wikimedia / ${item.language.split(' ')[0]} Wikipedia`,
      sourceProject: item.sourceProject,
      sourceUrl: item.sourceUrl,
      canonicalUrl: item.canonicalUrl,
      isFullTextAvailable: item.isFullTextAvailable,
      fullTextSource: item.fullTextSource,
      fullTextUrl: item.fullTextUrl,
      attribution: item.attribution,
    }));

    // Deduplicate: if an application work has the exact same title as a wiki work, prioritize application
    const seenTitles = new Set<string>();
    const combined: any[] = [];

    for (const appItem of formattedDbItems) {
      seenTitles.add(appItem.title.toLowerCase().trim());
      combined.push(appItem);
    }

    for (const wikiItem of formattedWikiItems) {
      const normalizedTitle = wikiItem.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        combined.push(wikiItem);
      }
    }

    // Rank combined items
    if (effectiveQuery) {
      const qLower = effectiveQuery.toLowerCase();
      combined.sort((a, b) => {
        const aTitle = a.title.toLowerCase().trim();
        const bTitle = b.title.toLowerCase().trim();

        // 1. Exact title match
        const aExact = aTitle === qLower ? 1 : 0;
        const bExact = bTitle === qLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // 2. Application published literature priority for ties
        const aApp = a.source === 'APPLICATION' ? 1 : 0;
        const bApp = b.source === 'APPLICATION' ? 1 : 0;

        // 3. Starts with search query
        const aStarts = aTitle.startsWith(qLower) ? 1 : 0;
        const bStarts = bTitle.startsWith(qLower) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // 4. Contains search query
        const aContains = aTitle.includes(qLower) ? 1 : 0;
        const bContains = bTitle.includes(qLower) ? 1 : 0;
        if (aContains !== bContains) return bContains - aContains;

        // 5. Author match
        const aAuthor = (a.author || (a.creator ? a.creator.name : '')).toLowerCase().includes(qLower) ? 1 : 0;
        const bAuthor = (b.author || (b.creator ? b.creator.name : '')).toLowerCase().includes(qLower) ? 1 : 0;
        if (aAuthor !== bAuthor) return bAuthor - aAuthor;

        if (aApp !== bApp) return bApp - aApp;
        return 0;
      });
    }

    res.json({
      success: true,
      query: queryStr,
      languageCode: langStr,
      detectedLanguage: wikiResult.detectedLanguage,
      total: combined.length,
      applicationCount: formattedDbItems.length,
      wikimediaCount: formattedWikiItems.length,
      results: combined,
    });
  } catch (err: any) {
    console.error('[SearchRouter] Combined search error:', err);
    res.status(500).json({ success: false, error: 'Combined search failed.' });
  }
});

// Advanced Search across Title, Author, Language, Subject, Category, Genre, and Tag
searchRouter.get('/advanced', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, language, subject, category, genre, tag } = req.query;

    const conditions: any[] = [{ publicationStatus: 'PUBLISHED' }];

    if (title && String(title).trim()) {
      conditions.push({
        title: { contains: String(title).trim() },
      });
    }

    if (author && String(author).trim()) {
      conditions.push({
        creator: {
          name: { contains: String(author).trim() },
        },
      });
    }

    if (language && String(language).trim()) {
      conditions.push({
        language: { contains: String(language).trim() },
      });
    }

    if (subject && String(subject).trim()) {
      conditions.push({
        subject: { contains: String(subject).trim() },
      });
    }

    if (genre && String(genre).trim()) {
      conditions.push({
        genre: { contains: String(genre).trim() },
      });
    }

    if (category && String(category).trim()) {
      conditions.push({
        category: {
          name: { contains: String(category).trim() },
        },
      });
    }

    if (tag && String(tag).trim()) {
      conditions.push({
        tags: {
          some: {
            tag: {
              name: { contains: String(tag).trim() },
            },
          },
        },
      });
    }

    const items = await prisma.literature.findMany({
      where: {
        AND: conditions,
      },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        comments: true,
        votes: true,
      },
      orderBy: { publicationDate: 'desc' },
    });

    const results = items.map((item) => {
      const totalRatingsCount = item.ratings.length;
      const averageRating =
        totalRatingsCount > 0
          ? Number((item.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
          : 0;

      const likesCount = item.votes.filter((v) => v.type === 'LIKE').length;
      const downvotesCount = item.votes.filter((v) => v.type === 'DOWNVOTE').length;

      return {
        id: item.id,
        title: item.title,
        subheading: item.subheading,
        brief: item.brief,
        language: item.language,
        subject: item.subject,
        genre: item.genre,
        coverImage: item.coverImage,
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        source: 'APPLICATION',
        sourceLabel: 'Published Literature',
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        likesCount,
        downvotesCount,
      };
    });

    res.json({ results, total: results.length });
  } catch (err) {
    console.error('Advanced search error:', err);
    res.status(500).json({ error: 'Advanced search failed.' });
  }
});

// Art & Craft Multi-Field Search (Name, State, Region, Place, Type, Keywords)
searchRouter.get('/art-craft', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, state, region, place, type, query } = req.query;

    const conditions: any[] = [{ status: 'PUBLISHED' }];

    if (name && String(name).trim()) {
      conditions.push({
        OR: [
          { name: { contains: String(name).trim() } },
          { localName: { contains: String(name).trim() } },
        ],
      });
    }

    if (state && String(state).trim() && String(state).trim() !== 'ALL') {
      conditions.push({
        state: { equals: String(state).trim() },
      });
    }

    if (region && String(region).trim()) {
      conditions.push({
        region: { contains: String(region).trim() },
      });
    }

    if (place && String(place).trim()) {
      conditions.push({
        place: { contains: String(place).trim() },
      });
    }

    if (type && String(type).trim()) {
      conditions.push({
        type: { contains: String(type).trim() },
      });
    }

    if (query && String(query).trim()) {
      const q = String(query).trim();
      conditions.push({
        OR: [
          { name: { contains: q } },
          { localName: { contains: q } },
          { state: { contains: q } },
          { region: { contains: q } },
          { district: { contains: q } },
          { place: { contains: q } },
          { type: { contains: q } },
          { materials: { contains: q } },
          { traditionalProducts: { contains: q } },
        ],
      });
    }

    const crafts = await prisma.artCraft.findMany({
      where: {
        AND: conditions,
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });

    res.json({
      total: crafts.length,
      results: crafts,
    });
  } catch (err) {
    console.error('Art & Craft search error:', err);
    res.status(500).json({ error: 'Art & Craft search failed.' });
  }
});
