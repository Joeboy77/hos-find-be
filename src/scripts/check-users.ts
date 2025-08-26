import { AppDataSource } from '../config/database';
import { User } from '../models/User';

async function checkUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      select: ['id', 'email', 'fullName', 'phoneNumber', 'isActive', 'createdAt']
    });

    console.log(`\n📊 Found ${users.length} users in database:`);
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\n💡 Solution: You need to register a new user or restore user data');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.fullName || 'N/A'}`);
        console.log(`   Phone: ${user.phoneNumber || 'N/A'}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('   ' + '-'.repeat(60));
      });
    }

    // Check for the specific user ID from the error
    const specificUserId = 'a47d0c3f-e661-477f-a75b-4f0e7dc986f0';
    const specificUser = await userRepository.findOne({
      where: { id: specificUserId }
    });

    console.log(`\n🔍 Looking for specific user ID: ${specificUserId}`);
    if (specificUser) {
      console.log('✅ User found!');
      console.log(`   Email: ${specificUser.email}`);
      console.log(`   Name: ${specificUser.fullName || 'N/A'}`);
      console.log(`   Active: ${specificUser.isActive ? '✅' : '❌'}`);
    } else {
      console.log('❌ User not found in database');
      console.log('\n💡 This explains the "User not found" error on mobile app');
      console.log('💡 The JWT token contains a user ID that no longer exists');
    }

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers(); 