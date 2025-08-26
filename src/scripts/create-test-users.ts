import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const userRepository = AppDataSource.getRepository(User);
    
    // Check if test users already exist
    const existingUsers = await userRepository.find();
    if (existingUsers.length > 0) {
      console.log(`⚠️  Found ${existingUsers.length} existing users`);
      console.log('Test users already exist. Skipping creation.');
      return;
    }

    const testUsers = [
      {
        fullName: 'Test User 1',
        email: 'testuser1@example.com',
        password: 'password123',
        phoneNumber: '+233201234567',
        location: 'Accra, Ghana',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      },
      {
        fullName: 'Test User 2',
        email: 'testuser2@example.com',
        password: 'password123',
        phoneNumber: '+233201234568',
        location: 'Kumasi, Ghana',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      },
      {
        fullName: 'Test User 3',
        email: 'testuser3@example.com',
        password: 'password123',
        phoneNumber: '+233201234569',
        location: 'Cape Coast, Ghana',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      }
    ];

    console.log('👥 Creating test users...');
    
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = userRepository.create({
        ...userData,
        password: hashedPassword
      });
      
      await userRepository.save(user);
      console.log(`✅ Created user: ${user.fullName} (${user.email})`);
    }

    console.log(`🎉 Successfully created ${testUsers.length} test users`);
    console.log('\n📱 Test User Credentials:');
    console.log('Email: testuser1@example.com | Password: password123');
    console.log('Email: testuser2@example.com | Password: password123');
    console.log('Email: testuser3@example.com | Password: password123');
    console.log('\n💡 Use these credentials to test the mobile app and notifications!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

createTestUsers(); 