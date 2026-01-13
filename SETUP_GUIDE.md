# Database Setup & Quick Start Guide

## Overview

The Paws & Company application now includes automated database setup scripts that will:
1. Check for PostgreSQL installation
2. Create the `addiction_user` PostgreSQL user (if it doesn't exist)
3. Create the `pawsco_dev` database (if it doesn't exist)
4. Initialize the database schema
5. Seed the database with initial data (admin account, services, etc.)

## Quick Start (Recommended)

The fastest way to get the application running:

```bash
npm run setup:quick
```

This will:
- Create PostgreSQL user and database
- Load the database schema
- Seed initial data
- Ready to run `npm start`

## Manual Steps

If you prefer to do each step separately:

```bash
# 1. Install npm dependencies
npm install

# 2. Setup database (create user & database)
npm run db:init

# 3. Seed database with initial data
npm run db:seed

# 4. Start the application
npm start
```

## Prerequisites

### macOS
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verify PostgreSQL is running
psql --version
```

### Ubuntu/Linux
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Verify PostgreSQL is running
psql --version
```

### Windows
Download and install PostgreSQL from: https://www.postgresql.org/download/windows/

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup:quick` | Complete setup (init + seed) |
| `npm run db:init` | Initialize database (create user & schema) |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:shell` | Connect to database shell |
| `npm run db:health` | Check if server is responding |
| `npm start` | Start the application |
| `npm run dev` | Start with hot-reload (requires nodemon) |

## Default Credentials

After setup, you can login with:
- **Email:** `admin@pawsco.com`
- **Password:** `password123`

## Database Configuration

Default `.env` values:
```
DB_USER=addiction_user
DB_PASS=password_123
DB_NAME=pawsco_dev
DB_HOST=127.0.0.1
DB_PORT=5432
```

You can modify these in the `.env` file before running setup.

## Troubleshooting

### PostgreSQL Connection Error

If you see: `password authentication failed for user "addiction_user"`

**Solution 1:** Run the setup script again
```bash
npm run db:init
```

**Solution 2:** Manually create the user
```bash
sudo -u postgres psql
CREATE USER addiction_user WITH PASSWORD 'password_123';
ALTER USER addiction_user CREATEDB;
CREATE DATABASE pawsco_dev OWNER addiction_user;
\q
```

### PostgreSQL Not Running

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Check status:**
```bash
pg_isready -h 127.0.0.1 -p 5432
```

### Port Already in Use

If port 3001 is already in use:
```bash
# Kill the process
lsof -i :3001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Or change the port in .env
echo "PORT=3002" >> .env
```

### Reset Database

To clear and reseed the database:
```bash
npm run db:reset
```

## Architecture

The setup process works as follows:

1. **setup-db.js** - Node.js script that:
   - Checks PostgreSQL is running
   - Creates user if it doesn't exist
   - Creates database if it doesn't exist
   - Initializes schema
   - Tests the connection

2. **schema.sql** - Contains all table definitions:
   - users
   - pets
   - bookings
   - services
   - emergency_contacts
   - health_records
   - etc.

3. **seed.js** - Node.js script that:
   - Creates admin user
   - Inserts sample services
   - Inserts sample bookings
   - Populates other initial data

## What Gets Created

### Database User
- Username: `addiction_user`
- Password: `password_123`
- Permissions: `CREATEDB`

### Database
- Name: `pawsco_dev`
- Owner: `addiction_user`

### Tables Created
- **users** - User accounts with authentication
- **pets** - Pet information
- **bookings** - Service bookings
- **services** - Available services (grooming, boarding, etc.)
- **service_addons** - Additional service options
- **emergency_contacts** - Emergency contact information
- **health_records** - Health records for pets
- **additional_pets** - Linked pet data
- **booking_addons** - Booking add-ons

### Initial Data
- **Admin Account:**
  - Email: `admin@pawsco.com`
  - Password: `password123`
  - Role: `admin`

- **Services:**
  - Full Grooming
  - Overnight Boarding
  - Daycare (Full Day)
  - Obedience Training
  - Dog Walking
  - Vet Telehealth

## Next Steps

After setup:
1. Start the server: `npm start`
2. Open browser: `http://localhost:3001`
3. Login with admin credentials
4. Create new accounts and start booking services

## Support

If you encounter issues:
1. Check PostgreSQL is running: `pg_isready`
2. Verify .env file exists and has correct values
3. Check database permissions: `psql -U addiction_user -d pawsco_dev`
4. Review setup logs for error messages
5. Run `npm run db:init` again to reinitialize
