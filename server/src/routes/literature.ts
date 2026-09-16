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
      },
      orderBy: { publicationDate: 'desc' },
    });

    const enriched = items.map((item) => {
      const totalRatingsCount = item.ratings.length;
      const averageRating =
        totalRatingsCount > 0
          ? Number((item.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
          : 0;

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
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        totalRatingsCount,
        averageRating,
        totalSavesCount: item.saves.length,
        totalCommentsCount: item.comments.length,
        popularityScore: totalRatingsCount + item.saves.length + item.comments.length,
      };
    });

    res.json({ literatures: enriched });
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

// 3. Get Popular Literature (Strict formula: Total Ratings Count + Total Saves + Total Comments)
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
      },
    });

    const enriched = items.map((item) => {
      const totalRatingsCount = item.ratings.length;
      const averageRating =
        totalRatingsCount > 0
          ? Number((item.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
          : 0;

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
        popularityScore: totalRatingsCount + item.saves.length + item.comments.length,
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
