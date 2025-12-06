import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserSchema() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  let dbConfig: any;
  if (isProduction) {
    dbConfig = {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      extra: {
        ssl: {
          rejectUnauthorized: false,
          require: true
        }
      },
      synchronize: false,
      logging: false,
    };
  } else {
    dbConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'hosfind',
      synchronize: false,
      logging: false,
      ssl: false,
    };
  }

  const dataSource = new DataSource(dbConfig);

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = dataSource.createQueryRunner();
    
    console.log('🔧 Fixing users table schema...');
    
    // Check if phoneNumber column exists and has NOT NULL constraint
    const phoneNumberCheck = await queryRunner.query(`
      SELECT 
        column_name, 
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phoneNumber'
    `);

    if (phoneNumberCheck.length > 0) {
      const isNullable = phoneNumberCheck[0].is_nullable === 'YES';
      
      if (!isNullable) {
        console.log('📝 Making phoneNumber nullable...');
        await queryRunner.query(`
          ALTER TABLE users 
          ALTER COLUMN "phoneNumber" DROP NOT NULL
        `);
        console.log('✅ phoneNumber is now nullable');
      } else {
        console.log('✅ phoneNumber is already nullable');
      }
    } else {
      console.log('⚠️  phoneNumber column not found');
    }

    // Check if location column exists and remove it
    const locationCheck = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'location'
    `);

    if (locationCheck.length > 0) {
      console.log('📝 Removing location column...');
      
      // First, drop any indexes on location
      try {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_users_location"
        `);
      } catch (e) {
        // Index might not exist, that's okay
      }
      
      // Drop the column
      await queryRunner.query(`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS location
      `);
      console.log('✅ location column removed');
    } else {
      console.log('✅ location column does not exist');
    }

    // Check if there's a unique constraint on phoneNumber and remove it if it exists
    const uniqueConstraintCheck = await queryRunner.query(`
      SELECT 
        conname as constraint_name
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
      AND contype = 'u'
      AND conname LIKE '%phoneNumber%'
    `);

    if (uniqueConstraintCheck.length > 0) {
      console.log('📝 Removing unique constraint on phoneNumber...');
      for (const constraint of uniqueConstraintCheck) {
        await queryRunner.query(`
          ALTER TABLE users 
          DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"
        `);
      }
      console.log('✅ Unique constraint on phoneNumber removed');
    } else {
      console.log('✅ No unique constraint on phoneNumber');
    }

    await queryRunner.release();
    await dataSource.destroy();
    
    console.log('\n✅ Database schema fixed successfully!');
    console.log('📋 Summary:');
    console.log('   - phoneNumber is now nullable');
    console.log('   - location column removed (if it existed)');
    console.log('   - Unique constraint on phoneNumber removed');
    
  } catch (error) {
    console.error('❌ Error fixing user schema:', error);
    process.exit(1);
  }
}

fixUserSchema();

