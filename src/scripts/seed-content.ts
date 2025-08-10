import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Category } from '../models/Category';
import { Property } from '../models/Property';
import { PropertyType } from '../models/Property';
const initialCategories = [
  {
    name: 'Student Hostels',
    description: 'Affordable accommodation for students near universities and colleges',
    imageUrl: 'https:
    type: 'hostel',
    displayOrder: 1
  },
  {
    name: 'Luxury Hotels',
    description: 'Premium hotels with world-class amenities and services',
    imageUrl: 'https:
    type: 'hotel',
    displayOrder: 2
  },
  {
    name: 'Cozy Homestays',
    description: 'Warm and welcoming family-run accommodations',
    imageUrl: 'https:
    type: 'homestay',
    displayOrder: 3
  },
  {
    name: 'Modern Apartments',
    description: 'Contemporary apartment complexes with modern facilities',
    imageUrl: 'https:
    type: 'apartment',
    displayOrder: 4
  },
  {
    name: 'Guest Houses',
    description: 'Charming guest houses perfect for short stays',
    imageUrl: 'https:
    type: 'guesthouse',
    displayOrder: 5
  }
];
const initialProperties = [
  {
    name: 'Premium Student Accommodation',
    description: 'Modern, fully furnished student accommodation with 24/7 security, high-speed WiFi, and study areas. Perfect for students looking for a comfortable and safe place to stay.',
    mainImageUrl: 'https:
    location: 'East Legon',
    city: 'Accra',
    region: 'Greater Accra',
    price: 350,
    currency: '₵',
    rating: 4.9,
    propertyType: PropertyType.HOSTEL,
    isFeatured: true,
    displayOrder: 1
  },
  {
    name: 'Luxury Hotel Suite',
    description: 'Elegant hotel suite with city view and premium amenities. Features include a king-size bed, private balcony, spa bathroom, and access to hotel facilities.',
    mainImageUrl: 'https:
    location: 'Osu',
    city: 'Accra',
    region: 'Greater Accra',
    price: 750,
    currency: '₵',
    rating: 4.8,
    propertyType: PropertyType.HOTEL,
    isFeatured: true,
    displayOrder: 2
  },
  {
    name: 'Cozy Homestay',
    description: 'Warm and welcoming homestay in a quiet neighborhood. Experience local culture and hospitality with home-cooked meals and personalized service.',
    mainImageUrl: 'https:
    location: 'Cantonments',
    city: 'Accra',
    region: 'Greater Accra',
    price: 280,
    currency: '₵',
    rating: 4.7,
    propertyType: PropertyType.HOMESTAY,
    isFeatured: true,
    displayOrder: 3
  },
  {
    name: 'Modern Studio Apartment',
    description: 'Contemporary studio apartment with modern amenities. Perfect for professionals or couples looking for a stylish and functional living space.',
    mainImageUrl: 'https:
    location: 'Airport Residential Area',
    city: 'Accra',
    region: 'Greater Accra',
    price: 450,
    currency: '₵',
    rating: 4.6,
    propertyType: PropertyType.APARTMENT,
    isFeatured: false,
    displayOrder: 4
  },
  {
    name: 'Charming Guest House',
    description: 'Beautiful guest house with garden views and traditional architecture. Offers a peaceful retreat with modern comforts and local charm.',
    mainImageUrl: 'https:
    location: 'Labone',
    city: 'Accra',
    region: 'Greater Accra',
    price: 320,
    currency: '₵',
    rating: 4.5,
    propertyType: PropertyType.GUESTHOUSE,
    isFeatured: false,
    displayOrder: 5
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