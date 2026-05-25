import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

declare global {
  namespace Express {
    interface Request {
      user?: {
        wallet: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { wallet: string };
    req.user = { wallet: decoded.wallet.toLowerCase() };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Expired or invalid token' });
    return;
  }
}

export function generateToken(wallet: string): string {
  return jwt.sign({ wallet: wallet.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
}
