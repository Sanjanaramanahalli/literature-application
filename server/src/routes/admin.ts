import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

export const adminRouter = Router();

import os from 'os';

// Configure local multer storage in server/uploads (or os.tmpdir() in serverless environments like Vercel)
const isVercel = !!process.env.VERCEL;
export const uploadDir = isVercel
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.warn('Could not create uploads directory:', e);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `cover_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are permitted.'));
    }
  },
});

// 1. Upload Cover Image with Multer Error Handling
adminRouter.post(
  '/upload-cover',
  authenticateToken,
  requireRole('ADMIN'),
  (req, res, next) => {
    upload.single('coverImage')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum allowable limit of 5MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message || 'Image upload failed.' });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded.' });
        return;
      }
      const coverUrl = `/uploads/${req.file.filename}`;
      res.json({ message: 'Cover uploaded successfully.', coverUrl, filename: req.file.filename });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Image upload failed.' });
    }
  }
);

// 1b. Helper: Calculate Page Count
// Supports explicit page breaks (---page--- or <!-- pagebreak --> or \f) OR standard ~250 words per book page
export const calculatePageCount = (text: string): number => {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  
  // If author/curator explicitly inserted page break markers
  if (trimmed.includes('---page---') || trimmed.includes('<!-- pagebreak -->') || trimmed.includes('\f')) {
    const segments = trimmed.split(/---page---|<!-- pagebreak -->|\f/g).filter(s => s.trim().length > 0);
    return Math.max(1, segments.length);
  }

  // Standard publication pagination: ~250 words per standard book page
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
};

// 2. Create Literature (Draft or Published)
adminRouter.post(
  '/literature',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        subheading,
        brief,
        content,
        language,
        subject,
        genre,
        coverImage,
        publicationStatus,
        creatorId,
        categoryId,
        tags,
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Title is required.' });
        return;
      }

      if (!brief || !brief.trim()) {
        res.status(400).json({ error: 'Brief summary is required.' });
        return;
      }

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Literature content is required and cannot be empty.' });
        return;
      }

      if (!creatorId || !categoryId) {
        res.status(400).json({ error: 'Author/Creator and Category are required.' });
        return;
      }

      const status = publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
      const pageCount = calculatePageCount(content);

      const DEFAULT_COVER_URL =
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85';

      // Requirements for PUBLISHED works: content must not be empty.
      // Cover image is optional — a default is assigned if missing.
      if (status === 'PUBLISHED') {
        if (!content || !content.trim()) {
          res.status(400).json({ error: 'Literature content cannot be empty.' });
          return;
        }
      }

      // Auto-assign default cover when publishing without a cover image
      const finalCoverImage =
        coverImage && String(coverImage).trim()
          ? coverImage
          : status === 'PUBLISHED'
            ? DEFAULT_COVER_URL
            : null;

      const publicationDate = status === 'PUBLISHED' ? new Date() : null;

      const literature = await prisma.literature.create({
        data: {
          title: title.trim(),
          subheading: subheading?.trim(),
          brief: brief.trim(),
          content: content.trim(),
          language: language?.trim() || 'English',
          subject: subject?.trim(),
          genre: genre?.trim(),
          coverImage: finalCoverImage,
          publicationStatus: status,
          publicationDate,
          creatorId,
          categoryId,
        },
      });

      // Handle tags if provided
      if (Array.isArray(tags) && tags.length > 0) {
        for (const tagName of tags) {
          const trimmed = String(tagName).trim();
          if (!trimmed) continue;
          let tagRecord = await prisma.tag.findUnique({ where: { name: trimmed } });
          if (!tagRecord) {
            tagRecord = await prisma.tag.create({ data: { name: trimmed } });
          }
          await prisma.literatureTag.create({
            data: { literatureId: literature.id, tagId: tagRecord.id },
          });
        }
      }

      res.status(201).json({ message: 'Literature created successfully.', literature });
    } catch (err) {
      console.error('Create literature error:', err);
      res.status(500).json({ error: 'Failed to create literature.' });
    }
  }
);

// 2b. List all Literature for Admin Curation (Drafts, Published, Unpublished, All) with Full Filtering
adminRouter.get(
  '/literature',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, search, language, category } = req.query;
      const whereClause: any = {};

      const statusStr = String(status || '').toUpperCase();
      if (statusStr && ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(statusStr)) {
        whereClause.publicationStatus = statusStr;
      }

      if (language && String(language).trim()) {
        whereClause.language = String(language).trim();
      }

      const literatures = await prisma.literature.findMany({
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
        orderBy: { updatedAt: 'desc' },
      });

      let enriched = literatures.map((item) => {
        const totalRatingsCount = item.ratings?.length || 0;
        const averageRating =
          totalRatingsCount > 0
            ? Number((item.ratings.reduce((acc: number, r: any) => acc + r.value, 0) / totalRatingsCount).toFixed(1))
            : 0;

        const likesCount = (item.votes || []).filter((v: any) => v.type === 'LIKE').length;
        const downvotesCount = (item.votes || []).filter((v: any) => v.type === 'DOWNVOTE').length;

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
          publicationStatus: item.publicationStatus,
          publicationDate: item.publicationDate,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          creator: item.creator,
          category: item.category,
          tags: (item.tags || []).map((t: any) => t.tag?.name || t.tag || t),
          totalRatingsCount,
          averageRating,
          totalSavesCount: item.saves?.length || 0,
          totalCommentsCount: item.comments?.length || 0,
          likesCount,
          downvotesCount,
        };
      });

      // Filter by category slug or name if specified
      if (category && String(category).trim() && String(category) !== 'ALL') {
        const catStr = String(category).toLowerCase();
        enriched = enriched.filter(
          (item) =>
            item.category?.name?.toLowerCase() === catStr ||
            item.category?.slug?.toLowerCase() === catStr ||
            item.category?.id === category
        );
      }

      // Filter by search query across title, author name, brief
      if (search && String(search).trim()) {
        const q = String(search).toLowerCase();
        enriched = enriched.filter(
          (item) =>
            item.title?.toLowerCase().includes(q) ||
            item.creator?.name?.toLowerCase().includes(q) ||
            item.brief?.toLowerCase().includes(q) ||
            item.genre?.toLowerCase().includes(q)
        );
      }

      res.json({
        total: enriched.length,
        literatures: enriched,
      });
    } catch (err) {
      console.error('Admin list literature error:', err);
      res.status(500).json({ error: 'Failed to retrieve literature list for administration.' });
    }
  }
);

// 2c. Get Creators list & Create Creator
adminRouter.get(
  '/creators',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const creators = await prisma.creator.findMany({
        orderBy: { name: 'asc' },
      });
      res.json({ creators });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve creators.' });
    }
  }
);

adminRouter.post(
  '/creators',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, bio, roleType } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Creator name is required.' });
        return;
      }
      const creator = await prisma.creator.create({
        data: {
          name: name.trim(),
          bio: bio?.trim(),
          roleType: roleType || 'AUTHOR',
        },
      });
      res.status(201).json({ message: 'Creator registered successfully.', creator });
    } catch (err) {
      res.status(500).json({ error: 'Failed to register creator.' });
    }
  }
);

// 2d. Get Categories list for Admin
adminRouter.get(
  '/categories',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      res.json({ categories });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve categories.' });
    }
  }
);

// 3. Update Literature / Status (Publish, Unpublish, Draft)
adminRouter.put(
  '/literature/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { publicationStatus, ...rest } = req.body;

      const existing = await prisma.literature.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Literature not found.' });
        return;
      }

      const updateData: any = { ...rest };
      if (publicationStatus) {
        updateData.publicationStatus = publicationStatus;

        // If transitioning to or updating as PUBLISHED, enforce requirements
        if (publicationStatus === 'PUBLISHED') {
          const DEFAULT_COVER_URL =
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85';
          const checkCover = updateData.coverImage !== undefined ? updateData.coverImage : existing.coverImage;
          const checkContent = updateData.content !== undefined ? updateData.content : existing.content;

          // Auto-assign default cover if none is provided — do NOT block publication
          if (!checkCover || !String(checkCover).trim()) {
            updateData.coverImage = DEFAULT_COVER_URL;
          }

          if (!checkContent || !checkContent.trim()) {
            res.status(400).json({ error: 'Literature content cannot be empty.' });
            return;
          }

          if (!existing.publicationDate) {
            updateData.publicationDate = new Date();
          }
        }
      }

      const updated = await prisma.literature.update({
        where: { id },
        data: updateData,
      });

      res.json({ message: 'Literature updated successfully.', literature: updated });
    } catch (err) {
      console.error('Update literature error:', err);
      res.status(500).json({ error: 'Failed to update literature.' });
    }
  }
);

// 4. Delete Literature
adminRouter.delete(
  '/literature/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.literature.delete({ where: { id } });
      res.json({ message: 'Literature deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete literature.' });
    }
  }
);

// 5. Real-Time Admin Dashboard with Live KPI Cards & Analytics (LIT-16)
const handleDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Total Literature
    const totalLiterature = await prisma.literature.count();

    // 2. Published Literature
    const publishedLiterature = await prisma.literature.count({
      where: { publicationStatus: 'PUBLISHED' },
    });

    // 3. Draft Literature
    const draftLiterature = await prisma.literature.count({
      where: { publicationStatus: 'DRAFT' },
    });

    // 4. Unpublished Literature
    const unpublishedLiterature = await prisma.literature.count({
      where: { publicationStatus: 'UNPUBLISHED' },
    });

    // 5. Registered Readers (strictly excluding Admins)
    const registeredReaders = await prisma.user.count({
      where: { role: 'READER' },
    });

    // 6. Total Ratings
    const totalRatings = await prisma.rating.count();

    // 7. Average Rating
    const allRatings = await prisma.rating.findMany({ select: { value: true } });
    const averageRating =
      allRatings.length > 0
        ? Number((allRatings.reduce((acc, r) => acc + r.value, 0) / allRatings.length).toFixed(1))
        : 0;

    // 8. Total Comments (Comments + Replies)
    const totalComments = await prisma.comment.count();

    // 9. Total Saves
    const totalSaves = await prisma.save.count();

    // 10. New Users This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await prisma.user.count({
      where: {
        role: 'READER',
        createdAt: { gte: startOfMonth },
      },
    });

    // 11. New Releases This Month
    const newReleasesThisMonth = await prisma.literature.count({
      where: {
        publicationStatus: 'PUBLISHED',
        publicationDate: { gte: startOfMonth },
      },
    });

    // 12. Total Indian Art & Craft (Real Database Telemetry)
    let totalArtCraft = 0;
    try {
      totalArtCraft = await prisma.artCraft.count();
    } catch {
      totalArtCraft = 0;
    }

    // Dashboard Section: Recent Literature
    const recentLiterature = await prisma.literature.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: { creator: true, category: true },
    });

    // Dashboard Section: Popular Literature
    // Sorted by calculated popularity score: (ratings * 2) + saves + comments
    const allLiteraturesForPopularity = await prisma.literature.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        creator: true,
        category: true,
        ratings: true,
        saves: true,
        comments: true,
      },
    });

    const popularLiterature = allLiteraturesForPopularity
      .map((lit) => {
        const ratingCount = lit.ratings.length;
        const avgScore =
          ratingCount > 0
            ? Number((lit.ratings.reduce((acc, r) => acc + r.value, 0) / ratingCount).toFixed(1))
            : 0;
        const saveCount = lit.saves.length;
        const commentCount = lit.comments.length;
        const popularityScore = ratingCount * 2 + saveCount * 1.5 + commentCount;

        return {
          id: lit.id,
          title: lit.title,
          author: lit.creator.name,
          category: lit.category.name,
          rating: avgScore,
          ratingCount,
          saveCount,
          commentCount,
          popularityScore,
        };
      })
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5);

    // Dashboard Section: Recent Comments with moderation status
    const recentComments = await prisma.comment.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } },
        literature: { select: { title: true } },
      },
    });

    const enrichedComments = recentComments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      readerName: c.user.name,
      literatureTitle: c.literature.title,
      moderationStatus: 'APPROVED',
    }));

    // Dashboard Section: Recent Activity (Audit Trail)
    // Gather dynamic milestones from database (literature creations/updates, user registrations, comments)
    const recentUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, role: true, createdAt: true },
    });

    const activities: Array<{
      id: string;
      actionType: 'LITERATURE_CREATED' | 'LITERATURE_UPDATED' | 'LITERATURE_PUBLISHED' | 'USER_REGISTERED' | 'COMMENT_ADDED';
      description: string;
      target: string;
      actor: string;
      timestamp: Date;
    }> = [];

    for (const lit of recentLiterature.slice(0, 4)) {
      activities.push({
        id: `act-lit-${lit.id}`,
        actionType: lit.publicationStatus === 'PUBLISHED' ? 'LITERATURE_PUBLISHED' : 'LITERATURE_CREATED',
        description: `Manuscript "${lit.title}" archived as ${lit.publicationStatus}`,
        target: lit.title,
        actor: 'Admin Curator',
        timestamp: lit.updatedAt,
      });
    }

    for (const u of recentUsers) {
      activities.push({
        id: `act-usr-${u.id}`,
        actionType: 'USER_REGISTERED',
        description: `Scholar "${u.name}" registered with role ${u.role}`,
        target: u.name,
        actor: u.name,
        timestamp: u.createdAt,
      });
    }

    for (const c of recentComments.slice(0, 3)) {
      activities.push({
        id: `act-cmt-${c.id}`,
        actionType: 'COMMENT_ADDED',
        description: `Comment contributed by ${c.user.name} on "${c.literature.title}"`,
        target: c.literature.title,
        actor: c.user.name,
        timestamp: c.createdAt,
      });
    }

    const recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);

    const statsPayload = {
      totalLiterature,
      publishedLiterature,
      draftLiterature,
      unpublishedLiterature,
      registeredReaders,
      totalRatings,
      averageRating,
      totalComments,
      totalSaves,
      newUsersThisMonth,
      newReleasesThisMonth,
      totalArtCraft,
    };

    res.json({
      ...statsPayload,
      kpis: statsPayload,
      recentLiterature,
      popularLiterature,
      recentComments: enrichedComments,
      recentActivity,
    });
  } catch (err) {
    console.error('Admin KPI fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard analytics.' });
  }
};

adminRouter.get('/dashboard/kpis', authenticateToken, requireRole('ADMIN'), handleDashboardStats);
adminRouter.get('/dashboard/stats', authenticateToken, requireRole('ADMIN'), handleDashboardStats);

// Real-time Admin Notifications: new likes, comments, and registered users
adminRouter.get('/notifications', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications: Array<{
      id: string;
      type: 'LIKE' | 'COMMENT' | 'NEW_USER' | 'SAVE';
      title: string;
      message: string;
      actor: string;
      createdAt: Date;
      read?: boolean;
    }> = [];

    // 1. Recent Likes on Literature
    const recentVotes = await prisma.literatureVote.findMany({
      take: 10,
      where: { type: 'LIKE' },
      orderBy: { createdAt: 'desc' },
    });

    for (const v of recentVotes) {
      const user = await prisma.user.findUnique({ where: { id: v.userId }, select: { name: true } });
      const lit = await prisma.literature.findUnique({ where: { id: v.literatureId }, select: { title: true } });
      if (user && lit) {
        notifications.push({
          id: `notif-like-${v.id}`,
          type: 'LIKE',
          title: 'New Literature Like',
          message: `${user.name} liked "${lit.title}"`,
          actor: user.name,
          createdAt: v.createdAt || new Date(),
        });
      }
    }

    // 2. Recent Comments
    const recentComments = await prisma.comment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        literature: { select: { title: true } },
      },
    });

    for (const c of recentComments) {
      if (c.user && c.literature) {
        notifications.push({
          id: `notif-comment-${c.id}`,
          type: 'COMMENT',
          title: 'New Scholarly Comment',
          message: `${c.user.name} commented on "${c.literature.title}": "${c.content.slice(0, 60)}${c.content.length > 60 ? '...' : ''}"`,
          actor: c.user.name,
          createdAt: c.createdAt || new Date(),
        });
      }
    }

    // 3. New Readers/Users Registered
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, role: true, email: true, createdAt: true },
    });

    for (const u of recentUsers) {
      notifications.push({
        id: `notif-user-${u.id}`,
        type: 'NEW_USER',
        title: 'New User Registered',
        message: `${u.name} registered as a ${u.role} (${u.email})`,
        actor: u.name,
        createdAt: u.createdAt || new Date(),
      });
    }

    const sorted = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    res.json({
      notifications: sorted,
      unreadCount: sorted.length,
    });
  } catch (err) {
    console.error('Admin notifications fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// =========================================================================
// DEDICATED STATISTIC DATA ENDPOINTS FOR ADMIN DASHBOARD CARDS
// =========================================================================

// Page 5: Registered Readers (Strictly excludes administrators)
adminRouter.get('/readers', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const readers = await prisma.user.findMany({
      where: { role: 'READER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Enrich each reader with contribution counts (ratings given, comments posted, saves made)
    let enriched = await Promise.all(
      readers.map(async (r: any) => {
        const ratingsCount = await prisma.rating.count({ where: { userId: r.id } });
        const commentsCount = await prisma.comment.count({ where: { userId: r.id } });
        const savesCount = await prisma.save.count({ where: { userId: r.id } });
        return {
          ...r,
          accountStatus: 'Active',
          ratingsCount,
          commentsCount,
          savesCount,
          totalContributions: ratingsCount + commentsCount + savesCount,
        };
      })
    );

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
      );
    }

    if (status && String(status).trim() && String(status) !== 'ALL') {
      const st = String(status).toLowerCase();
      enriched = enriched.filter((r) => r.accountStatus.toLowerCase() === st);
    }

    res.json({
      total: enriched.length,
      readers: enriched,
    });
  } catch (err) {
    console.error('Admin readers fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve registered readers.' });
  }
});

// Page 6: Total Ratings (All individual rating records with reader and literature details)
adminRouter.get('/ratings', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, rating } = req.query;
    const ratings = await prisma.rating.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        literature: {
          select: {
            id: true,
            title: true,
            language: true,
            genre: true,
            creator: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let list = ratings.map((r: any) => ({
      id: r.id,
      value: r.value,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userId: r.userId,
      literatureId: r.literatureId,
      readerName: r.user?.name || 'Anonymous Reader',
      readerEmail: r.user?.email || 'N/A',
      readerAvatar: r.user?.avatarUrl || null,
      literatureTitle: r.literature?.title || 'Unknown Work',
      literatureAuthor: r.literature?.creator?.name || 'Unknown Author',
      literatureLanguage: r.literature?.language || 'English',
      literatureCategory: r.literature?.category?.name || 'Classics',
    }));

    if (rating && !isNaN(Number(rating))) {
      const targetVal = Number(rating);
      list = list.filter((r) => r.value === targetVal);
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (r) =>
          r.literatureTitle?.toLowerCase().includes(q) ||
          r.literatureAuthor?.toLowerCase().includes(q) ||
          r.readerName?.toLowerCase().includes(q) ||
          r.readerEmail?.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      ratings: list,
    });
  } catch (err) {
    console.error('Admin ratings fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve ratings.' });
  }
});

// Page 7: Average Rating & Summaries per Literature
adminRouter.get('/ratings/summary', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, language, category, sortBy } = req.query;

    const literatures = await prisma.literature.findMany({
      include: {
        creator: true,
        category: true,
        ratings: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute stats
    let totalAllRatingsCount = 0;
    let totalAllRatingsSum = 0;

    let items = literatures.map((lit) => {
      const count = lit.ratings?.length || 0;
      const sum = (lit.ratings || []).reduce((acc: number, r: any) => acc + r.value, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : null;

      totalAllRatingsCount += count;
      totalAllRatingsSum += sum;

      return {
        id: lit.id,
        title: lit.title,
        author: lit.creator?.name || 'Unknown Author',
        language: lit.language || 'English',
        category: lit.category?.name || 'Classics',
        publicationStatus: lit.publicationStatus,
        ratingsCount: count,
        averageRating: avg, // null if 0 ratings, avoiding false 0.0 or 5.0
      };
    });

    const overallAverage =
      totalAllRatingsCount > 0 ? Number((totalAllRatingsSum / totalAllRatingsCount).toFixed(1)) : 0.0;

    if (language && String(language).trim()) {
      items = items.filter((item) => item.language.toLowerCase() === String(language).toLowerCase());
    }

    if (category && String(category).trim() && String(category) !== 'ALL') {
      items = items.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      items = items.filter(
        (item) => item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q)
      );
    }

    // Sort options: highest, lowest, most-ratings, least-ratings
    if (sortBy === 'highest') {
      items.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
    } else if (sortBy === 'lowest') {
      items.sort((a, b) => (a.averageRating ?? 999) - (b.averageRating ?? 999));
    } else if (sortBy === 'most-ratings') {
      items.sort((a, b) => b.ratingsCount - a.ratingsCount);
    } else if (sortBy === 'least-ratings') {
      items.sort((a, b) => a.ratingsCount - b.ratingsCount);
    }

    res.json({
      total: items.length,
      overallAverage,
      totalRatingsRecorded: totalAllRatingsCount,
      summary: items,
    });
  } catch (err) {
    console.error('Admin rating summary fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve rating summaries.' });
  }
});

// Page 8: Total Comments & Threaded Replies
adminRouter.get('/comments', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, moderationStatus } = req.query;

    const comments = await prisma.comment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        literature: { select: { id: true, title: true, language: true, creator: { select: { name: true } } } },
        replies: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let list = comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      isReply: !!c.parentId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      moderationStatus: 'APPROVED',
      userId: c.userId,
      readerName: c.user?.name || 'Anonymous Reader',
      readerEmail: c.user?.email || 'N/A',
      readerAvatar: c.user?.avatarUrl || null,
      literatureId: c.literatureId,
      literatureTitle: c.literature?.title || 'Unknown Work',
      literatureAuthor: c.literature?.creator?.name || 'Unknown Author',
      repliesCount: c.replies?.length || 0,
    }));

    if (moderationStatus && String(moderationStatus).trim() && String(moderationStatus) !== 'ALL') {
      const mod = String(moderationStatus).toLowerCase();
      list = list.filter((c) => c.moderationStatus.toLowerCase() === mod);
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.readerName.toLowerCase().includes(q) ||
          c.literatureTitle.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      comments: list,
    });
  } catch (err) {
    console.error('Admin comments fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve comments.' });
  }
});

// Page 9: Total Saves (Sanctuary bookmarks)
adminRouter.get('/saves', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, language, category } = req.query;

    const saves = await prisma.save.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        literature: {
          include: {
            creator: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let list = saves.map((s: any) => ({
      id: s.id,
      createdAt: s.createdAt,
      userId: s.userId,
      readerName: s.user?.name || 'Anonymous Reader',
      readerEmail: s.user?.email || 'N/A',
      readerAvatar: s.user?.avatarUrl || null,
      literatureId: s.literatureId,
      literatureTitle: s.literature?.title || 'Unknown Work',
      literatureAuthor: s.literature?.creator?.name || 'Unknown Author',
      literatureLanguage: s.literature?.language || 'English',
      literatureCategory: s.literature?.category?.name || 'Classics',
      literatureStatus: s.literature?.publicationStatus || 'PUBLISHED',
    }));

    if (language && String(language).trim()) {
      list = list.filter((s) => s.literatureLanguage.toLowerCase() === String(language).toLowerCase());
    }

    if (category && String(category).trim() && String(category) !== 'ALL') {
      list = list.filter((s) => s.literatureCategory.toLowerCase() === String(category).toLowerCase());
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (s) =>
          s.literatureTitle.toLowerCase().includes(q) ||
          s.literatureAuthor.toLowerCase().includes(q) ||
          s.readerName.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      saves: list,
    });
  } catch (err) {
    console.error('Admin saves fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve saves.' });
  }
});

// Page 10: New Users This Month (Calendar Month)
adminRouter.get('/new-users', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let enriched = users.map((u: any) => ({
      ...u,
      accountStatus: 'Active',
    }));

    if (role && String(role).trim() && String(role) !== 'ALL') {
      enriched = enriched.filter((u) => u.role === String(role).trim());
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }

    res.json({
      total: enriched.length,
      users: enriched,
      startOfMonth,
    });
  } catch (err) {
    console.error('Admin new users fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve new users.' });
  }
});

// Page 11: New Releases This Month (Published within current calendar month)
adminRouter.get('/new-releases', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, language, category } = req.query;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const literatures = await prisma.literature.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        publicationDate: { gte: startOfMonth },
      },
      include: {
        creator: true,
        category: true,
        ratings: true,
      },
      orderBy: { publicationDate: 'desc' },
    });

    let enriched = literatures.map((item: any) => {
      const count = item.ratings?.length || 0;
      const avg = count > 0 ? Number((item.ratings.reduce((acc: number, r: any) => acc + r.value, 0) / count).toFixed(1)) : 0;
      return {
        id: item.id,
        title: item.title,
        author: item.creator?.name || 'Unknown Author',
        language: item.language || 'English',
        category: item.category?.name || 'Classics',
        publicationStatus: item.publicationStatus,
        publicationDate: item.publicationDate || item.createdAt,
        createdAt: item.createdAt,
        averageRating: avg,
        ratingsCount: count,
      };
    });

    if (language && String(language).trim() && String(language) !== 'ALL') {
      enriched = enriched.filter((item) => item.language.toLowerCase() === String(language).toLowerCase());
    }

    if (category && String(category).trim() && String(category) !== 'ALL') {
      enriched = enriched.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (item) => item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q)
      );
    }

    res.json({
      total: enriched.length,
      releases: enriched,
      startOfMonth,
    });
  } catch (err) {
    console.error('Admin new releases fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve new releases.' });
  }
});

// Page 12: Total Art & Craft across 28 Indian States
adminRouter.get('/artcraft-records', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, state, type } = req.query;

    const crafts = await prisma.artCraft.findMany({
      orderBy: { state: 'asc' },
    });

    let list = crafts.map((c: any) => ({
      id: c.id,
      name: c.name,
      localName: c.localName || null,
      state: c.state,
      region: c.region || null,
      district: c.district || null,
      place: c.place,
      type: c.type,
      history: c.history,
      culturalSignificance: c.culturalSignificance,
      materials: c.materials,
      status: c.status || 'PUBLISHED',
      createdAt: c.createdAt,
    }));

    if (state && String(state).trim() && String(state) !== 'ALL') {
      list = list.filter((c) => c.state.toLowerCase() === String(state).toLowerCase());
    }

    if (type && String(type).trim() && String(type) !== 'ALL') {
      list = list.filter((c) => c.type.toLowerCase() === String(type).toLowerCase());
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          c.place.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      crafts: list,
    });
  } catch (err) {
    console.error('Admin art craft records fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve art & craft records.' });
  }
});



