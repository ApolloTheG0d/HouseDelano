# Docker Removal & Local PostgreSQL Setup

## Overview
This document explains how Docker was originally used in the project, why it was removed, and what solution was implemented instead.

---

## 🐳 Original Docker Setup

### What Was Using Docker?
The project originally used **Docker Compose** to run PostgreSQL in a containerized environment. This meant:

- PostgreSQL database ran inside a Docker container
- All database commands went through Docker
- Data was stored in Docker volumes (virtual storage)
- Required Docker Desktop or Docker Engine to be installed and running

### Original Commands (Docker-based)
```bash
npm run db:start      # Started PostgreSQL container
npm run db:stop       # Stopped PostgreSQL container
npm run db:restart    # Restarted PostgreSQL container
npm run db:shell      # Connected to container's PostgreSQL
npm run db:logs       # Viewed container logs
npm run db:reset      # Removed and recreated container
```

### Files Using Docker
1. **package.json** - Had Docker commands in npm scripts
2. **scripts/start-db.js** - Script to start Docker container
3. **docker-compose.yml** - Configuration for PostgreSQL container
4. **.env** - Had `DATA_STORAGE_MODE=docker` setting

---

## ❌ Why Remove Docker?

### Problems with Docker
1. **Extra Installation** - Requires Docker to be installed separately
2. **System Overhead** - Containers use additional system resources
3. **Complexity** - Another tool to manage and troubleshoot
4. **Not Always Available** - Some systems/environments don't have Docker
5. **Group Work Issues** - Different team members might have Docker setup problems

### Benefit of Local PostgreSQL
- ✅ Simple and direct connection
- ✅ No extra tools needed
- ✅ Works everywhere PostgreSQL is installed
- ✅ Easier debugging and development
- ✅ Native system integration

---

## 🔧 What Was Changed?

### 1. **package.json** - Database Commands Updated

**BEFORE (Docker):**
```json
"db:start": "docker compose up -d postgres",
"db:stop": "docker compose down",
"db:restart": "docker compose restart postgres",
"db:shell": "docker compose exec postgres psql -U pawsco_user -d pawsco_dev",
"db:reset": "docker compose down -v && npm run db:start && sleep 15 && npm run db:migrate",
```

**AFTER (Local PostgreSQL):**
```json
"db:start": "echo 'PostgreSQL is running locally - no action needed'",
"db:stop": "echo 'PostgreSQL is running locally - no action needed'",
"db:restart": "echo 'PostgreSQL is running locally - no action needed'",
"db:shell": "psql -U pawsco_user -d pawsco_dev -h 127.0.0.1",
"db:reset": "npm run db:migrate",
```

**Key Changes:**
- ❌ Removed all `docker compose` commands
- ✅ Direct `psql` command for database shell
- ✅ Simpler reset (just migrate, no container recreation)
- ℹ️ Start/stop commands now just echo info (PostgreSQL runs as system service)

---

### 2. **scripts/start-db.js** - Database Connection Script Updated

**BEFORE (Docker):**
```javascript
// Tried to run: docker compose up -d postgres
// Checked: docker compose version
// Waited for container health check
// Failed if Docker wasn't installed
```

**AFTER (Local PostgreSQL):**
```javascript
// Simple connection test to local PostgreSQL
// Uses psql to check: SELECT 1;
// No Docker dependency
// Clear error messages if PostgreSQL isn't running

// Test connection:
psql -h localhost -p 5432 -U pawsco_user -d pawsco_dev -c "SELECT 1;"
```

**Key Changes:**
- ❌ Removed Docker Compose commands
- ✅ Direct PostgreSQL connection test
- ✅ Better error messages for troubleshooting

---

### 3. **.env** - Environment Configuration

**BEFORE (Docker):**
```env
DATA_STORAGE_MODE=docker
# Data stored in Docker volume: pawsco_db_data
```

**AFTER (Local PostgreSQL):**
```env
DB_USER=pawsco_user
DB_PASS=password_123
DB_NAME=pawsco_dev
DB_HOST=127.0.0.1
DB_PORT=5432
NODE_ENV=development
DATA_STORAGE_MODE=local
```

**Key Changes:**
- ✅ Direct database credentials
- ✅ Connection settings for local PostgreSQL
- ℹ️ DATA_STORAGE_MODE now set to 'local'

---

## 🚀 How to Use Local PostgreSQL

### Prerequisites
```bash
# Check if PostgreSQL is installed
psql --version
# Output: psql (PostgreSQL) 16.11 (Ubuntu...)

# Check if PostgreSQL is running
sudo systemctl status postgresql
# Should show: Active: active (running)
```

### Setup Steps

#### 1. Create Database User
```bash
sudo -u postgres createuser -d pawsco_user
sudo -u postgres psql -c "ALTER USER pawsco_user WITH PASSWORD 'password_123';"
```

#### 2. Create Database
```bash
sudo -u postgres createdb -O pawsco_user pawsco_dev
```

#### 3. Initialize Database with Schema
```bash
npm run db:migrate
# Or: node db/seed.js
```

#### 4. Connect to Database (Manual)
```bash
# Using npm script:
npm run db:shell

# Or directly:
psql -U pawsco_user -d pawsco_dev -h 127.0.0.1
# Password: password_123
```

#### 5. Start the Server
```bash
npm start
# Server runs on: http://localhost:3001
```

---

## 📊 Comparison: Docker vs Local PostgreSQL

| Feature | Docker | Local PostgreSQL |
|---------|--------|------------------|
| Installation | Need Docker + Docker Desktop | Just PostgreSQL package |
| System Resources | Uses container overhead | Direct system access |
| Startup Time | ~5-10 seconds | Instant |
| Data Persistence | Docker volume | System postgres_data |
| Database Shell | `docker exec` command | Direct `psql` command |
| Debugging | Container logs | System logs |
| Team Compatibility | Everyone needs Docker | Standard PostgreSQL setup |
| Backup/Restore | Docker volume backup | Standard PostgreSQL backup |

---

## 🔍 Troubleshooting

### Problem: "psql: command not found"
**Solution:**
```bash
# Install PostgreSQL client tools
sudo apt-get update
sudo apt-get install postgresql-client

# Or install full PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

### Problem: "Connection refused"
**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start it if not running
sudo systemctl start postgresql
```

### Problem: "Database pawsco_dev does not exist"
**Solution:**
```bash
# Create the database and run migration
npm run db:setup
# Or manually:
sudo -u postgres createdb -O pawsco_user pawsco_dev
npm run db:migrate
```

### Problem: "Role 'pawsco_user' does not exist"
**Solution:**
```bash
# Create the user
sudo -u postgres createuser -d pawsco_user
sudo -u postgres psql -c "ALTER USER pawsco_user WITH PASSWORD 'password_123';"
```

---

## 📝 Quick Reference

### Essential Commands
```bash
# Setup (one time)
npm install
npm run db:setup

# Development
npm start              # Start server
npm run db:shell       # Access database
npm run db:migrate     # Reset database
npm run dev            # Start with auto-reload

# Monitoring
npm run db:health      # Check database health
npm run db:diagnose    # Run diagnostics
```

### File Locations
- **Database schema:** `/db/schema.sql`
- **Seed data:** `/db/seed.js`
- **Database pool:** `/db/pool.js`
- **Config:** `/.env`
- **Server:** `/bin/www`
- **Routes:** `/routes/`

---

## ✅ Summary

| What Changed | Before | After |
|--------------|--------|-------|
| **Database Container** | Docker Compose | Removed |
| **Connection Method** | Docker exec | Direct psql |
| **Data Storage** | Docker volume | PostgreSQL directory |
| **Setup Complexity** | High (Docker + DB) | Low (PostgreSQL only) |
| **System Service** | Manual container | System PostgreSQL service |
| **Team Compatibility** | Docker required | PostgreSQL only |

---

## 🎯 Key Takeaway

**The project now uses a direct local PostgreSQL installation instead of Docker containers.** This simplifies setup, reduces complexity, and makes the project more accessible to all team members without requiring additional containerization tools.

All functionality remains the same—only the deployment method changed from containerized to native system service.
