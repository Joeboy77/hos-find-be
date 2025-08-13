import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Like } from '../models/Like';
import { User } from '../models/User';
import { Property } from '../models/Property';
import dotenv from 'dotenv';

dotenv.config();

async function testServerLike() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Test if we can get repositories
    const likeRepository = AppDataSource.getRepository(Like);
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    console.log('✅ All repositories created successfully');

    // Test if we can query likes
    const likeCount = await likeRepository.count();
    console.log(`📊 Total likes in database: ${likeCount}`);

    // Test if we can query users
    const userCount = await userRepository.count();
    console.log(`📊 Total users in database: ${userCount}`);

    // Test if we can query properties
    const propertyCount = await propertyRepository.count();
    console.log(`📊 Total properties in database: ${propertyCount}`);

    // Test if we can create a like object (without saving)
    const testLike = likeRepository.create({
      userId: 'test-user-id',
      propertyId: 'test-property-id'
    });
    console.log('✅ Test like object created successfully:', testLike);

    console.log('✅ All like functionality is working correctly!');
  } catch (error) {
    console.error('❌ Error testing like functionality:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

testServerLike(); 