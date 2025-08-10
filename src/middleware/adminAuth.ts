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
  console.log('🔐 [ADMIN AUTH] Starting authentication for:', req.method, req.path);
  console.log('🔐 [ADMIN AUTH] Request headers:', req.headers);
  console.log('🔐 [ADMIN AUTH] Request URL:', req.url);
  console.log('🔐 [ADMIN AUTH] Request original URL:', req.originalUrl);
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 [ADMIN AUTH] Authorization header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 [ADMIN AUTH] Extracted token:', token ? 'EXISTS' : 'NOT FOUND');
    if (!token) {
      console.log('❌ [ADMIN AUTH] No token found, sending 401');
      res.status(401).json({ message: 'Access token required' });
      return;
    }
    console.log('🔐 [ADMIN AUTH] Token found, verifying JWT...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('🔐 [ADMIN AUTH] JWT decoded successfully:', { id: decoded.id, email: decoded.email, type: decoded.type });
    if (decoded.type !== 'admin') {
      console.log('❌ [ADMIN AUTH] Token is not an admin token, type:', decoded.type);
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }
    console.log('🔐 [ADMIN AUTH] Looking up admin in database...');
    const adminRepository = AppDataSource.getRepository(Admin);
    const admin = await adminRepository.findOne({
      where: { id: decoded.id, isActive: true }
    });
    if (!admin) {
      console.log('❌ [ADMIN AUTH] Admin not found or inactive');
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    console.log('✅ [ADMIN AUTH] Admin authenticated successfully:', { id: admin.id, email: admin.email });
    req.admin = admin;
    next();
  } catch (error) {
    console.error('❌ [ADMIN AUTH] Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
export const requireAdminRole = () => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    console.log('🔐 [ADMIN ROLE] Checking admin role for:', req.method, req.path);
    console.log('🔐 [ADMIN ROLE] Admin object exists:', !!req.admin);
    if (!req.admin) {
      console.log('❌ [ADMIN ROLE] No admin object found');
      res.status(401).json({ message: 'Admin authentication required' });
      return;
    }
    console.log('✅ [ADMIN ROLE] Admin role check passed');
    next();
  };
}; 