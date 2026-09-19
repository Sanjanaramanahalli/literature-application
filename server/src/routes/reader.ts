import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth.js';

export const readerRouter = Router();

// 1. Get literature details by ID (with user-specific rating, save, and vote states if authenticated)
readerRouter.get('/literature/:id', optionalAuthenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const item = await prisma.literature.findUnique({
      where: { id },
      include: {
        creator: true,
        category: true,
        tags: { include: { tag: true } },
        ratings: true,
        saves: true,
        votes: true,
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

    const likesCount = item.votes.filter((v) => v.type === 'LIKE').length;
    const downvotesCount = item.votes.filter((v) => v.type === 'DOWNVOTE').length;
    
    let userVote: 'LIKE' | 'DOWNVOTE' | null = null;
    let isSavedByUser = false;
    let userRatingVal = 0;

    if (currentUserId) {
      const foundVote = item.votes.find((v) => v.userId === currentUserId);
      if (foundVote) userVote = foundVote.type as 'LIKE' | 'DOWNVOTE';

      isSavedByUser = item.saves.some((s) => s.userId === currentUserId);

      const foundRating = item.ratings.find((r) => r.userId === currentUserId);
      if (foundRating) userRatingVal = foundRating.value;
    }

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
        userRating: userRatingVal,
        totalSavesCount: item.saves.length,
        isSaved: isSavedByUser,
        likesCount,
        downvotesCount,
        userVote,
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

// 3b. Like / Downvote Literature Vote System
readerRouter.post('/literature/:id/vote', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'LIKE' or 'DOWNVOTE'
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!type || !['LIKE', 'DOWNVOTE'].includes(type)) {
      res.status(400).json({ error: 'Invalid vote type. Must be LIKE or DOWNVOTE.' });
      return;
    }

    const existingVote = await prisma.literatureVote.findUnique({
      where: {
        userId_literatureId: {
          userId,
          literatureId: id,
        },
      },
    });

    let activeUserVote: 'LIKE' | 'DOWNVOTE' | null = null;

    if (existingVote) {
      if (existingVote.type === type) {
        // Toggle off if clicking the same vote button again
        await prisma.literatureVote.delete({ where: { id: existingVote.id } });
        activeUserVote = null;
      } else {
        // Switch from LIKE to DOWNVOTE or vice versa
        await prisma.literatureVote.update({
          where: { id: existingVote.id },
          data: { type },
        });
        activeUserVote = type as 'LIKE' | 'DOWNVOTE';
      }
    } else {
      // Create new vote
      await prisma.literatureVote.create({
        data: {
          userId,
          literatureId: id,
          type,
        },
      });
      activeUserVote = type as 'LIKE' | 'DOWNVOTE';
    }

    // Get updated counts
    const likesCount = await prisma.literatureVote.count({
      where: { literatureId: id, type: 'LIKE' },
    });
    const downvotesCount = await prisma.literatureVote.count({
      where: { literatureId: id, type: 'DOWNVOTE' },
    });

    res.json({
      success: true,
      userVote: activeUserVote,
      likesCount,
      downvotesCount,
      message:
        activeUserVote === 'LIKE'
          ? 'You liked this literature.'
          : activeUserVote === 'DOWNVOTE'
          ? 'You downvoted this literature.'
          : 'Your vote was removed.',
    });
  } catch (err) {
    console.error('Vote submission error:', err);
    res.status(500).json({ error: 'Failed to record vote.' });
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
        language: lit.language,
        genre: lit.genre,
        coverImage: lit.coverImage,
        publicationDate: lit.publicationDate,
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
