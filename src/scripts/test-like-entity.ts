import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Like } from '../models/Like';
import dotenv from 'dotenv';

dotenv.config();

async function testLikeEntity() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const likeRepository = AppDataSource.getRepository(Like);
    console.log('✅ Like repository created successfully');

    // Test if we can query the likes table
    const likeCount = await likeRepository.count();
    console.log(`📊 Total likes in database: ${likeCount}`);

    // Test if we can create a like (without saving)
    const testLike = likeRepository.create({
      userId: 'test-user-id',
      propertyId: 'test-property-id'
    });
    console.log('✅ Test like object created successfully:', testLike);

    console.log('✅ Like entity is working correctly!');
  } catch (error) {
    console.error('❌ Error testing Like entity:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

testLikeEntity(); 