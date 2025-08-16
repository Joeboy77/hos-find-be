import { AppDataSource } from '../config/database';
import { Property } from '../models/Property';

const ghanaCoordinates = [
  { city: 'Accra', latitude: 5.5600, longitude: -0.2057 },
  { city: 'Kumasi', latitude: 6.7000, longitude: -1.6167 },
  { city: 'Cape Coast', latitude: 5.1000, longitude: -1.2500 },
  { city: 'Tamale', latitude: 9.4000, longitude: -0.8500 },
  { city: 'Sekondi-Takoradi', latitude: 4.9000, longitude: -1.7500 },
  { city: 'Sunyani', latitude: 7.3333, longitude: -2.3333 },
  { city: 'Ho', latitude: 6.6000, longitude: 0.4667 },
  { city: 'Koforidua', latitude: 6.0833, longitude: -0.2500 },
  { city: 'Wa', latitude: 10.0667, longitude: -2.5000 },
  { city: 'Bolgatanga', latitude: 10.7833, longitude: -0.8500 },
];

async function updatePropertiesCoordinates() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const propertyRepository = AppDataSource.getRepository(Property);
    const properties = await propertyRepository.find();

    console.log(`Found ${properties.length} properties to update`);

    for (const property of properties) {
      const cityCoords = ghanaCoordinates.find(coord => 
        coord.city.toLowerCase() === property.city.toLowerCase()
      );

      if (cityCoords) {
        const randomLatOffset = (Math.random() - 0.5) * 0.01;
        const randomLngOffset = (Math.random() - 0.5) * 0.01;
        
        property.latitude = cityCoords.latitude + randomLatOffset;
        property.longitude = cityCoords.longitude + randomLngOffset;
        
        await propertyRepository.save(property);
        console.log(`Updated coordinates for ${property.name} in ${property.city}`);
      } else {
        const defaultCoords = ghanaCoordinates[0];
        const randomLatOffset = (Math.random() - 0.5) * 0.01;
        const randomLngOffset = (Math.random() - 0.5) * 0.01;
        
        property.latitude = defaultCoords.latitude + randomLatOffset;
        property.longitude = defaultCoords.longitude + randomLngOffset;
        
        await propertyRepository.save(property);
        console.log(`Updated coordinates for ${property.name} (default to Accra)`);
      }
    }

    console.log('All properties updated with coordinates successfully');
  } catch (error) {
    console.error('Error updating properties coordinates:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

updatePropertiesCoordinates(); 