# HosFind Backend API

A comprehensive backend API for the HosFind hostel finding application, built with Express.js, TypeScript, and PostgreSQL.

## Features

- **User Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Admin Management**: Comprehensive admin panel with role-based access control
- **Property Management**: Full CRUD operations for properties with category organization
- **Category Management**: Create, update, and manage property categories
- **File Upload**: Cloudinary integration for image management
- **Search & Filtering**: Advanced property search with multiple filters
- **Pagination**: Efficient data pagination for large datasets
- **Validation**: Request validation using express-validator
- **Error Handling**: Centralized error handling with custom error classes

## Admin API Endpoints

### Authentication
- `POST /admin/login` - Admin login with email/password

### Dashboard & Statistics
- `GET /admin/dashboard` - Get system overview statistics
- `GET /admin/categories-stats` - Get detailed category statistics with property counts

### User Management
- `GET /admin/users` - Get all users with pagination and search
- `GET /admin/users/:userId` - Get specific user details
- `PATCH /admin/users/:userId/status` - Activate/deactivate users

### Admin Management
- `POST /admin/admins` - Create new admin accounts (admin role required)

### Property Management
- `GET /admin/properties` - Get all properties with filtering and pagination
- `GET /admin/properties/:id` - Get specific property details
- `POST /admin/properties` - Create new properties
- `PUT /admin/properties/:id` - Update property details
- `DELETE /admin/properties/:id` - Soft delete properties
- `PATCH /admin/properties/:id/status` - Update property status
- `PATCH /admin/properties/:id/rating` - Update property rating
- `PATCH /admin/properties/bulk-status` - Bulk update property statuses

### Category Management
- `GET /admin/categories` - Get all categories
- `GET /admin/categories/:id` - Get specific category details
- `POST /admin/categories` - Create new categories
- `PUT /admin/categories/:id` - Update category details
- `DELETE /admin/categories/:id` - Soft delete categories
- `PATCH /admin/categories/:id/status` - Update category status

## Property Types
- hostel
- hotel
- homestay
- apartment
- guesthouse

## Property Statuses
- active
- inactive
- maintenance
- booked

## Data Validation

All admin endpoints include comprehensive validation:
- Required field validation
- Data type validation
- Business logic validation (e.g., preventing deletion of categories with active properties)
- Input sanitization and normalization

## Security Features

- JWT-based authentication with extended expiration for admin access
- Role-based access control (Admin vs Super Admin)
- Input validation and sanitization
- Soft delete operations to prevent data loss
- Comprehensive error handling

## Getting Started

1. Install dependencies: `yarn install`
2. Set up environment variables (see `.env.example`)
3. Set up database: `yarn db:setup`
4. Create admin account: `yarn admin:create`
5. Start development server: `yarn dev`

## Database Scripts

### Setup Scripts

#### Create Admin User
```bash
# Create the first admin user
yarn admin:create
# or
npm run admin:create
# or directly
npx ts-node src/scripts/create-admin.ts
```

#### Seed Room Types
```bash
# Seed room types for existing properties
yarn seed:room-types
# or
npm run seed:room-types
# or directly
npx ts-node src/scripts/seed-room-types.ts
```

#### Create Sample Data
```bash
# Populate database with sample categories and properties
yarn sample:create
# or
npm run sample:create
# or directly
npx ts-node src/scripts/create-sample-properties.ts
```

### Database Commands

#### Create Database
```bash
# Connect to PostgreSQL and create database
psql -U postgres -h localhost -c "CREATE DATABASE hosfind;"
```

#### Run Migrations
```bash
# Generate and run database migrations
yarn typeorm migration:generate -- -n InitialMigration
yarn typeorm migration:run
```

#### Reset Database
```bash
# Drop and recreate database (WARNING: This will delete all data)
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS hosfind;"
psql -U postgres -h localhost -c "CREATE DATABASE hosfind;"
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=hos_find

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
``` 

## Property Management

### Adding Properties with Coordinates

When creating or updating properties, you can now include precise coordinates for map display:

**Required Fields:**
- `name` - Property name
- `description` - Property description
- `mainImageUrl` - Main image URL
- `location` - Property location/address
- `city` - City name
- `region` - Region/state
- `price` - Price per night
- `propertyType` - Type of property (hostel, hotel, homestay, apartment, guesthouse)
- `categoryId` - Category UUID

**Optional Fields:**
- `latitude` - Latitude coordinate (-90 to 90)
- `longitude` - Longitude coordinate (-180 to 180)
- `currency` - Currency symbol (default: ₵)
- `isFeatured` - Whether property is featured (default: false)
- `displayOrder` - Display order (default: 0)

**Example Request:**
```json
{
  "name": "Sample Hostel",
  "description": "A comfortable hostel in the city center",
  "mainImageUrl": "https://example.com/image.jpg",
  "location": "123 Main Street",
  "city": "Accra",
  "region": "Greater Accra",
  "latitude": 5.5600,
  "longitude": -0.2057,
  "price": 150,
  "propertyType": "hostel",
  "categoryId": "uuid-here"
}
```

**Getting Coordinates:**
- Use Google Maps: Right-click on a location and copy the coordinates
- Use GPS apps on your phone
- Use online coordinate finders
- Coordinates are optional - if not provided, the system will use default coordinates based on the city 