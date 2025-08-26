import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Admin, AdminRole } from '../models/Admin';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { RoomType } from '../models/RoomType';
import { Like } from '../models/Like';
import { Notification } from '../models/Notification';

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');

    // Synchronize all entities (create tables)
    console.log('📊 Creating database tables...');
    await AppDataSource.synchronize(true); // true = drop existing tables and recreate
    console.log('✅ All tables created successfully!');

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const adminRepository = AppDataSource.getRepository(Admin);
    
    const existingAdmin = await adminRepository.findOne({ 
      where: { email: 'admin@hosfind.com' } 
    });

    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      const admin = adminRepository.create({
        email: 'admin@hosfind.com',
        password: hashedPassword,
        fullName: 'HosFind Admin',
        role: AdminRole.ADMIN,
        isActive: true
      });

      await adminRepository.save(admin);
      console.log('✅ Default admin user created!');
      console.log('📧 Email: admin@hosfind.com');
      console.log('🔑 Password: admin123456');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create some sample categories
    console.log('🏷️ Creating sample categories...');
    const categoryRepository = AppDataSource.getRepository(Category);
    
    const sampleCategories = [
      {
        name: 'hostels',
        description: 'Affordable accommodation for students and travelers',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        type: 'hostel',
        isActive: true,
        displayOrder: 1
      },
      {
        name: 'apartments',
        description: 'Comfortable apartments for long-term stays',
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        type: 'apartment',
        isActive: true,
        displayOrder: 2
      },
      {
        name: 'guesthouses',
        description: 'Cozy guesthouses with local charm',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        type: 'guesthouse',
        isActive: true,
        displayOrder: 3
      }
    ];

    for (const categoryData of sampleCategories) {
      const existingCategory = await categoryRepository.findOne({ 
        where: { name: categoryData.name } 
      });
      
      if (!existingCategory) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        console.log(`ℹ️ Category already exists: ${categoryData.name}`);
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('🌐 Your HosFind backend is ready to use!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase }; 