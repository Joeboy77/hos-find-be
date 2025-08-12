import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber
    },
    process.env.JWT_SECRET!,
    { expiresIn: '90d' }
  );
  const refreshToken = jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '180d' }
  );
  return { accessToken, refreshToken };
};
export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({
        where: [
          { email: req.body.email },
          { phoneNumber: req.body.phoneNumber }
        ]
      });
      if (existingUser) {
        const error = new Error('User with this email or phone number already exists') as AppError;
        error.statusCode = 409;
        return next(error);
      }
      const user = userRepository.create({
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber,
        location: req.body.location,
        gender: req.body.gender
      });
      await userRepository.save(user);
      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      await userRepository.save(user);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: user.toPublicJSON(),
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { phoneNumber: req.body.phoneNumber }
      });
      if (!user) {
        const error = new Error('Invalid phone number or password') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const isValidPassword = await user.comparePassword(req.body.password);
      if (!isValidPassword) {
        const error = new Error('Invalid phone number or password') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      user.lastLoginAt = new Date();
      await userRepository.save(user);
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toPublicJSON(),
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        const error = new Error('Refresh token is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      if (decoded.type !== 'refresh') {
        const error = new Error('Invalid refresh token') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.id }
      });
      if (!user || user.refreshToken !== refreshToken) {
        const error = new Error('Invalid refresh token') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
        const error = new Error('Refresh token expired') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        process.env.JWT_SECRET!,
        { expiresIn: '90d' }
      );
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user.toPublicJSON(),
          tokens: {
            accessToken,
            refreshToken: user.refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.id) {
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.update(req.user.id, {
          refreshToken: null as any,
          refreshTokenExpiresAt: null as any
        });
      }
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}; 