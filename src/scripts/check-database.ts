import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check if all tables exist
      const tables = ['users', 'admins', 'categories', 'properties', 'room_types', 'likes'];
      
      for (const table of tables) {
        const exists = await queryRunner.hasTable(table);
        console.log(`📋 Table '${table}': ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (exists) {
          const columns = await queryRunner.getTable(table);
          console.log(`   Columns: ${columns?.columns.map(col => col.name).join(', ')}`);
        }
      }

      // Check if likes table has the correct structure
      const likesTable = await queryRunner.getTable('likes');
      if (likesTable) {
        console.log('\n🔍 Likes table structure:');
        likesTable.columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type}`);
        });
      }

      // Test if we can query the likes table
      try {
        const likeCount = await queryRunner.query('SELECT COUNT(*) FROM likes');
        console.log(`\n📊 Total likes in database: ${likeCount[0].count}`);
      } catch (error) {
        console.log(`\n❌ Error querying likes table: ${error}`);
      }

    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

checkDatabase(); 