import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function createLikesTable() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    // Create likes table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        "propertyId" UUID NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "propertyId"),
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Likes table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating likes table:', error);
    process.exit(1);
  }
}

createLikesTable(); 