import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import { prisma } from './db.js';
export { prisma };
export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import os from 'os';

// Serve local cover uploads statically
const isVercel = !!process.env.VERCEL;
const uploadsPath = isVercel
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Routes
import { authRouter } from './routes/auth.js';
import { literatureRouter } from './routes/literature.js';
import { searchRouter } from './routes/search.js';
import { readerRouter } from './routes/reader.js';
import { adminRouter } from './routes/admin.js';
import { artCraftRouter } from './routes/artCraft.js';
import { aiRouter } from './routes/ai.js';
app.use('/api/auth', authRouter);
app.use('/api/literature', literatureRouter);
app.use('/api/search', searchRouter);
app.use('/api/reader', readerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/art-craft', artCraftRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'online',
      service: 'Classic Literature Application API',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Generic 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export for Vercel serverless functions
export default app;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[API Server] Running gracefully on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[API Server] Port ${PORT} is already in use. Please terminate the process using port ${PORT} or restart.`);
    } else {
      console.error('[API Server] Listen error:', err);
    }
  });
}

