import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import emailService from '../services/emailService';
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

const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({
        where: { email: req.body.email }
      });
      if (existingUser) {
        const error = new Error('User with this email already exists') as AppError;
        error.statusCode = 409;
        return next(error);
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const user = userRepository.create({
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiresAt: verificationCodeExpiresAt,
        isEmailVerified: false
      });
      await userRepository.save(user);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail({
        email: user.email,
        fullName: user.fullName,
        verificationCode: verificationCode
      });

      if (!emailSent) {
        console.error('Failed to send verification email for user:', user.email);
        // Don't fail the signup, just log the error
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email for verification code.',
        data: {
          userId: user.id,
          email: user.email,
          requiresVerification: true
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
        where: { email: req.body.email }
      });
      if (!user) {
        const error = new Error('Invalid email or password') as AppError;
        error.statusCode = 401;
        return next(error);
      }
      const isValidPassword = await user.comparePassword(req.body.password);
      if (!isValidPassword) {
        const error = new Error('Invalid email or password') as AppError;
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
  },
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, verificationCode } = req.body;
      
      if (!email || !verificationCode) {
        const error = new Error('Email and verification code are required') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { email }
      });

      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      if (user.isEmailVerified) {
        const error = new Error('Email is already verified') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      if (!user.emailVerificationCode || !user.emailVerificationCodeExpiresAt) {
        const error = new Error('No verification code found. Please request a new one.') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      if (user.emailVerificationCodeExpiresAt < new Date()) {
        const error = new Error('Verification code has expired. Please request a new one.') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      if (user.emailVerificationCode !== verificationCode) {
        const error = new Error('Invalid verification code') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      // Verify the email
      user.isEmailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationCodeExpiresAt = null;
      await userRepository.save(user);

      // Generate tokens for the verified user
      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      await userRepository.save(user);

      res.json({
        success: true,
        message: 'Email verified successfully',
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
  async resendVerificationCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        const error = new Error('Email is required') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { email }
      });

      if (!user) {
        const error = new Error('User not found') as AppError;
        error.statusCode = 404;
        return next(error);
      }

      if (user.isEmailVerified) {
        const error = new Error('Email is already verified') as AppError;
        error.statusCode = 400;
        return next(error);
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.emailVerificationCode = verificationCode;
      user.emailVerificationCodeExpiresAt = verificationCodeExpiresAt;
      await userRepository.save(user);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail({
        email: user.email,
        fullName: user.fullName,
        verificationCode: verificationCode
      });

      if (!emailSent) {
        console.error('Failed to resend verification email for user:', user.email);
        const error = new Error('Failed to send verification email') as AppError;
        error.statusCode = 500;
        return next(error);
      }

      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}; 