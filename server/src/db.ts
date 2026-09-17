import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Global reference to prevent multiple instances during hot-reloading / serverless execution
declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

function getDatabaseUrl(): string {
  // If explicitly configured, use it
  if (process.env.DATABASE_URL && !process.env.VERCEL) {
    return process.env.DATABASE_URL;
  }

  // On Vercel Serverless Function runtime:
  // SQLite must be in a writable path or accessible bundled path.
  // We copy the bundled seed database to /tmp if not already present.
  const bundledDbPath = path.join(process.cwd(), 'server', 'prisma', 'dev.db');
  const fallbackBundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  
  const tmpDbPath = path.join(os.tmpdir(), 'dev.db');

  if (!fs.existsSync(tmpDbPath)) {
    let sourcePath = '';
    if (fs.existsSync(bundledDbPath)) {
      sourcePath = bundledDbPath;
    } else if (fs.existsSync(fallbackBundledDbPath)) {
      sourcePath = fallbackBundledDbPath;
    }

    if (sourcePath) {
      try {
        fs.copyFileSync(sourcePath, tmpDbPath);
        console.log(`[Database] Copied SQLite database from ${sourcePath} to ${tmpDbPath}`);
      } catch (err) {
        console.error(`[Database] Failed to copy SQLite database to tmp:`, err);
      }
    } else {
      console.warn(`[Database] Bundled dev.db not found at ${bundledDbPath} or ${fallbackBundledDbPath}`);
    }
  }

  // Return file: URI for tmp database if it exists, otherwise standard file:./dev.db
  if (fs.existsSync(tmpDbPath)) {
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = getDatabaseUrl();

export const prisma: PrismaClient =
  global.__db__ ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.__db__ = prisma;
}
