import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { Like } from '../models/Like';
import dotenv from 'dotenv';
dotenv.config();
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hosfind',
  synchronize: process.env.NODE_ENV === 'development', 
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Admin, Category, Property, RoomType, Like],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
export default AppDataSource; 