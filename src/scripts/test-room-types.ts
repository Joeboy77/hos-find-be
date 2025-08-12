import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Property, PropertyType } from '../models/Property';
import { RoomType, GenderType } from '../models/RoomType';

async function testRoomTypes() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    const propertyRepository = AppDataSource.getRepository(Property);
    const roomTypeRepository = AppDataSource.getRepository(RoomType);
    
    // Get the first hostel property
    const hostelProperty = await propertyRepository.findOne({ 
      where: { propertyType: PropertyType.HOSTEL } 
    });
    
    if (!hostelProperty) {
      console.log('❌ No hostel property found');
      return;
    }

    console.log(`Found hostel: ${hostelProperty.name}`);

    // Create a simple room type
    const roomType = new RoomType();
    roomType.name = '4 in a Room - Male';
    roomType.description = 'Shared dormitory room for 4 male students';
    roomType.price = 96;
    roomType.currency = '₵';
    roomType.genderType = GenderType.MALE;
    roomType.capacity = 4;
    roomType.roomTypeCategory = 'dormitory';
    roomType.isAvailable = true;
    roomType.availableRooms = 5;
    roomType.totalRooms = 8;
    roomType.amenities = ['WiFi', 'Study Desk', 'Wardrobe', 'Shared Bathroom'];
    roomType.imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
    roomType.propertyId = hostelProperty.id;
    roomType.displayOrder = 1;

    const savedRoomType = await roomTypeRepository.save(roomType);
    console.log(`✅ Created room type: ${savedRoomType.name} for ${hostelProperty.name}`);
    console.log(`Room type ID: ${savedRoomType.id}`);

    // Test fetching room types for the property
    const roomTypes = await roomTypeRepository.find({ 
      where: { propertyId: hostelProperty.id } 
    });
    console.log(`Found ${roomTypes.length} room types for ${hostelProperty.name}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRoomTypes(); 