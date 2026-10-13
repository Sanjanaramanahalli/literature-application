import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

export const literatureRouter = Router();

// 1. Get all published literature (with creator, category, tags, average rating, rating counts)
literatureRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, creatorId, language } = req.query;

    const whereClause: any = {
      publicationStatus: 'PUBLISHED',
    };

    if (category) {
      whereClause.category = {
        slug: String(category),
      };
    }

    if (creatorId) {
      whereClause.creatorId = String(creatorId);
    }

    if (language && String(language).toLowerCase() !== 'all') {
      whereClause.language = {
        contains: String(language),
      };
    }

    if (search) {
      const searchStr = String(search);
      whereClause.OR = [
        { title: { contains: searchStr } },
        { brief: { contains: searchStr } },
        { creator: { name: { contains: searchStr } } },
      ];
    }

    const items = await prisma.literature.findMany({
      where: whereClause,
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

    const formattedDbItems = items.map((item) => {
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
        content: item.content,
        language: item.language,
        subject: item.subject,
        genre: item.genre,
        coverImage: item.coverImage,
        thumbnailUrl: item.coverImage,
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        source: 'APPLICATION' as const,
        sourceLabel: 'Published Literature',
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        likesCount,
        downvotesCount,
        popularityScore: totalRatingsCount + item.saves.length + item.comments.length + likesCount,
      };
    });

    // If search query is provided, dynamically discover matching literature from Wikimedia Indian languages
    if (search && String(search).trim()) {
      try {
        const queryStr = String(search).trim();
        const langStr = language && String(language).toLowerCase() !== 'all' ? String(language) : 'auto';
        const { WikimediaService } = await import('../services/wikimediaService.js');
        const wikiData = await WikimediaService.searchAcrossIndianLanguages(queryStr, langStr, { limit: 15 });

        const formattedWiki = wikiData.results.map((w) => ({
          id: w.id,
          title: w.title,
          originalTitle: w.originalTitle,
          subheading: w.author ? `By ${w.author}` : undefined,
          brief: w.excerpt || w.description,
          language: w.language,
          genre: 'Indian Literature / Classical',
          coverImage: w.thumbnailUrl,
          thumbnailUrl: w.thumbnailUrl,
          publicationDate: new Date().toISOString(),
          creator: w.author ? { id: `author-${w.languageCode}`, name: w.author } : undefined,
          source: 'WIKIMEDIA' as const,
          sourceLabel: `Wikimedia / ${w.language.split(' ')[0]} Wikipedia`,
          sourceUrl: w.sourceUrl,
          canonicalUrl: w.canonicalUrl,
          isFullTextAvailable: w.isFullTextAvailable,
          fullTextSource: w.fullTextSource,
          fullTextUrl: w.fullTextUrl,
          attribution: w.attribution,
          totalRatingsCount: 0,
          averageRating: 0,
          totalSavesCount: 0,
          totalCommentsCount: 0,
          likesCount: 0,
          downvotesCount: 0,
          popularityScore: 0,
        }));

        // Deduplicate
        const seen = new Set<string>();
        const combined: any[] = [];

        for (const item of formattedDbItems) {
          seen.add(item.title.toLowerCase().trim());
          combined.push(item);
        }

        for (const item of formattedWiki) {
          const key = item.title.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        }

        res.json({ literatures: combined });
        return;
      } catch (wikiErr) {
        console.warn('[LiteratureRouter] Wikimedia dynamic discovery error (fallback to DB items):', wikiErr);
      }
    }

    res.json({ literatures: formattedDbItems });
  } catch (err) {
    console.error('Fetch literature error:', err);
    res.status(500).json({ error: 'Failed to retrieve literature.' });
  }
});

// 2. Get Featured Literature (highest engagement or curated)
literatureRouter.get('/featured', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.literature.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        comments: true,
      },
    });

    if (items.length === 0) {
      res.json({ featured: null });
      return;
    }

    // Sort by popularity formula: Total Ratings Count + Total Saves + Total Comments
    items.sort((a, b) => {
      const scoreA = a.ratings.length + a.saves.length + a.comments.length;
      const scoreB = b.ratings.length + b.saves.length + b.comments.length;
      return scoreB - scoreA;
    });

    const top = items[0];
    const totalRatingsCount = top.ratings.length;
    const averageRating =
      totalRatingsCount > 0
        ? Number((top.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
        : 0;

    res.json({
      featured: {
        id: top.id,
        title: top.title,
        subheading: top.subheading,
        brief: top.brief,
        content: top.content,
        language: top.language,
        subject: top.subject,
        genre: top.genre,
        coverImage: top.coverImage,
        publicationDate: top.publicationDate,
        creator: top.creator,
        category: top.category,
        tags: top.tags.map((t) => t.tag.name),
        totalRatingsCount,
        averageRating,
        totalSavesCount: top.saves.length,
        totalCommentsCount: top.comments.length,
      },
    });
  } catch (err) {
    console.error('Featured error:', err);
    res.status(500).json({ error: 'Failed to retrieve featured literature.' });
  }
});

// 3. Get Popular Literature (Strict formula: Total Ratings Count + Total Saves + Total Comments + Likes)
literatureRouter.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.literature.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        comments: true,
        votes: true,
      },
    });

    const enriched = items.map((item) => {
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
        genre: item.genre,
        coverImage: item.coverImage,
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        likesCount,
        downvotesCount,
        popularityScore: totalRatingsCount + item.saves.length + item.comments.length + likesCount,
      };
    });

    // Sort strictly by popularityScore DESC, tie-break by publicationDate DESC
    enriched.sort((a, b) => {
      if (b.popularityScore !== a.popularityScore) {
        return b.popularityScore - a.popularityScore;
      }
      return new Date(b.publicationDate || 0).getTime() - new Date(a.publicationDate || 0).getTime();
    });

    res.json({ popular: enriched.slice(0, 6) });
  } catch (err) {
    console.error('Popular literature error:', err);
    res.status(500).json({ error: 'Failed to retrieve popular literature.' });
  }
});

// 4. Get New Releases (Latest published works by publicationDate DESC)
literatureRouter.get('/new-releases', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 6;

    const items = await prisma.literature.findMany({
      where: { publicationStatus: 'PUBLISHED' },
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
      take: limit,
    });

    const enriched = items.map((item) => {
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
        genre: item.genre,
        coverImage: item.coverImage,
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        likesCount,
        downvotesCount,
      };
    });

    res.json({ newReleases: enriched });
  } catch (err) {
    console.error('New releases error:', err);
    res.status(500).json({ error: 'Failed to retrieve new releases.' });
  }
});

// 5. Get Categories list
literatureRouter.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            literatures: {
              where: { publicationStatus: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      literatureCount: c._count.literatures,
    }));

    res.json({ categories: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});
