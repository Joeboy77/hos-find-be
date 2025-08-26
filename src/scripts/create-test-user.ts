import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if test user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'test@hosfind.com' }
    });

    if (existingUser) {
      console.log('⚠️  Test user already exists:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.fullName}`);
      console.log(`   Active: ${existingUser.isActive ? '✅' : '❌'}`);
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = userRepository.create({
      fullName: 'Test User',
      email: 'test@hosfind.com',
      phoneNumber: '+233123456789',
      password: hashedPassword,
      location: 'Accra, Ghana',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true
    });

    const savedUser = await userRepository.save(testUser);

    console.log('✅ Test user created successfully:');
    console.log(`   ID: ${savedUser.id}`);
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   Name: ${savedUser.fullName}`);
    console.log(`   Phone: ${savedUser.phoneNumber}`);
    console.log(`   Password: password123`);
    console.log(`   Active: ${savedUser.isActive ? '✅' : '❌'}`);
    
    console.log('\n📱 Mobile App Instructions:');
    console.log('1. Clear the mobile app data/storage');
    console.log('2. Log in with these credentials:');
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   Password: password123`);
    console.log('3. The profile screen should now work correctly');

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser(); 