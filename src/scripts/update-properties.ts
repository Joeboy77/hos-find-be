import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Property, PropertyStatus } from '../models/Property';

async function updateProperties() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    const propertyRepository = AppDataSource.getRepository(Property);
    
    // Update KNUST Student Hostel
    const knustHostel = await propertyRepository.findOne({ where: { name: 'KNUST Student Hostel' } });
    if (knustHostel) {
      knustHostel.description = 'Modern student accommodation near KNUST campus with 24/7 security and WiFi. Perfect for students looking for comfortable, affordable housing with excellent facilities.';
      knustHostel.mainImageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
      knustHostel.additionalImageUrls = [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop'
      ];
      knustHostel.roomType = '4 in a room';
      knustHostel.imageRoomTypes = ['4 in a room', '2 in a room', '1 in a room', 'Standard'];
      knustHostel.amenities = ['WiFi', '24/7 Security', 'Kitchen', 'Laundry', 'Study Room', 'Common Area', 'Parking', 'Air Conditioning'];
      knustHostel.contactInfo = {
        phone: '+233 20 123 4567',
        email: 'info@knusthostel.com'
      };
      await propertyRepository.save(knustHostel);
      console.log('✅ Updated KNUST Student Hostel');
    }

    // Update Accra Central Hostel
    const accraHostel = await propertyRepository.findOne({ where: { name: 'Accra Central Hostel' } });
    if (accraHostel) {
      accraHostel.description = 'Affordable hostel in the heart of Accra with easy access to transportation. Located in the bustling center of the city with modern amenities and friendly staff.';
      accraHostel.mainImageUrl = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop';
      accraHostel.additionalImageUrls = [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
      ];
      accraHostel.roomType = '2 in a room';
      accraHostel.imageRoomTypes = ['2 in a room', '4 in a room', 'Private Room', 'Standard'];
      accraHostel.amenities = ['WiFi', '24/7 Security', 'Kitchen', 'Laundry', 'Study Room', 'Common Area', 'Parking', 'Air Conditioning', 'TV Room'];
      accraHostel.contactInfo = {
        phone: '+233 24 567 8901',
        email: 'info@accrahostel.com'
      };
      await propertyRepository.save(accraHostel);
      console.log('✅ Updated Accra Central Hostel');
    }

    // Update Luxury Accra Hotel
    const luxuryHotel = await propertyRepository.findOne({ where: { name: 'Luxury Accra Hotel' } });
    if (luxuryHotel) {
      luxuryHotel.description = '5-star luxury hotel with premium amenities and city views. Experience world-class service, elegant rooms, and stunning views of Accra cityscape.';
      luxuryHotel.mainImageUrl = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop';
      luxuryHotel.additionalImageUrls = [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
      ];
      luxuryHotel.roomType = 'Deluxe Suite';
      luxuryHotel.imageRoomTypes = ['Deluxe Suite', 'Standard Room', 'Executive Suite', 'Presidential Suite'];
      luxuryHotel.amenities = ['WiFi', '24/7 Room Service', 'Spa & Wellness', 'Swimming Pool', 'Gym', 'Restaurant', 'Bar', 'Conference Rooms', 'Airport Shuttle', 'Valet Parking'];
      luxuryHotel.contactInfo = {
        phone: '+233 30 123 4567',
        email: 'reservations@luxuryaccra.com'
      };
      await propertyRepository.save(luxuryHotel);
      console.log('✅ Updated Luxury Accra Hotel');
    }

    // Update Kumasi Central Hotel
    const kumasiHotel = await propertyRepository.findOne({ where: { name: 'Kumasi Central Hotel' } });
    if (kumasiHotel) {
      kumasiHotel.description = 'Comfortable hotel in the heart of Kumasi with business facilities. Perfect for business travelers and tourists exploring the Ashanti region.';
      kumasiHotel.mainImageUrl = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop';
      kumasiHotel.additionalImageUrls = [
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
      ];
      kumasiHotel.roomType = 'Standard Room';
      kumasiHotel.imageRoomTypes = ['Standard Room', 'Deluxe Room', 'Business Suite', 'Family Room'];
      kumasiHotel.amenities = ['WiFi', '24/7 Front Desk', 'Business Center', 'Restaurant', 'Bar', 'Conference Rooms', 'Airport Shuttle', 'Parking', 'Air Conditioning'];
      kumasiHotel.contactInfo = {
        phone: '+233 32 123 4567',
        email: 'info@kumasihotel.com'
      };
      await propertyRepository.save(kumasiHotel);
      console.log('✅ Updated Kumasi Central Hotel');
    }

    // Update Cozy Cape Coast Homestay
    const capeCoastHomestay = await propertyRepository.findOne({ where: { name: 'Cozy Cape Coast Homestay' } });
    if (capeCoastHomestay) {
      capeCoastHomestay.description = 'Warm and welcoming homestay with local family experience. Immerse yourself in Ghanaian culture while enjoying comfortable accommodation near Cape Coast Castle.';
      capeCoastHomestay.mainImageUrl = 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop';
      capeCoastHomestay.additionalImageUrls = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop'
      ];
      capeCoastHomestay.roomType = 'Private Room';
      capeCoastHomestay.imageRoomTypes = ['Private Room', 'Shared Room', 'Family Room', 'Garden View'];
      capeCoastHomestay.amenities = ['WiFi', 'Home-cooked Meals', 'Local Tours', 'Garden', 'Kitchen Access', 'Laundry', 'Air Conditioning', 'Local Experience'];
      capeCoastHomestay.contactInfo = {
        phone: '+233 33 123 4567',
        email: 'info@cozycapecoast.com'
      };
      await propertyRepository.save(capeCoastHomestay);
      console.log('✅ Updated Cozy Cape Coast Homestay');
    }

    // Update Elmina Guest House
    const elminaGuestHouse = await propertyRepository.findOne({ where: { name: 'Elmina Guest House' } });
    if (elminaGuestHouse) {
      elminaGuestHouse.description = 'Charming guest house with ocean views and local cuisine. Experience the beauty of Elmina with stunning sea views and authentic Ghanaian hospitality.';
      elminaGuestHouse.mainImageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
      elminaGuestHouse.additionalImageUrls = [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop'
      ];
      elminaGuestHouse.roomType = 'Ocean View Room';
      elminaGuestHouse.imageRoomTypes = ['Ocean View Room', 'Standard Room', 'Family Room', 'Garden Room'];
      elminaGuestHouse.amenities = ['WiFi', 'Ocean View', 'Local Restaurant', 'Garden', 'Terrace', 'Air Conditioning', 'Local Tours', 'Fishing Trips'];
      elminaGuestHouse.contactInfo = {
        phone: '+233 33 234 5678',
        email: 'info@elminaguesthouse.com'
      };
      await propertyRepository.save(elminaGuestHouse);
      console.log('✅ Updated Elmina Guest House');
    }

    // Update Modern Accra Apartment
    const modernApartment = await propertyRepository.findOne({ where: { name: 'Modern Accra Apartment' } });
    if (modernApartment) {
      modernApartment.description = 'Fully furnished modern apartment with all amenities. Located in the vibrant Osu neighborhood with easy access to restaurants, shops, and nightlife.';
      modernApartment.mainImageUrl = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop';
      modernApartment.additionalImageUrls = [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
      ];
      modernApartment.roomType = 'Studio Apartment';
      modernApartment.imageRoomTypes = ['Studio Apartment', '1 Bedroom', '2 Bedroom', 'Penthouse'];
      modernApartment.amenities = ['WiFi', 'Fully Furnished', 'Kitchen', 'Balcony', 'Gym', 'Swimming Pool', 'Security', 'Parking', 'Air Conditioning', 'Washing Machine'];
      modernApartment.contactInfo = {
        phone: '+233 26 123 4567',
        email: 'info@modernaccra.com'
      };
      await propertyRepository.save(modernApartment);
      console.log('✅ Updated Modern Accra Apartment');
    }

    console.log('✅ All properties updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating properties:', error);
    process.exit(1);
  }
}

updateProperties(); 