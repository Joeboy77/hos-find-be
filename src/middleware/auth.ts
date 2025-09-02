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
//FIXME: ENHANCE
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Access token is required') as AppError;
      error.statusCode = 401;
      return next(error);
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = decoded;
      next();
    } catch (error) {
      const errorObj = new Error('Invalid or expired access token') as AppError;
      errorObj.statusCode = 401;
      return next(errorObj);
    }
  } catch (error) {
    next(error);
  }
}; 