import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const readerRouter = Router();

// 1. Get literature details by ID (with user-specific rating and save state if authenticated)
readerRouter.get('/literature/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await prisma.literature.findUnique({
      where: { id },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        comments: {
          where: { parentId: null }, // Top-level comments
          include: {
            user: { select: { id: true, name: true, role: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item || item.publicationStatus !== 'PUBLISHED') {
      res.status(404).json({ error: 'Literature not found or unpublished.' });
      return;
    }

    const totalRatingsCount = item.ratings.length;
    const averageRating =
      totalRatingsCount > 0
        ? Number((item.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
        : 0;

    res.json({
      literature: {
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
        comments: item.comments,
      },
    });
  } catch (err) {
    console.error('Literature detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve literature details.' });
  }
});

// 2. Submit or update 1-5 star rating (one active rating per reader per work)
readerRouter.post('/literature/:id/ratings', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const starValue = Number(value);
    if (!starValue || starValue < 1 || starValue > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
      return;
    }

    // Upsert rating (one per user per work)
    const rating = await prisma.rating.upsert({
      where: {
        userId_literatureId: {
          userId,
          literatureId: id,
        },
      },
      update: { value: starValue },
      create: {
        value: starValue,
        userId,
        literatureId: id,
      },
    });

    // Recalculate average and count dynamically
    const allRatings = await prisma.rating.findMany({
      where: { literatureId: id },
    });

    const totalRatingsCount = allRatings.length;
    const averageRating = Number(
      (allRatings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1)
    );

    res.json({
      message: 'Rating submitted successfully.',
      rating: rating.value,
      totalRatingsCount,
      averageRating,
    });
  } catch (err) {
    console.error('Rating submission error:', err);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

// 3. Toggle Save / Bookmark
readerRouter.post('/literature/:id/save', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const existingSave = await prisma.save.findUnique({
      where: {
        userId_literatureId: {
          userId,
          literatureId: id,
        },
      },
    });

    if (existingSave) {
      await prisma.save.delete({ where: { id: existingSave.id } });
      const count = await prisma.save.count({ where: { literatureId: id } });
      res.json({ saved: false, message: 'Removed from saved literature.', totalSavesCount: count });
    } else {
      await prisma.save.create({
        data: { userId, literatureId: id },
      });
      const count = await prisma.save.count({ where: { literatureId: id } });
      res.json({ saved: true, message: 'Saved to your personal collection.', totalSavesCount: count });
    }
  } catch (err) {
    console.error('Save toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle save.' });
  }
});

// 4. Get Reader's Saved Literature
readerRouter.get('/saved', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const saves = await prisma.save.findMany({
      where: { userId },
      include: {
        literature: {
          include: {
            creator: true,
            category: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const savedWorks = saves.map((s) => {
      const lit = s.literature;
      const totalRatingsCount = lit.ratings.length;
      const averageRating =
        totalRatingsCount > 0
          ? Number((lit.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
          : 0;

      return {
        id: lit.id,
        title: lit.title,
        subheading: lit.subheading,
        brief: lit.brief,
        creator: lit.creator,
        category: lit.category,
        averageRating,
        totalRatingsCount,
        savedAt: s.createdAt,
      };
    });

    res.json({ savedWorks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved works.' });
  }
});

// 5. Post comment or threaded reply
readerRouter.post('/literature/:id/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user?.userId;

    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty.' });
      return;
    }

    if (parentId) {
      // Ensure parent comment exists
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) {
        res.status(404).json({ error: 'Parent comment not found.' });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        userId: userId!,
        literatureId: id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json({ message: 'Comment posted successfully.', comment });
  } catch (err) {
    console.error('Post comment error:', err);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// 6. Delete Comment (Owner or Admin with Cascade Deletion)
readerRouter.delete('/comments/:commentId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const user = req.user;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    // Only comment owner or Admin can delete
    if (comment.userId !== user?.userId && user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'You are not authorized to delete this comment.' });
      return;
    }

    // Cascade deletion deletes comment and all replies
    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ message: 'Comment and associated replies deleted successfully.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});
