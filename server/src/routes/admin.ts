import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

export const adminRouter = Router();

// Configure local multer storage in server/uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

      if (!title || !brief || !content || !creatorId || !categoryId) {
        res.status(400).json({ error: 'Title, brief, content, creator, and category are required.' });
        return;
      }

      const status = publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
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
          coverImage: coverImage || null,
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

// 2b. List all Literature for Admin Curation (Drafts, Published, Unpublished)
adminRouter.get(
  '/literature',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      const whereClause: any = {};
      if (status && ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(String(status).toUpperCase())) {
        whereClause.publicationStatus = String(status).toUpperCase();
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
        },
        orderBy: { updatedAt: 'desc' },
      });

      const enriched = literatures.map((item) => {
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
          publicationStatus: item.publicationStatus,
          publicationDate: item.publicationDate,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          creator: item.creator,
          category: item.category,
          tags: item.tags.map((t) => t.tag.name),
          totalRatingsCount,
          averageRating,
          totalSavesCount: item.saves.length,
          totalCommentsCount: item.comments.length,
        };
      });

      res.json({ literatures: enriched });
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
        if (publicationStatus === 'PUBLISHED' && !existing.publicationDate) {
          updateData.publicationDate = new Date();
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
