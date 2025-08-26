import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
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
  console.log('🔐 [AUTH] Starting token authentication');
  console.log('🔐 [AUTH] Request URL:', req.url);
  console.log('🔐 [AUTH] Request method:', req.method);
  
  const authHeader = req.headers.authorization;
  console.log('🔐 [AUTH] Authorization header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1]; 
  console.log('🔐 [AUTH] Extracted token:', token ? 'EXISTS' : 'NOT FOUND');
  
  if (!token) {
    console.log('❌ [AUTH] No token found');
    const error = new Error('Access token required') as AppError;
    error.statusCode = 401;
    return next(error);
  }
  
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.log('❌ [AUTH] JWT secret not configured');
      throw new Error('JWT secret not configured');
    }
    
    console.log('🔐 [AUTH] Verifying JWT token...');
    const decoded = jwt.verify(token, secret) as any;
    console.log('🔐 [AUTH] JWT decoded successfully:', decoded);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phoneNumber: decoded.phoneNumber
    };
    
    console.log('✅ [AUTH] User authenticated:', req.user);
    next();
  } catch (error) {
    console.error('❌ [AUTH] Token verification failed:', error);
    
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