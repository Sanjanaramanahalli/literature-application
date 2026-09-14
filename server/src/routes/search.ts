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
      },
      orderBy: { publicationDate: 'desc' },
    });

    const results = items.map((item) => {
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
        subject: item.subject,
        genre: item.genre,
        coverImage: item.coverImage,
        publicationDate: item.publicationDate,
        creator: item.creator,
        category: item.category,
        tags: item.tags.map((t) => t.tag.name),
        totalRatingsCount,
        averageRating,
      };
    });

    res.json({ results, total: results.length });
  } catch (err) {
    console.error('Advanced search error:', err);
    res.status(500).json({ error: 'Advanced search failed.' });
  }
});
