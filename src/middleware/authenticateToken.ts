import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        phoneNumber: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const error = new Error('Access token required') as AppError;
    error.statusCode = 401;
    return next(error);
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phoneNumber: decoded.phoneNumber
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const jwtError = new Error('Invalid token') as AppError;
      jwtError.statusCode = 401;
      return next(jwtError);
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      const expiredError = new Error('Token expired') as AppError;
      expiredError.statusCode = 401;
      return next(expiredError);
    }

    const unknownError = new Error('Token verification failed') as AppError;
    unknownError.statusCode = 401;
    return next(unknownError);
  }
}; 