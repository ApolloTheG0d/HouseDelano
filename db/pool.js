require('dotenv').config(); // Add this at the very top
const { Pool } = require('pg');

// OLD CONFIGURATION - COMMENTED OUT //
// const pool = new Pool({
//   user: process.env.DB_USER || 'pawsco_user',
//   password: process.env.DB_PASS || 'pawsco_secure_password_123',
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 5432,
//   database: process.env.DB_NAME || 'pawsco_dev',
// });

// pool.on('error', (err) => {
//   console.error('🔴 Unexpected error on idle client:', err);
//   process.exit(-1);
// });

// module.exports = pool;

// NEW CONFIGURATION //
// 
//----------------------------------------------------------------------//
// Support both Docker (service name) and local postgres
/**
 * Intelligent database host detection
 * Priority:
 * 1. NODE_ENV === 'docker' → use 'postgres' (Docker Compose service name)
 * 2. Explicit DB_HOST from .env → use it
 * 3. Default → 'localhost'
 */
/**
 * Intelligent database host detection
 * Priority:
 * 1. NODE_ENV === 'docker' → use 'postgres' (Docker Compose service name)
 * 2. Explicit DB_HOST from .env → use it
 * 3. Default → 'localhost'
 */
function detectDatabaseHost() {
  const explicitHost = process.env.DB_HOST;

  // If explicitly set in .env, use it (e.g., 127.0.0.1 for VM access)
  if (explicitHost) {
    console.log(`🖥️  Using DB_HOST from .env: ${explicitHost}`);
    return explicitHost;
  }

  // Default: localhost for local dev
  console.log('🖥️  Using default database host: localhost');
  return 'localhost';
}

/**
 * Build database configuration
 */
function getDbConfig() {
  const host = detectDatabaseHost();

  const config = {
    user: process.env.DB_USER || 'pawsco_user',
    password: process.env.DB_PASS || 'pawsco_secure_password_123',
    database: process.env.DB_NAME || 'pawsco_dev',
    port: process.env.DB_PORT || 5432,
    host: host,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  return config;
}

/**
 * Initialize connection pool
 */
const config = getDbConfig();
console.log('\n🐘 Database Configuration:');
console.log(`   Host:     ${config.host}`);
console.log(`   Port:     ${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User:     ${config.user}\n`);

const pool = new Pool(config);

/**
 * Event handlers
 */
pool.on('connect', () => {
  console.log('✅ Connected to database pool');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

// pool.on('remove', () => {
//   console.log('⚠️  Client removed from pool');
// });
pool.on('connect', () => {
  console.log('✅ Connected to database pool');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

module.exports = pool;