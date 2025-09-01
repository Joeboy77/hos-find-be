import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { Like } from '../models/Like';
import { Notification } from '../models/Notification';
// import { RegionalSection } from '../models/RegionalSection';
import dotenv from 'dotenv';
dotenv.config();

// Database configuration for migrations
const isProduction = process.env.NODE_ENV === 'production';

let dbConfig: any;

if (isProduction) {
  // Production: Use DATABASE_URL
  dbConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
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
    entities: [User, Admin, Category, Property, RoomType, Like, Notification],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
  };
} else {
  // Development: Use individual environment variables
  dbConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hosfind',
    synchronize: false,
    logging: true,
    ssl: false,
    entities: [User, Admin, Category, Property, RoomType, Like, Notification],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
  };
}

const AppDataSource = new DataSource(dbConfig);
export default AppDataSource;