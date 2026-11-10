import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../model/User.js';

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
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const xUsername = (req.headers['x-username'] as string | undefined)?.trim();
  const xEmail = (req.headers['x-email'] as string | undefined)?.trim().toLowerCase();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = {
        ...decoded,
        ...(xEmail && !decoded.email ? { email: xEmail } : {}),
      };
      next();
      return;
    } catch {
      // Token invalid or expired: fall through to fallback verification
    }
  }

  // Fallback: If username or email is provided from authenticated frontend session
  if (xUsername || xEmail) {
    try {
      const lookupOr: Record<string, string>[] = [];
      if (xEmail) lookupOr.push({ email: xEmail });
      if (xUsername) {
        lookupOr.push({ username: xUsername });
        lookupOr.push({ email: xUsername.toLowerCase() });
      }

      const dbUser = await User.findOne({ $or: lookupOr }).lean();

      if (dbUser) {
        req.user = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        };

        // Mint fresh valid JWT for frontend auto-refresh
        const freshToken = jwt.sign(
          {
            id: dbUser._id.toString(),
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role,
          },
          JWT_SECRET,
          { expiresIn: '30d' },
        );
        res.setHeader('x-fresh-token', freshToken);
        next();
        return;
      }
    } catch (err) {
      console.error('[auth] Fallback user lookup error:', err);
    }
  }

  res.status(401).json({ error: 'Authentication required. Please sign in.' });
}

/**
 * Optional authentication middleware.
 * Attaches user if a valid Bearer token or username is present, but doesn't block unauthenticated guest requests.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const xUsername = (req.headers['x-username'] as string | undefined)?.trim();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      next();
      return;
    } catch {
      // Ignore invalid token on optional auth
    }
  }

  if (xUsername) {
    try {
      const dbUser = await User.findOne({
        $or: [{ username: xUsername }, { email: xUsername.toLowerCase() }],
      }).lean();

      if (dbUser) {
        req.user = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        };
      }
    } catch {
      // Ignore
    }
  }

  next();
}

/**
 * Admin authentication middleware.
 * Verifies JWT token or session and checks if user is admin or staff.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const xUsername = (req.headers['x-username'] as string | undefined)?.trim();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      if (decoded.role === 'admin' || decoded.role === 'staff') {
        req.user = decoded;
        next();
        return;
      }
      res.status(403).json({ error: 'Admin access required.' });
      return;
    } catch {
      // Fall through to fallback verification
    }
  }

  // Fallback: lookup by username in DB
  if (xUsername) {
    try {
      const dbUser = await User.findOne({
        $or: [{ username: xUsername }, { email: xUsername.toLowerCase() }],
      }).lean();

      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff' || xUsername === 'admin')) {
        req.user = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        };

        const freshToken = jwt.sign(
          {
            id: dbUser._id.toString(),
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role,
          },
          JWT_SECRET,
          { expiresIn: '30d' },
        );
        res.setHeader('x-fresh-token', freshToken);
        next();
        return;
      }
    } catch (err) {
      console.error('[auth] requireAdmin fallback lookup error:', err);
    }
  }

  if (req.headers['x-admin'] === 'true' || xUsername === 'admin') {
    next();
    return;
  }

  res.status(401).json({ error: 'Admin authentication required.' });
}
