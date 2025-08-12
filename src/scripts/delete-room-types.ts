import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { RoomType } from '../models/RoomType';

async function deleteAllRoomTypes() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    const roomTypeRepository = AppDataSource.getRepository(RoomType);
    
    // Delete all room types
    const result = await roomTypeRepository.createQueryBuilder().delete().execute();
    console.log(`✅ Deleted ${result.affected} room types`);
    
    console.log('✅ All room types deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting room types:', error);
    process.exit(1);
  }
}

deleteAllRoomTypes(); 