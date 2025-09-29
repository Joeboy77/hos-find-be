#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse DATABASE_URL for production
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 5432,
    database: parsed.pathname.slice(1),
    user: parsed.username,
    password: parsed.password,
    ssl: parsed.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
  };
}

// Database configurations
const configs = {
  local: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hosfind',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  production: parseDatabaseUrl('postgresql://neondb_owner:npg_8ZJl9avzqmXO@ep-proud-hat-adc4w4vi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
};

async function runSQLScript(client, scriptPath, environment) {
  try {
    console.log(`\n🔄 Running SQL script on ${environment} database...`);
    
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    await client.query(sqlScript);
    
    console.log(`✅ Successfully applied email verification fields to ${environment} database`);
    
  } catch (error) {
    console.error(`❌ Error applying script to ${environment} database:`, error.message);
    throw error;
  }
}

async function addEmailVerificationFields(environment = 'local') {
  const config = configs[environment];
  
  if (!config) {
    throw new Error(`Invalid environment: ${environment}. Use 'local' or 'production'`);
  }

  const client = new Client(config);
  
  try {
    console.log(`🔌 Connecting to ${environment} database...`);
    await client.connect();
    console.log(`✅ Connected to ${environment} database`);

    const scriptPath = path.join(__dirname, 'add-email-verification-fields.sql');
    await runSQLScript(client, scriptPath, environment);
    
  } catch (error) {
    console.error(`❌ Failed to add email verification fields to ${environment} database:`, error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log(`🔌 Disconnected from ${environment} database`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'local';
  
  console.log('🚀 HosFind Email Verification Fields Setup');
  console.log('==========================================');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node add-email-verification-fields.js [environment]

Environments:
  local       Apply to local database (default)
  production  Apply to production database
  both        Apply to both local and production databases

Environment Variables for Production:
  DATABASE_URL      Production database connection string

Examples:
  node add-email-verification-fields.js local
  node add-email-verification-fields.js production
  node add-email-verification-fields.js both
    `);
    return;
  }

  try {
    if (environment === 'both') {
      console.log('🔄 Applying to both local and production databases...\n');
      
      await addEmailVerificationFields('local');
      console.log('\n' + '='.repeat(50) + '\n');
      await addEmailVerificationFields('production');
      
      console.log('\n🎉 Successfully applied email verification fields to both databases!');
    } else {
      await addEmailVerificationFields(environment);
      console.log(`\n🎉 Successfully applied email verification fields to ${environment} database!`);
    }
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();