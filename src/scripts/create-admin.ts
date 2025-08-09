import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Admin, AdminRole } from '../models/Admin';
import dotenv from 'dotenv';

dotenv.config();

async function createSuperAdmin() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const adminRepository = AppDataSource.getRepository(Admin);

    // Check if admin already exists
    const existingAdmin = await adminRepository.findOne({
      where: { role: AdminRole.ADMIN }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      return;
    }

    // Create admin
    const admin = adminRepository.create({
      email: 'admin@hosfind.com',
      password: 'admin123456',
      fullName: 'Administrator',
      role: AdminRole.ADMIN,
      isActive: true
    });

    await adminRepository.save(admin);
    console.log('✅ Admin created successfully');
    console.log('📧 Email: admin@hosfind.com');
    console.log('🔑 Password: admin123456');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

createSuperAdmin(); 