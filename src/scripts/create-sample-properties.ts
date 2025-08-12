import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Property, PropertyType, PropertyStatus } from '../models/Property';
import { Category } from '../models/Category';
async function createSampleProperties() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    const propertyRepository = AppDataSource.getRepository(Property);
    const categoryRepository = AppDataSource.getRepository(Category);
    const categories = [
      { name: 'Hostels', type: 'hostel', description: 'Student accommodation and hostels' },
      { name: 'Hotels', type: 'hotel', description: 'Hotels and luxury accommodation' },
      { name: 'Homestays', type: 'homestay', description: 'Homestay accommodation' },
      { name: 'Guest Houses', type: 'guesthouse', description: 'Guest houses and B&Bs' },
      { name: 'Apartments', type: 'apartment', description: 'Apartment rentals' },
    ];
    const createdCategories = [];
    for (const catData of categories) {
      let category = await categoryRepository.findOne({ where: { type: catData.type } });
      if (!category) {
        category = categoryRepository.create({
          name: catData.name,
          type: catData.type,
          description: catData.description,
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          displayOrder: 0
        });
        await categoryRepository.save(category);
        console.log(`✅ Created category: ${category.name}`);
      }
      createdCategories.push(category);
    }
    const sampleProperties = [
      {
        name: 'KNUST Student Hostel',
        description: 'Modern student accommodation near KNUST campus with 24/7 security and WiFi. Perfect for students looking for comfortable, affordable housing with excellent facilities.',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop'
        ],
        location: 'KNUST Campus',
        city: 'Kumasi',
        region: 'Ashanti',
        price: 120,
        currency: '₵',
        rating: 4.6,
        reviewCount: 45,
        propertyType: PropertyType.HOSTEL,
        status: PropertyStatus.ACTIVE,
        isFeatured: true,
        roomType: '4 in a room',
        imageRoomTypes: ['4 in a room', '2 in a room', '1 in a room', 'Standard'],
        amenities: ['WiFi', '24/7 Security', 'Kitchen', 'Laundry', 'Study Room', 'Common Area', 'Parking', 'Air Conditioning'],
        contactInfo: {
          phone: '+233 20 123 4567',
          email: 'info@knusthostel.com'
        },
        categoryId: createdCategories.find(c => c.type === 'hostel')?.id
      },
      {
        name: 'Accra Central Hostel',
        description: 'Affordable hostel in the heart of Accra with easy access to transportation. Located in the bustling center of the city with modern amenities and friendly staff.',
        mainImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ],
        location: 'Accra Central',
        city: 'Accra',
        region: 'Greater Accra',
        price: 150,
        currency: '₵',
        rating: 4.5,
        reviewCount: 32,
        propertyType: PropertyType.HOSTEL,
        status: PropertyStatus.ACTIVE,
        isFeatured: false,
        roomType: '2 in a room',
        imageRoomTypes: ['2 in a room', '4 in a room', 'Private Room', 'Standard'],
        amenities: ['WiFi', '24/7 Security', 'Kitchen', 'Laundry', 'Study Room', 'Common Area', 'Parking', 'Air Conditioning', 'TV Room'],
        contactInfo: {
          phone: '+233 24 567 8901',
          email: 'info@accrahostel.com'
        },
        categoryId: createdCategories.find(c => c.type === 'hostel')?.id
      },
      {
        name: 'Luxury Accra Hotel',
        description: '5-star luxury hotel with premium amenities and city views. Experience world-class service, elegant rooms, and stunning views of Accra cityscape.',
        mainImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
        ],
        location: 'East Legon',
        city: 'Accra',
        region: 'Greater Accra',
        price: 800,
        currency: '₵',
        rating: 4.8,
        reviewCount: 128,
        propertyType: PropertyType.HOTEL,
        status: PropertyStatus.ACTIVE,
        isFeatured: true,
        roomType: 'Deluxe Suite',
        imageRoomTypes: ['Deluxe Suite', 'Standard Room', 'Executive Suite', 'Presidential Suite'],
        amenities: ['WiFi', '24/7 Room Service', 'Spa & Wellness', 'Swimming Pool', 'Gym', 'Restaurant', 'Bar', 'Conference Rooms', 'Airport Shuttle', 'Valet Parking'],
        contactInfo: {
          phone: '+233 30 123 4567',
          email: 'reservations@luxuryaccra.com'
        },
        categoryId: createdCategories.find(c => c.type === 'hotel')?.id
      },
      {
        name: 'Kumasi Central Hotel',
        description: 'Comfortable hotel in the heart of Kumasi with business facilities. Perfect for business travelers and tourists exploring the Ashanti region.',
        mainImageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
        ],
        location: 'Kumasi Central',
        city: 'Kumasi',
        region: 'Ashanti',
        price: 450,
        currency: '₵',
        rating: 4.3,
        reviewCount: 67,
        propertyType: PropertyType.HOTEL,
        status: PropertyStatus.ACTIVE,
        isFeatured: false,
        roomType: 'Standard Room',
        imageRoomTypes: ['Standard Room', 'Deluxe Room', 'Business Suite', 'Family Room'],
        amenities: ['WiFi', '24/7 Front Desk', 'Business Center', 'Restaurant', 'Bar', 'Conference Rooms', 'Airport Shuttle', 'Parking', 'Air Conditioning'],
        contactInfo: {
          phone: '+233 32 123 4567',
          email: 'info@kumasihotel.com'
        },
        categoryId: createdCategories.find(c => c.type === 'hotel')?.id
      },
      {
        name: 'Cozy Cape Coast Homestay',
        description: 'Warm and welcoming homestay with local family experience. Immerse yourself in Ghanaian culture while enjoying comfortable accommodation near Cape Coast Castle.',
        mainImageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop'
        ],
        location: 'Cape Coast Central',
        city: 'Cape Coast',
        region: 'Central',
        price: 200,
        currency: '₵',
        rating: 4.7,
        reviewCount: 23,
        propertyType: PropertyType.HOMESTAY,
        status: PropertyStatus.ACTIVE,
        isFeatured: true,
        roomType: 'Private Room',
        imageRoomTypes: ['Private Room', 'Shared Room', 'Family Room', 'Garden View'],
        amenities: ['WiFi', 'Home-cooked Meals', 'Local Tours', 'Garden', 'Kitchen Access', 'Laundry', 'Air Conditioning', 'Local Experience'],
        contactInfo: {
          phone: '+233 33 123 4567',
          email: 'info@cozycapecoast.com'
        },
        categoryId: createdCategories.find(c => c.type === 'homestay')?.id
      },
      {
        name: 'Elmina Guest House',
        description: 'Charming guest house with ocean views and local cuisine. Experience the beauty of Elmina with stunning sea views and authentic Ghanaian hospitality.',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop'
        ],
        location: 'Elmina',
        city: 'Elmina',
        region: 'Central',
        price: 180,
        currency: '₵',
        rating: 4.4,
        reviewCount: 18,
        propertyType: PropertyType.GUESTHOUSE,
        status: PropertyStatus.ACTIVE,
        isFeatured: false,
        roomType: 'Ocean View Room',
        imageRoomTypes: ['Ocean View Room', 'Standard Room', 'Family Room', 'Garden Room'],
        amenities: ['WiFi', 'Ocean View', 'Local Restaurant', 'Garden', 'Terrace', 'Air Conditioning', 'Local Tours', 'Fishing Trips'],
        contactInfo: {
          phone: '+233 33 234 5678',
          email: 'info@elminaguesthouse.com'
        },
        categoryId: createdCategories.find(c => c.type === 'guesthouse')?.id
      },
      {
        name: 'Modern Accra Apartment',
        description: 'Fully furnished modern apartment with all amenities. Located in the vibrant Osu neighborhood with easy access to restaurants, shops, and nightlife.',
        mainImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',   
        additionalImageUrls: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ],
        location: 'Osu',
        city: 'Accra',
        region: 'Greater Accra',
        price: 350,
        currency: '₵',
        rating: 4.6,
        reviewCount: 89,
        propertyType: PropertyType.APARTMENT,
        status: PropertyStatus.ACTIVE,
        isFeatured: true,
        roomType: 'Studio Apartment',
        imageRoomTypes: ['Studio Apartment', '1 Bedroom', '2 Bedroom', 'Penthouse'],
        amenities: ['WiFi', 'Fully Furnished', 'Kitchen', 'Balcony', 'Gym', 'Swimming Pool', 'Security', 'Parking', 'Air Conditioning', 'Washing Machine'],
        contactInfo: {
          phone: '+233 26 123 4567',
          email: 'info@modernaccra.com'
        },
        categoryId: createdCategories.find(c => c.type === 'apartment')?.id
      }
    ];
    for (const propData of sampleProperties) {
      const existingProperty = await propertyRepository.findOne({ 
        where: { name: propData.name } 
      });
      if (!existingProperty) {
        const property = propertyRepository.create(propData);
        await propertyRepository.save(property);
        console.log(`✅ Created property: ${property.name} (${property.propertyType})`);
      } else {
        console.log(`⏭️ Property already exists: ${propData.name}`);
      }
    }
    console.log('✅ Sample properties created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample properties:', error);
    process.exit(1);
  }
}
createSampleProperties(); 