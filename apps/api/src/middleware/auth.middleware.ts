import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'jojo-flora-super-secret-jwt-key';

export interface AuthenticatedUser {
  id?: string;
  username: string;
  email?: string;
  role?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware.
 * Checks for Bearer JWT token in Authorization header, or x-username / x-user-key header.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      next();
      return;
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  }

  // Fallback to x-username or x-user-key header if sent from client
  const fallbackUser = (req.headers['x-username'] ?? req.headers['x-user-key']) as
    | string
    | undefined;
  if (fallbackUser) {
    req.user = { username: fallbackUser };
    next();
    return;
  }

  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Optional authentication middleware.
 * Attaches user if token or username header is present, but doesn't block unauthenticated requests.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch {
      // Ignore invalid token on optional auth
    }
  } else {
    const fallbackUser = (req.headers['x-username'] ?? req.headers['x-user-key']) as
      | string
      | undefined;
    if (fallbackUser) {
      req.user = { username: fallbackUser };
    }
  }

  next();
}
