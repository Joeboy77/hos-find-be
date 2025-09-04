import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import likeRoutes from './routes/likes';
import notificationRoutes from './routes/notifications';
import bookingRoutes from './routes/booking';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  console.log('🌐 [GLOBAL] Request:', req.method, req.originalUrl);
  console.log('🌐 [GLOBAL] Path:', req.path);
  console.log('🌐 [GLOBAL] Base URL:', req.baseUrl);
  next();
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HosFind Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.post('/test-admin-login', (req, res) => {
  console.log('🧪 [TEST] Test route hit');
  console.log('🧪 [TEST] Request body:', req.body);
  console.log('🧪 [TEST] Request headers:', req.headers);
  res.json({ message: 'Test route working', body: req.body });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
startServer(); 