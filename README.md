# HosFind Backend API

A robust, scalable backend API for the HosFind hostel finding application built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens
- **User Management**: Complete CRUD operations for user profiles
- **Input Validation**: Comprehensive validation using express-validator and class-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Database**: PostgreSQL with TypeORM for efficient data management
- **Security**: Helmet, CORS, and bcrypt for enhanced security
- **TypeScript**: Full TypeScript support with strict type checking
- **Logging**: Morgan for HTTP request logging

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator, class-validator
- **Security**: bcryptjs, helmet, cors
- **Development**: nodemon, ts-node

## 📋 Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- PostgreSQL database
- Git

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd hos-find-be
yarn install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=hosfind

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Optional: SSL Configuration (for production)
# SSL_ENABLED=false
```

### 3. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE hosfind;
```

2. Run the application (it will auto-sync tables in development mode):
```bash
yarn dev
```

### 4. Start Development Server

```bash
yarn dev
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | User registration |
| POST | `/login` | User login |
| POST | `/refresh-token` | Refresh access token |
| POST | `/logout` | User logout |

### User Routes (`/api/users`) - Protected

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |
| DELETE | `/profile` | Delete user profile |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🔐 Authentication

The API uses JWT tokens for authentication:

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Bearer Token**: Include in Authorization header: `Bearer <token>`

### Protected Routes

For protected routes, include the access token in the request header:
```
Authorization: Bearer <your_access_token>
```

## 🗄️ Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| fullName | VARCHAR(100) | User's full name |
| email | VARCHAR(100) | Unique email address |
| password | VARCHAR(255) | Hashed password |
| phoneNumber | VARCHAR(20) | Unique phone number |
| location | VARCHAR(100) | User's location |
| gender | ENUM | male/female |
| isEmailVerified | BOOLEAN | Email verification status |
| isPhoneVerified | BOOLEAN | Phone verification status |
| lastLoginAt | TIMESTAMP | Last login timestamp |
| refreshToken | VARCHAR(255) | JWT refresh token |
| refreshTokenExpiresAt | TIMESTAMP | Refresh token expiry |
| createdAt | TIMESTAMP | Account creation date |
| updatedAt | TIMESTAMP | Last update date |

## 🧪 Testing

```bash
# Run tests (when implemented)
yarn test

# Run tests with coverage
yarn test:coverage
```

## 🚀 Production Deployment

1. Build the project:
```bash
yarn build
```

2. Start production server:
```bash
yarn start
```

3. Set environment variables for production:
```env
NODE_ENV=production
SSL_ENABLED=true
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # Database configuration
├── controllers/     # Route controllers
│   ├── authController.ts
│   └── userController.ts
├── middleware/      # Custom middleware
│   ├── authenticateToken.ts
│   ├── errorHandler.ts
│   ├── notFoundHandler.ts
│   └── validateRequest.ts
├── models/          # Database models/entities
│   └── User.ts
├── routes/          # API routes
│   ├── auth.ts
│   └── user.ts
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🔧 Available Scripts

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn typeorm      # TypeORM CLI commands
yarn migration:generate  # Generate database migration
yarn migration:run      # Run database migrations
yarn migration:revert   # Revert last migration
yarn db:seed     # Seed database (when implemented)
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **JWT Errors**
   - Verify JWT_SECRET and JWT_REFRESH_SECRET are set
   - Check token expiration

3. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:5000 | xargs kill -9`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 