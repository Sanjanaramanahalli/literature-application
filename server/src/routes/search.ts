import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

export const searchRouter = Router();

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

