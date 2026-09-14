import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();
export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve local cover uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
import { authRouter } from './routes/auth.js';
import { literatureRouter } from './routes/literature.js';
import { searchRouter } from './routes/search.js';
import { readerRouter } from './routes/reader.js';
import { adminRouter } from './routes/admin.js';
app.use('/api/auth', authRouter);
app.use('/api/literature', literatureRouter);
app.use('/api/search', searchRouter);
app.use('/api/reader', readerRouter);
app.use('/api/admin', adminRouter);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Server] Running gracefully on http://localhost:${PORT}`);
  });
}
