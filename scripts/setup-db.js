#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates PostgreSQL user and database if they don't exist
 * This script runs before seeding to ensure the database is ready
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Get database credentials from .env
const DB_USER = process.env.DB_USER || 'addiction_user';
const DB_PASS = process.env.DB_PASS || 'password_123';
const DB_NAME = process.env.DB_NAME || 'pawsco_dev';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || 5432;

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(level, msg) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`${colors[level]}[${timestamp}] ${msg}${colors.reset}`);
}

async function checkPostgresRunning() {
    try {
        const { stdout } = await execAsync(`pg_isready -h ${DB_HOST} -p ${DB_PORT}`);
        return stdout.includes('accepting connections');
    } catch (err) {
        return false;
    }
}

async function userExists(user) {
    try {
        const { stdout } = await execAsync(
            `sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='${user}';"`,
            { shell: '/bin/bash' }
        );
        return stdout.includes('1');
    } catch (err) {
        log('yellow', `Unable to check if user ${user} exists: ${err.message}`);
        return false;
    }
}

async function databaseExists(db) {
    try {
        const { stdout } = await execAsync(
            `sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='${db}';"`,
            { shell: '/bin/bash' }
        );
        return stdout.includes('1');
    } catch (err) {
        log('yellow', `Unable to check if database ${db} exists: ${err.message}`);
        return false;
    }
}

async function createUser(user, pass) {
    try {
        log('blue', `Creating PostgreSQL user: ${user}...`);
        await execAsync(`sudo -u postgres psql -c "CREATE USER ${user} WITH PASSWORD '${pass}';"`, {
            shell: '/bin/bash',
        });
        await execAsync(`sudo -u postgres psql -c "ALTER USER ${user} CREATEDB;"`, {
            shell: '/bin/bash',
        });
        log('green', `✅ User created: ${user}`);
        return true;
    } catch (err) {
        log('red', `❌ Failed to create user: ${err.message}`);
        return false;
    }
}

async function createDatabase(db, owner) {
    try {
        log('blue', `Creating database: ${db}...`);
        await execAsync(`sudo -u postgres psql -c "CREATE DATABASE ${db} OWNER ${owner};"`, {
            shell: '/bin/bash',
        });
        log('green', `✅ Database created: ${db}`);
        return true;
    } catch (err) {
        log('red', `❌ Failed to create database: ${err.message}`);
        return false;
    }
}

async function initializeSchema(user, pass, db, host, port) {
    try {
        log('blue', 'Initializing database schema...');
        const { stderr } = await execAsync(
            `PGPASSWORD="${pass}" psql -h ${host} -p ${port} -U ${user} -d ${db} -f db/schema.sql`,
            { shell: '/bin/bash', env: { ...process.env, PGPASSWORD: pass } }
        );

        if (stderr && !stderr.includes('NOTICE')) {
            log('yellow', `Schema output: ${stderr}`);
        }
        log('green', '✅ Schema initialized');
        return true;
    } catch (err) {
        log('yellow', `⚠️  Schema initialization may have failed or already exists: ${err.message}`);
        return true; // Don't fail if schema already exists
    }
}

async function testConnection(user, pass, db, host, port) {
    try {
        const { stdout } = await execAsync(
            `PGPASSWORD="${pass}" psql -h ${host} -p ${port} -U ${user} -d ${db} -c "SELECT NOW() as connected_at;"`,
            { shell: '/bin/bash', env: { ...process.env, PGPASSWORD: pass } }
        );
        return stdout.includes('connected_at');
    } catch (err) {
        log('red', `Connection test failed: ${err.message}`);
        return false;
    }
}

async function setupDatabase() {
    console.log('\n' + colors.blue + '🐘 Database Setup Script' + colors.reset);
    console.log(colors.blue + '═══════════════════════════════════════' + colors.reset + '\n');

    log('blue', `Configuration:`);
    console.log(`   Host:     ${DB_HOST}`);
    console.log(`   Port:     ${DB_PORT}`);
    console.log(`   User:     ${DB_USER}`);
    console.log(`   Database: ${DB_NAME}\n`);

    // 1. Check if PostgreSQL is running
    log('blue', 'Step 1: Checking PostgreSQL connection...');
    const pgRunning = await checkPostgresRunning();
    if (!pgRunning) {
        log('red', '❌ PostgreSQL is not running or not accessible');
        log('yellow', 'Make sure PostgreSQL is installed and running:');
        console.log('   macOS:  brew services start postgresql');
        console.log('   Linux:  sudo systemctl start postgresql');
        console.log('   Docker: docker run -d -e POSTGRES_PASSWORD=postgres postgres\n');
        process.exit(1);
    }
    log('green', '✅ PostgreSQL is running\n');

    // 2. Check if user exists, create if not
    log('blue', 'Step 2: Checking PostgreSQL user...');
    let userCreated = false;
    const userExist = await userExists(DB_USER);
    if (!userExist) {
        userCreated = await createUser(DB_USER, DB_PASS);
        if (!userCreated) {
            log('yellow', 'Attempting to continue...\n');
        }
    } else {
        log('green', `✅ User already exists: ${DB_USER}\n`);
    }

    // 3. Check if database exists, create if not
    log('blue', 'Step 3: Checking PostgreSQL database...');
    let dbCreated = false;
    const dbExist = await databaseExists(DB_NAME);
    if (!dbExist) {
        dbCreated = await createDatabase(DB_NAME, DB_USER);
        if (!dbCreated) {
            log('yellow', 'Attempting to continue...\n');
        }
    } else {
        log('green', `✅ Database already exists: ${DB_NAME}\n`);
    }

    // 4. Initialize schema
    log('blue', 'Step 4: Initializing database schema...');
    await initializeSchema(DB_USER, DB_PASS, DB_NAME, DB_HOST, DB_PORT);
    console.log('');

    // 5. Test connection
    log('blue', 'Step 5: Testing database connection...');
    const connected = await testConnection(DB_USER, DB_PASS, DB_NAME, DB_HOST, DB_PORT);
    if (connected) {
        log('green', '✅ Connection successful\n');
    } else {
        log('red', '❌ Connection failed\n');
        process.exit(1);
    }

    console.log(colors.green + '════════════════════════════════════════' + colors.reset);
    console.log(colors.green + '✅ Database setup complete!' + colors.reset);
    console.log(colors.green + '════════════════════════════════════════\n' + colors.reset);

    console.log(colors.blue + '📊 Database Connection Info:' + colors.reset);
    console.log(`   Host:     ${DB_HOST}`);
    console.log(`   Port:     ${DB_PORT}`);
    console.log(`   User:     ${DB_USER}`);
    console.log(`   Database: ${DB_NAME}\n`);

    console.log(colors.blue + '🚀 Next steps:' + colors.reset);
    console.log('   1. Run seed data: npm run db:seed');
    console.log('   2. Start the app: npm start\n');
}

setupDatabase().catch(err => {
    log('red', `Setup failed: ${err.message}`);
    process.exit(1);
});
