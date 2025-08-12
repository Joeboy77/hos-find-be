import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { PropertyType } from '../models/Property';

const initialCategories = [
  {
    name: 'Student Hostels',
    description: 'Affordable accommodation for students near universities and colleges',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    type: 'hostel',
    displayOrder: 1
  },
  {
    name: 'Luxury Hotels',
    description: 'Premium hotels with world-class amenities and services',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    type: 'hotel',
    displayOrder: 2
  },
  {
    name: 'Cozy Homestays',
    description: 'Warm and welcoming family-run accommodations',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    type: 'homestay',
    displayOrder: 3
  },
  {
    name: 'Modern Apartments',
    description: 'Contemporary apartment complexes with modern facilities',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    type: 'apartment',
    displayOrder: 4
  },
  {
    name: 'Guest Houses',
    description: 'Charming guest houses perfect for short stays',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    type: 'guesthouse',
    displayOrder: 5
  }
];

const initialProperties = [
  {
    name: 'Premium Student Accommodation',
    description: 'Modern, fully furnished student accommodation with 24/7 security, high-speed WiFi, and study areas. Perfect for students looking for a comfortable and safe place to stay.',
    mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    additionalImageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop'
    ],
    location: 'East Legon',
    city: 'Accra',
    region: 'Greater Accra',
    price: 350,
    currency: '₵',
    rating: 4.9,
    propertyType: PropertyType.HOSTEL,
    isFeatured: true,
    displayOrder: 1,
    roomType: '4 in a room',
    imageRoomTypes: ['4 in a room', '2 in a room', '1 in a room'],
    amenities: ['WiFi', '24/7 Security', 'Study Room', 'Kitchen', 'Laundry'],
    contactInfo: {
      phone: '+233 20 123 4567',
      email: 'info@premiumstudent.com'
    }
  },
  {
    name: 'Luxury Hotel Suite',
    description: 'Elegant hotel suite with city view and premium amenities. Features include a king-size bed, private balcony, spa bathroom, and access to hotel facilities.',
    mainImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    additionalImageUrls: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
    ],
    location: 'Osu',
    city: 'Accra',
    region: 'Greater Accra',
    price: 750,
    currency: '₵',
    rating: 4.8,
    propertyType: PropertyType.HOTEL,
    isFeatured: true,
    displayOrder: 2,
    roomType: 'Deluxe Suite',
    imageRoomTypes: ['Deluxe Suite', 'Standard Room', 'Executive Suite'],
    amenities: ['WiFi', 'Room Service', 'Spa', 'Swimming Pool', 'Restaurant'],
    contactInfo: {
      phone: '+233 30 123 4567',
      email: 'reservations@luxuryhotel.com'
    }
  },
  {
    name: 'Cozy Homestay',
    description: 'Warm and welcoming homestay in a quiet neighborhood. Experience local culture and hospitality with home-cooked meals and personalized service.',
    mainImageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
    additionalImageUrls: [
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
    ],
    location: 'Cantonments',
    city: 'Accra',
    region: 'Greater Accra',
    price: 280,
    currency: '₵',
    rating: 4.7,
    propertyType: PropertyType.HOMESTAY,
    isFeatured: true,
    displayOrder: 3,
    roomType: 'Private Room',
    imageRoomTypes: ['Private Room', 'Shared Room', 'Family Room'],
    amenities: ['WiFi', 'Home-cooked Meals', 'Garden', 'Local Tours'],
    contactInfo: {
      phone: '+233 24 123 4567',
      email: 'info@cozyhomestay.com'
    }
  },
  {
    name: 'Modern Studio Apartment',
    description: 'Contemporary studio apartment with modern amenities. Perfect for professionals or couples looking for a stylish and functional living space.',
    mainImageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
    additionalImageUrls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
    ],
    location: 'Airport Residential Area',
    city: 'Accra',
    region: 'Greater Accra',
    price: 450,
    currency: '₵',
    rating: 4.6,
    propertyType: PropertyType.APARTMENT,
    isFeatured: false,
    displayOrder: 4,
    roomType: 'Studio',
    imageRoomTypes: ['Studio', '1 Bedroom', '2 Bedroom'],
    amenities: ['WiFi', 'Fully Furnished', 'Gym', 'Parking', 'Security'],
    contactInfo: {
      phone: '+233 26 123 4567',
      email: 'info@modernapartment.com'
    }
  },
  {
    name: 'Charming Guest House',
    description: 'Beautiful guest house with garden views and traditional architecture. Offers a peaceful retreat with modern comforts and local charm.',
    mainImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    additionalImageUrls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop'
    ],
    location: 'Labone',
    city: 'Accra',
    region: 'Greater Accra',
    price: 320,
    currency: '₵',
    rating: 4.5,
    propertyType: PropertyType.GUESTHOUSE,
    isFeatured: false,
    displayOrder: 5,
    roomType: 'Standard Room',
    imageRoomTypes: ['Standard Room', 'Deluxe Room', 'Garden Room'],
    amenities: ['WiFi', 'Garden', 'Restaurant', 'Air Conditioning'],
    contactInfo: {
      phone: '+233 27 123 4567',
      email: 'info@charmingguesthouse.com'
    }
  }
];

async function seedContent() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    const categoryRepository = AppDataSource.getRepository(Category);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    console.log('🗑️  Clearing existing content...');
    await propertyRepository.clear();
    await categoryRepository.clear();
    
    console.log('🌱 Seeding categories...');
    const createdCategories = [];
    for (const categoryData of initialCategories) {
      const category = categoryRepository.create(categoryData);
      const savedCategory = await categoryRepository.save(category);
      createdCategories.push(savedCategory);
      console.log(`✅ Created category: ${savedCategory.name}`);
    }
    
    console.log('🏠 Seeding properties...');
    for (let i = 0; i < initialProperties.length; i++) {
      const propertyData = initialProperties[i];
      const category = createdCategories[i % createdCategories.length]; 
      
      const property = propertyRepository.create({
        ...propertyData,
        categoryId: category.id
      });
      
      const savedProperty = await propertyRepository.save(property);
      console.log(`✅ Created property: ${savedProperty.name}`);
      
      category.propertyCount += 1;
      await categoryRepository.save(category);
    }
    
    console.log('🎉 Content seeding completed successfully!');
    console.log(`📊 Created ${createdCategories.length} categories and ${initialProperties.length} properties`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  }
}

seedContent(); 