import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const windowMs = 5 * 60 * 1000; // 5 minutes
const maxRequestsPerWindow = 30; // 30 AI requests per 5 minutes per user/IP
const ipRateMap = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRateMap.entries()) {
    if (now > record.resetTime) {
      ipRateMap.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Sliding window rate limiter for AI operations
 */
export const aiRateLimiter = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const identifier = req.user?.userId || req.ip || req.socket.remoteAddress || 'anonymous-client';
  const now = Date.now();

  const record = ipRateMap.get(identifier);

  if (!record || now > record.resetTime) {
    ipRateMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (record.count >= maxRequestsPerWindow) {
    res.status(429).json({
      error: 'AI service is experiencing high demand. Please wait a moment before trying again.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
};

const MAX_INPUT_LENGTH = 15000;

/**
 * Validates payload size and sanitizes sensitive fields before reaching AI model
 */
export const validateAiInput = (req: Request, res: Response, next: NextFunction): void => {
  const body = req.body || {};

  const textFields = ['content', 'text', 'section', 'materials', 'makingProcess'];
  for (const field of textFields) {
    if (body[field] && typeof body[field] === 'string' && body[field].length > MAX_INPUT_LENGTH) {
      res.status(400).json({
        error: `Submitted content for "${field}" exceeds the maximum permissible limit of ${MAX_INPUT_LENGTH} characters.`,
      });
      return;
    }
  }

  // Sanitize: ensure no passwords, tokens, or private user data are forwarded
  const sanitizedBody = { ...body };
  delete (sanitizedBody as any).password;
  delete (sanitizedBody as any).passwordHash;
  delete (sanitizedBody as any).token;
  delete (sanitizedBody as any).otp;
  delete (sanitizedBody as any).apiKey;
  delete (sanitizedBody as any).secret;

  req.body = sanitizedBody;
  next();
};
