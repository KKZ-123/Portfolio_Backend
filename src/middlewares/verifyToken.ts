import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request interface so req.user is accessible on all standard Request objects
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Optional strictly-typed request interface
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Express middleware that verifies the JWT token from the Authorization header.
 * - Extracts token from "Authorization: Bearer <token>" (or raw token)
 * - Validates token signature and expiration
 * - Rejects missing, expired, or invalid tokens with a 401 status
 * - Attaches decoded token payload to `req.user` for downstream handlers
 */
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string | undefined);

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No authorization token provided.',
      });
      return;
    }

    // Support both "Bearer <token>" and bare token formats
    let token = authHeader.trim();
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. Malformed authorization header.',
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach decoded user data to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message_code : 401,
        error: 'Unauthorized',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token. Authentication failed.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed. Unable to verify token.',
    });
    return;
  }
};
