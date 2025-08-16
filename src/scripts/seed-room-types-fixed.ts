import { AppDataSource } from '../config/database';
import { Property } from '../models/Property';
import { RoomType, GenderType } from '../models/RoomType';

async function seedRoomTypes() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const propertyRepository = AppDataSource.getRepository(Property);
    const roomTypeRepository = AppDataSource.getRepository(RoomType);

    const properties = await propertyRepository.find();
    console.log(`Found ${properties.length} properties to seed room types for`);

    for (const property of properties) {
      console.log(`Seeding room types for property: ${property.name}`);

      const roomTypesData = getRoomTypesForProperty(property.propertyType);

      for (const roomTypeData of roomTypesData) {
        const existingRoomType = await roomTypeRepository.findOne({
          where: {
            name: roomTypeData.name,
            propertyId: property.id
          }
        });

        if (!existingRoomType) {
          const roomType = roomTypeRepository.create({
            name: roomTypeData.name,
            description: roomTypeData.description,
            price: roomTypeData.price,
            currency: roomTypeData.currency,
            genderType: roomTypeData.genderType,
            capacity: roomTypeData.capacity,
            roomTypeCategory: roomTypeData.roomTypeCategory,
            isAvailable: roomTypeData.isAvailable,
            availableRooms: roomTypeData.availableRooms,
            totalRooms: roomTypeData.totalRooms,
            amenities: roomTypeData.amenities,
            imageUrl: roomTypeData.imageUrl,
            propertyId: property.id,
            displayOrder: roomTypeData.displayOrder,
            isActive: roomTypeData.isActive
          });

          await roomTypeRepository.save(roomType);
          console.log(`Created room type: ${roomType.name} for ${property.name}`);
        } else {
          console.log(`Room type ${roomTypeData.name} already exists for ${property.name}`);
        }
      }
    }

    console.log('Room types seeding completed successfully');
  } catch (error) {
    console.error('Error seeding room types:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

function getRoomTypesForProperty(propertyType: string) {
  const baseRoomTypes = {
    hostel: [
      {
        name: '4 in a Room',
        description: 'Comfortable shared room with 4 beds, perfect for students and budget travelers. Each bed comes with its own storage space and reading light.',
        price: 150,
        currency: '₵',
        genderType: GenderType.MIXED,
        capacity: 4,
        roomTypeCategory: 'hostel',
        isAvailable: true,
        availableRooms: 3,
        totalRooms: 5,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Study Desk',
          'Wardrobe',
          'Shared Bathroom',
          '24/7 Security',
          'Laundry Service',
          'Common Kitchen'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        displayOrder: 1,
        isActive: true
      },
      {
        name: '2 in a Room',
        description: 'Cozy shared room with 2 beds, offering more privacy while still being budget-friendly. Ideal for friends or roommates.',
        price: 200,
        currency: '₵',
        genderType: GenderType.MIXED,
        capacity: 2,
        roomTypeCategory: 'hostel',
        isAvailable: true,
        availableRooms: 2,
        totalRooms: 3,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Study Desk',
          'Wardrobe',
          'Shared Bathroom',
          '24/7 Security',
          'Laundry Service',
          'Common Kitchen',
          'Balcony'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        displayOrder: 2,
        isActive: true
      },
      {
        name: 'Single Room',
        description: 'Private single room with all amenities. Perfect for those who prefer privacy and quiet study environment.',
        price: 350,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 1,
        roomTypeCategory: 'hostel',
        isAvailable: true,
        availableRooms: 1,
        totalRooms: 2,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Study Desk',
          'Wardrobe',
          'Private Bathroom',
          '24/7 Security',
          'Laundry Service',
          'Common Kitchen',
          'Balcony',
          'Mini Fridge'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        displayOrder: 3,
        isActive: true
      }
    ],
    hotel: [
      {
        name: 'Standard Room',
        description: 'Comfortable standard hotel room with modern amenities and professional service.',
        price: 500,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 2,
        roomTypeCategory: 'hotel',
        isAvailable: true,
        availableRooms: 5,
        totalRooms: 8,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'TV',
          'Private Bathroom',
          'Room Service',
          'Daily Housekeeping',
          'Mini Bar',
          'Safe',
          'Balcony'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Deluxe Room',
        description: 'Spacious deluxe room with premium amenities and beautiful city views.',
        price: 750,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 3,
        roomTypeCategory: 'hotel',
        isAvailable: true,
        availableRooms: 2,
        totalRooms: 3,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'TV',
          'Private Bathroom',
          'Room Service',
          'Daily Housekeeping',
          'Mini Bar',
          'Safe',
          'Balcony',
          'City View',
          'King Size Bed'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        displayOrder: 2,
        isActive: true
      }
    ],
    homestay: [
      {
        name: 'Family Room',
        description: 'Warm and welcoming family room in a local home, offering authentic cultural experience.',
        price: 300,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 4,
        roomTypeCategory: 'homestay',
        isAvailable: true,
        availableRooms: 1,
        totalRooms: 1,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Home-cooked Meals',
          'Private Bathroom',
          'Local Host',
          'Cultural Experience',
          'Garden Access',
          'Kitchen Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Guest Room',
        description: 'Cozy guest room in a family home, perfect for experiencing local hospitality.',
        price: 200,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 2,
        roomTypeCategory: 'homestay',
        isAvailable: true,
        availableRooms: 2,
        totalRooms: 2,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Home-cooked Meals',
          'Shared Bathroom',
          'Local Host',
          'Cultural Experience',
          'Garden Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        displayOrder: 2,
        isActive: true
      }
    ],
    apartment: [
      {
        name: 'Studio Apartment',
        description: 'Modern studio apartment with all amenities for comfortable long-term stay.',
        price: 800,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 2,
        roomTypeCategory: 'apartment',
        isAvailable: true,
        availableRooms: 2,
        totalRooms: 3,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Full Kitchen',
          'Private Bathroom',
          'Living Area',
          'Balcony',
          'Parking',
          'Gym Access',
          'Pool Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        displayOrder: 1,
        isActive: true
      },
      {
        name: '1 Bedroom Apartment',
        description: 'Spacious 1 bedroom apartment perfect for couples or small families.',
        price: 1200,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 3,
        roomTypeCategory: 'apartment',
        isAvailable: true,
        availableRooms: 1,
        totalRooms: 2,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Full Kitchen',
          'Private Bathroom',
          'Living Area',
          'Bedroom',
          'Balcony',
          'Parking',
          'Gym Access',
          'Pool Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        displayOrder: 2,
        isActive: true
      }
    ],
    guesthouse: [
      {
        name: 'Standard Room',
        description: 'Comfortable standard room in a guesthouse with essential amenities.',
        price: 250,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 2,
        roomTypeCategory: 'guesthouse',
        isAvailable: true,
        availableRooms: 3,
        totalRooms: 4,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Private Bathroom',
          'Daily Housekeeping',
          'Common Lounge',
          'Garden Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Family Room',
        description: 'Large family room suitable for families or groups traveling together.',
        price: 400,
        currency: '₵',
        genderType: GenderType.ANY,
        capacity: 4,
        roomTypeCategory: 'guesthouse',
        isAvailable: true,
        availableRooms: 1,
        totalRooms: 1,
        amenities: [
          'WiFi',
          'Air Conditioning',
          'Private Bathroom',
          'Daily Housekeeping',
          'Common Lounge',
          'Garden Access',
          'Kitchen Access'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        displayOrder: 2,
        isActive: true
      }
    ]
  };

  return baseRoomTypes[propertyType as keyof typeof baseRoomTypes] || baseRoomTypes.hostel;
}

if (require.main === module) {
  seedRoomTypes();
}

export { seedRoomTypes }; 