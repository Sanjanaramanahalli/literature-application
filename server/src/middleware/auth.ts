import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'classic_literature_super_secret_jwt_key_2026';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired session token.' });
      return;
    }
    req.user = decoded;
    next();
  });
};

export const requireRole = (requiredRole: 'ADMIN' | 'READER') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Please sign in.' });
      return;
    }
    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: `Access denied. Requires ${requiredRole} role.` });
      return;
    }
    next();
  };
};
