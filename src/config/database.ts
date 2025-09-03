import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { Like } from '../models/Like';
import { Notification } from '../models/Notification';
import { RegionalSection } from '../models/RegionalSection';
import dotenv from 'dotenv';
dotenv.config();

// Database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';

let dbConfig: any;

if (isProduction) {
  // Production: Use DATABASE_URL
  dbConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false, // Never auto-sync in production
    logging: false,
    ssl: {
      rejectUnauthorized: false,
      require: true
    },
    extra: {
      ssl: {
        rejectUnauthorized: false,
        require: true
      }
    },
    entities: [User, Admin, Category, Property, RoomType, Like, Notification, RegionalSection],
    migrations: ['dist/migrations/*.js'], // Use compiled JS files in production
    subscribers: ['dist/subscribers/*.js'], // Use compiled JS files in production
  };
  
  console.log('🔧 [DATABASE] Production mode - Using DATABASE_URL');
  console.log('🔧 [DATABASE] DATABASE_URL exists:', !!process.env.DATABASE_URL);
} else {
  // Development: Use individual environment variables
  dbConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hosfind',
    synchronize: true, // Auto-sync in development
    logging: true,
    ssl: false,
    entities: [User, Admin, Category, Property, RoomType, Like, Notification, RegionalSection],
    migrations: ['src/migrations/*.ts'], // Use TypeScript files in development
    subscribers: ['src/subscribers/*.ts'], // Use TypeScript files in development
  };
  
  console.log('🔧 [DATABASE] Development mode - Using local PostgreSQL');
}

const AppDataSource = new DataSource(dbConfig);
export { AppDataSource };
export default AppDataSource; 