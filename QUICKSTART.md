# 🚀 Quick Start Guide - Paws & Company

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ npm 10+ installed
- ✅ PostgreSQL installed and running locally

## 📦 Installing Requirements

### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Verify installation
node --version
npm --version
pg_isready
```

### macOS

```bash
# Install Node.js and npm (using Homebrew)
brew install node

# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verify installation
node --version
npm --version
pg_isready
```

### Windows

**Option 1: Download Installers**
- Download Node.js from: https://nodejs.org (LTS version)
- Download PostgreSQL from: https://www.postgresql.org/download/windows/
- Run both installers and follow the setup wizard

**Option 2: Using Chocolatey (if installed)**
```bash
choco install nodejs postgresql
```

**Verify Installation (in Command Prompt or PowerShell):**
```bash
node --version
npm --version
psql --version
```

---

## ⚡ Fastest Setup (Recommended)

Run one command to set up everything automatically:

```bash
npm run setup
```

This will:
- Auto-create `.env` file with default configuration
- Install all dependencies (if needed)
- Create PostgreSQL user (`addiction_user`) and database (`pawsco_dev`)
- Initialize the database schema
- Seed initial data (admin account, services, etc.)

Then start the server:
```bash
npm start
```

Visit: **http://localhost:3001**

**Default Admin Credentials:**
- Email: `admin@pawsco.com`
- Password: `password123`

---

## 📝 Alternative: Step-by-Step Setup

If you prefer to set up step by step:

```bash
# 1. Install dependencies
npm install

# 2. Create database user and schema
npm run db:init

# 3. Seed initial data
npm run db:seed

# 4. Start the server
npm start
```

---

## 🌐 Accessing the Application

Once the server is running, visit:

- **Main Site:** http://localhost:3001
- **Sign Up:** http://localhost:3001/signUp.html
- **Sign In:** http://localhost:3001/signIn.html
- **Admin Login:** http://localhost:3001/admin/login

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run setup` | Complete automated setup (recommended) - creates `.env` and sets up everything |
| `npm run setup:quick` | Database setup only (requires `.env` to exist) |
| `npm run db:init` | Initialize database only |
| `npm run db:seed` | Seed database with initial data |
| `npm start` | Start the server on http://localhost:3001 |
| `npm run db:shell` | Access PostgreSQL shell |
| `npm run db:health` | Check database health |
| `npm run db:reset` | Reset/reseed the database |

---

## Troubleshooting

### Setup Fails - PostgreSQL Not Running

Make sure PostgreSQL is installed and running:

**Linux:**
```bash
sudo systemctl start postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Check Status:**
```bash
pg_isready -h 127.0.0.1 -p 5432
```

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

If you see authentication errors, run the setup again:
```bash
npm run db:init
npm run db:seed
```

Or manually create the database:
```bash
sudo -u postgres psql -c "CREATE USER addiction_user WITH PASSWORD 'password_123';"
sudo -u postgres psql -c "ALTER USER addiction_user CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE pawsco_dev OWNER addiction_user;"
```

### Reset Everything

Start fresh:
```bash
npm run db:reset
```

---

## Environment Variables

The `.env` file is created automatically with these defaults:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_USER` | `addiction_user` | Database user |
| `DB_PASS` | `password_123` | Database password |
| `DB_NAME` | `pawsco_dev` | Database name |
| `DB_HOST` | `127.0.0.1` | Database host |
| `DB_PORT` | `5432` | Database port |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3001` | App server port |
| `SESSION_SECRET` | auto-generated | Session encryption key |

You can modify these in the `.env` file before running setup.

---

## Features Implemented

✅ **Authentication**
- User signup with validation
- User signin with sessions
- Password management

✅ **Database**
- Automated PostgreSQL setup
- Proper user permissions
- Complete schema with users, pets, bookings, services
- Emergency contacts and health records

✅ **Pages**
- Home page
- Services & Pricing
- Account management
- Appointment booking
- Admin dashboard

✅ **Services**
- Dog Walking
- Pet Sitting
- Pet Grooming
- Veterinary Visits
- Training Sessions
- Pet Photography

## Need Help?

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

For changes made to support this setup, see [DATABASE_SETUP_CHANGES.md](DATABASE_SETUP_CHANGES.md)