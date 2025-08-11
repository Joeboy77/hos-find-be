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
        description: 'Modern student accommodation near KNUST campus with 24/7 security and WiFi',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'hostel')?.id
      },
      {
        name: 'Accra Central Hostel',
        description: 'Affordable hostel in the heart of Accra with easy access to transportation',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'hostel')?.id
      },
      {
        name: 'Luxury Accra Hotel',
        description: '5-star luxury hotel with premium amenities and city views',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'hotel')?.id
      },
      {
        name: 'Kumasi Central Hotel',
        description: 'Comfortable hotel in the heart of Kumasi with business facilities',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'hotel')?.id
      },
      {
        name: 'Cozy Cape Coast Homestay',
        description: 'Warm and welcoming homestay with local family experience',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'homestay')?.id
      },
      {
        name: 'Elmina Guest House',
        description: 'Charming guest house with ocean views and local cuisine',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
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
        categoryId: createdCategories.find(c => c.type === 'guesthouse')?.id
      },
      {
        name: 'Modern Accra Apartment',
        description: 'Fully furnished modern apartment with all amenities',
        mainImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',   
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