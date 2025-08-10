import { AppDataSource } from '../config/database';
async function setupDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');
    console.log('📊 Database name:', AppDataSource.options.database);
    if (AppDataSource.options.type === 'postgres') {
      const options = AppDataSource.options as any;
      console.log('🏠 Database host:', options.host);
      console.log('🚪 Database port:', options.port);
    }
    const result = await AppDataSource.query('SELECT NOW() as current_time');
    console.log('⏰ Database time:', result[0].current_time);
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}
if (require.main === module) {
  setupDatabase();
}
export { setupDatabase }; 