const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test token from the API response
const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYTMyNTY5OWYtYzYwMC00NzkzLTljNWYtZDIxNjRhYzliYzQyIiwiZW1haWwiOiJhZG1pbkBob3NmaW5kLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NjIwOTU2OCwiZXhwIjoxNzU2Mjk1OTY4fQ.SWU8EhsJqUfLxZgmmw0xMotnnEMbCjntHiYrJs3wnP0";

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'NOT FOUND');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

try {
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ JWT verification successful');
  console.log('Decoded payload:', decoded);
  console.log('adminId exists:', !!decoded.adminId);
  console.log('adminId value:', decoded.adminId);
} catch (error) {
  console.error('❌ JWT verification failed:', error.message);
} 