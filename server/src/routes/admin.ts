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

// 1. Upload Cover Image
adminRouter.post(
  '/upload-cover',
  authenticateToken,
  requireRole('ADMIN'),
  upload.single('coverImage'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded.' });
        return;
      }
      const coverUrl = `/uploads/${req.file.filename}`;
      res.json({ message: 'Cover uploaded successfully.', coverUrl });
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

// 5. Real-Time Admin Dashboard with 8 Live KPI Cards & Analytics
adminRouter.get(
  '/dashboard/kpis',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
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

      // 4. Registered Readers (strictly excluding Admins)
      const registeredReaders = await prisma.user.count({
        where: { role: 'READER' },
      });

      // 5. Total Ratings
      const totalRatings = await prisma.rating.count();

      // 6. Average Rating
      const allRatings = await prisma.rating.findMany({ select: { value: true } });
      const averageRating =
        allRatings.length > 0
          ? Number((allRatings.reduce((acc, r) => acc + r.value, 0) / allRatings.length).toFixed(1))
          : 0;

      // 7. Total Comments (Comments + Replies)
      const totalComments = await prisma.comment.count();

      // 8. Total Saves
      const totalSaves = await prisma.save.count();

      // Secondary Analytics: Recent Activity
      const recentComments = await prisma.comment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, role: true } },
          literature: { select: { title: true } },
        },
      });

      const recentLiterature = await prisma.literature.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { creator: true, category: true },
      });

      res.json({
        kpis: {
          totalLiterature,
          publishedLiterature,
          draftLiterature,
          registeredReaders,
          totalRatings,
          averageRating,
          totalComments,
          totalSaves,
        },
        recentComments,
        recentLiterature,
      });
    } catch (err) {
      console.error('Admin KPI fetch error:', err);
      res.status(500).json({ error: 'Failed to retrieve dashboard analytics.' });
    }
  }
);
