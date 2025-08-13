import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function removeGenderColumn() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the gender column exists
      const tableExists = await queryRunner.hasTable('users');
      if (!tableExists) {
        console.log('❌ Users table does not exist');
        return;
      }

      const columns = await queryRunner.getTable('users');
      const genderColumnExists = columns?.findColumnByName('gender');
      
      if (genderColumnExists) {
        console.log('🗑️  Removing gender column from users table...');
        await queryRunner.query('ALTER TABLE users DROP COLUMN gender');
        console.log('✅ Gender column removed successfully');
      } else {
        console.log('ℹ️  Gender column does not exist, skipping...');
      }

      await queryRunner.commitTransaction();
      console.log('✅ Migration completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Failed to remove gender column:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

removeGenderColumn(); 