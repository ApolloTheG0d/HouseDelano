#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🐘 PostgreSQL is running locally (no action needed)...\n');

try {
  // Load .env configuration
  require('dotenv').config();

  const dbUser = process.env.DB_USER || 'pawsco_user';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'pawsco_dev';

  console.log('📊 Connection info:');
  console.log(`  Host: ${dbHost}`);
  console.log(`  Port: ${dbPort}`);
  console.log(`  User: ${dbUser}`);
  console.log(`  Database: ${dbName}\n`);

  // Test connection to PostgreSQL
  try {
    execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT 1;"`,
      { stdio: 'pipe' }
    );
    console.log('✅ Database is reachable!\n');
    process.exit(0);
  } catch (e) {
    console.error('❌ Cannot connect to PostgreSQL database');
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Is PostgreSQL installed? → psql --version');
    console.error('   2. Is PostgreSQL running? → sudo systemctl status postgresql');
    console.error('   3. Database exists? → psql -U postgres -l | grep pawsco_dev');
    console.error(`   4. Try connecting manually: psql -h ${dbHost} -U ${dbUser} -d ${dbName}`);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
