import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Admin } from '../models/Admin';

interface AdminRequest extends Request {
  admin?: Admin;
}

export const authenticateAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const adminRepository = AppDataSource.getRepository(Admin);
    
    const admin = await adminRepository.findOne({
      where: { id: decoded.adminId, isActive: true }
    });

    if (!admin) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdminRole = () => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ message: 'Admin authentication required' });
      return;
    }

    // All admins have the same level of access
    next();
  };
}; 