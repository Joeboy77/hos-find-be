import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Property } from '../models/Property';
import { RoomType, GenderType } from '../models/RoomType';

async function createSampleRoomTypes() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    const propertyRepository = AppDataSource.getRepository(Property);
    const roomTypeRepository = AppDataSource.getRepository(RoomType);
    
    const properties = await propertyRepository.find();
    
    for (const property of properties) {
      // Check if room types already exist for this property
      const existingRoomTypes = await roomTypeRepository.find({ where: { propertyId: property.id } });
      if (existingRoomTypes.length > 0) {
        console.log(`⏭️ Room types already exist for property: ${property.name}`);
        continue;
      }

      const roomTypeDataArray = [];

      // Create different room types based on property category
      if (property.category?.name?.toLowerCase().includes('hostel')) {
        roomTypeDataArray.push(
          {
            name: '4 in a Room - Male',
            description: 'Shared dormitory room for 4 male students',
            price: 1200, // Per semester
            currency: property.currency,
            genderType: GenderType.MALE,
            capacity: 4,
            roomTypeCategory: 'dormitory',
            isAvailable: true,
            availableRooms: 5,
            totalRooms: 8,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Shared Bathroom'],
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 1
          },
          {
            name: '4 in a Room - Female',
            description: 'Shared dormitory room for 4 female students',
            price: 1200, // Per semester
            currency: property.currency,
            genderType: GenderType.FEMALE,
            capacity: 4,
            roomTypeCategory: 'dormitory',
            isAvailable: true,
            availableRooms: 3,
            totalRooms: 6,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Shared Bathroom'],
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 2
          },
          {
            name: '2 in a Room - Male',
            description: 'Shared room for 2 male students',
            price: 1800, // Per semester
            currency: property.currency,
            genderType: GenderType.MALE,
            capacity: 2,
            roomTypeCategory: 'shared',
            isAvailable: true,
            availableRooms: 2,
            totalRooms: 4,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Private Bathroom'],
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 3
          },
          {
            name: '2 in a Room - Female',
            description: 'Shared room for 2 female students',
            price: 1800, // Per semester
            currency: property.currency,
            genderType: GenderType.FEMALE,
            capacity: 2,
            roomTypeCategory: 'shared',
            isAvailable: true,
            availableRooms: 2,
            totalRooms: 4,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Private Bathroom'],
            imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 4
          },
          {
            name: 'Private Room - Male',
            description: 'Private single room for male student',
            price: 3000, // Per semester
            currency: property.currency,
            genderType: GenderType.MALE,
            capacity: 1,
            roomTypeCategory: 'private',
            isAvailable: true,
            availableRooms: 1,
            totalRooms: 2,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'En-suite Bathroom', 'Air Conditioning'],
            imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 5
          },
          {
            name: 'Private Room - Female',
            description: 'Private single room for female student',
            price: 3000, // Per semester
            currency: property.currency,
            genderType: GenderType.FEMALE,
            capacity: 1,
            roomTypeCategory: 'private',
            isAvailable: true,
            availableRooms: 1,
            totalRooms: 2,
            amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'En-suite Bathroom', 'Air Conditioning'],
            imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 6
          }
        );
      } else if (property.category?.name?.toLowerCase().includes('hotel')) {
        roomTypeDataArray.push(
          {
            name: 'Standard Room',
            description: 'Comfortable standard room with essential amenities',
            price: property.price * 0.8,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 2,
            roomTypeCategory: 'standard',
            isAvailable: true,
            availableRooms: 10,
            totalRooms: 15,
            amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Room Service'],
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 1
          },
          {
            name: 'Deluxe Room',
            description: 'Spacious deluxe room with premium amenities',
            price: property.price,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 2,
            roomTypeCategory: 'deluxe',
            isAvailable: true,
            availableRooms: 5,
            totalRooms: 8,
            amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Room Service', 'Mini Bar', 'City View'],
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 2
          },
          {
            name: 'Suite',
            description: 'Luxury suite with separate living area',
            price: property.price * 1.5,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 4,
            roomTypeCategory: 'suite',
            isAvailable: true,
            availableRooms: 2,
            totalRooms: 3,
            amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Room Service', 'Mini Bar', 'Living Room', 'Balcony'],
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 3
          }
        );
      } else if (property.category?.name?.toLowerCase().includes('apartment')) {
        roomTypeDataArray.push(
          {
            name: 'Studio Apartment',
            description: 'Compact studio with kitchen and bathroom',
            price: property.price * 0.9,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 2,
            roomTypeCategory: 'studio',
            isAvailable: true,
            availableRooms: 3,
            totalRooms: 5,
            amenities: ['WiFi', 'Kitchen', 'Private Bathroom', 'Air Conditioning', 'Washing Machine'],
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 1
          },
          {
            name: '1 Bedroom Apartment',
            description: 'Spacious 1 bedroom apartment with separate living area',
            price: property.price,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 3,
            roomTypeCategory: '1bedroom',
            isAvailable: true,
            availableRooms: 2,
            totalRooms: 3,
            amenities: ['WiFi', 'Kitchen', 'Private Bathroom', 'Air Conditioning', 'Washing Machine', 'Balcony'],
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 2
          },
          {
            name: '2 Bedroom Apartment',
            description: 'Large 2 bedroom apartment perfect for families',
            price: property.price * 1.3,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 4,
            roomTypeCategory: '2bedroom',
            isAvailable: true,
            availableRooms: 1,
            totalRooms: 2,
            amenities: ['WiFi', 'Kitchen', '2 Bathrooms', 'Air Conditioning', 'Washing Machine', 'Balcony', 'Parking'],
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 3
          }
        );
      } else {
        // For homestay and guesthouse
        roomTypeDataArray.push(
          {
            name: 'Private Room',
            description: 'Comfortable private room with shared facilities',
            price: property.price * 0.9,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 2,
            roomTypeCategory: 'private',
            isAvailable: true,
            availableRooms: 2,
            totalRooms: 3,
            amenities: ['WiFi', 'Shared Kitchen', 'Shared Bathroom', 'Local Experience'],
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 1
          },
          {
            name: 'Family Room',
            description: 'Large room suitable for families',
            price: property.price * 1.2,
            currency: property.currency,
            genderType: GenderType.ANY,
            capacity: 4,
            roomTypeCategory: 'family',
            isAvailable: true,
            availableRooms: 1,
            totalRooms: 1,
            amenities: ['WiFi', 'Shared Kitchen', 'Private Bathroom', 'Local Experience', 'Garden Access'],
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
            propertyId: property.id,
            displayOrder: 2
          }
        );
      }

      // Create room types for this property
      for (const roomTypeData of roomTypeDataArray) {
        const newRoomType = new RoomType();
        Object.assign(newRoomType, roomTypeData);
        const savedRoomType = await roomTypeRepository.save(newRoomType);
        console.log(`✅ Created room type: ${savedRoomType.name} for ${property.name}`);
      }
    }

    console.log('✅ Sample room types created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample room types:', error);
    process.exit(1);
  }
}

createSampleRoomTypes(); 