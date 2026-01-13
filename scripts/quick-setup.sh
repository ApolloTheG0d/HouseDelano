#!/bin/bash

# Paws & Company - Quick Setup Script
# This script sets up the database and seeds it with initial data

set -e

echo -e "\033[34m🚀 Paws & Company - Quick Setup\033[0m\n"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check if .env exists
echo -e "${BLUE}Step 1: Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << 'ENVFILE'
DB_USER=addiction_user
DB_PASS=password_123
DB_NAME=pawsco_dev
DB_HOST=127.0.0.1
DB_PORT=5432
NODE_ENV=development
PORT=3001
SESSION_SECRET=your_secret_key_here_change_in_production
ENVFILE
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Step 2: Install npm packages if needed
echo -e "${BLUE}Step 2: Installing npm dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ npm packages installed${NC}"
else
    echo -e "${GREEN}✅ npm packages already installed${NC}"
fi
echo ""

# Step 3: Setup database (create user and database)
echo -e "${BLUE}Step 3: Setting up PostgreSQL...${NC}"

# Auto-fix: Reset PostgreSQL user password if needed
echo -e "${YELLOW}🔧 Auto-fixing PostgreSQL password...${NC}"
sudo -u postgres psql -c "ALTER USER addiction_user WITH PASSWORD 'password_123';" 2>/dev/null || true
echo -e "${GREEN}✅ PostgreSQL password synced${NC}"

npm run db:init

# Auto-fix: Fix table ownership issues
echo -e "${YELLOW}🔧 Auto-fixing table ownership...${NC}"
sudo -u postgres psql -d pawsco_dev -c "
SELECT 'ALTER TABLE ' || schemaname || '.' || tablename || ' OWNER TO addiction_user;' 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');" 2>/dev/null | grep ALTER | while read cmd; do
  sudo -u postgres psql -d pawsco_dev -c "$cmd" 2>/dev/null || true
done
echo -e "${GREEN}✅ Table ownership fixed${NC}"

# Step 4: Seed database
echo -e "${BLUE}Step 4: Seeding database with initial data...${NC}"
npm run db:seed

# Done
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}📊 Database Configuration:${NC}"
echo "   Host:     127.0.0.1"
echo "   Port:     5432"
echo "   User:     addiction_user"
echo "   Database: pawsco_dev\n"

echo -e "${BLUE}🚀 Quick start:${NC}"
echo "   npm start\n"

echo -e "${BLUE}📱 Then visit:${NC}"
echo "   http://localhost:3001\n"

echo -e "${BLUE}🔑 Admin login:${NC}"
echo "   Email:    admin@pawsco.com"
echo "   Password: password123\n"
