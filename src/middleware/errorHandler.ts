import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('🚨 [ERROR HANDLER] Error handler triggered');
  console.log('🚨 [ERROR HANDLER] Request URL:', req.url);
  console.log('🚨 [ERROR HANDLER] Request method:', req.method);
  console.log('🚨 [ERROR HANDLER] Error message:', err.message);
  console.log('🚨 [ERROR HANDLER] Error status code:', err.statusCode);
  console.log('🚨 [ERROR HANDLER] Error name:', err.name);
  let error = { ...err };
  error.message = err.message;
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  if (err.name === 'QueryFailedError') {
    const message = 'Database operation failed';
    error = { message, statusCode: 400 } as AppError;
  }
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    error = { message, statusCode: 400 } as AppError;
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 } as AppError;
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 } as AppError;
  }
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}; 