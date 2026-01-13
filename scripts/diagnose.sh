#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Paws & Company - Diagnostics${NC}\n"
echo "═══════════════════════════════════════════════════════════════\n"

# 1. Docker Status
echo -e "${BLUE}1️⃣  Docker Status:${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✅ Docker daemon is running${NC}"
    else
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "   Run: sudo systemctl start docker"
    fi
else
    echo -e "${RED}❌ Docker not installed${NC}"
fi
echo ""

# 2. Docker Compose Version
echo -e "${BLUE}2️⃣  Docker Compose:${NC}"
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ docker-compose: $(docker-compose --version)${NC}"
elif docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (integrated): $(docker compose version)${NC}"
else
    echo -e "${RED}❌ Docker Compose not found${NC}"
fi
echo ""

# 3. Container Status
echo -e "${BLUE}3️⃣  Container Status:${NC}"
if docker ps -a --filter "name=pawsco_db" | grep -q pawsco_db; then
    if docker ps --filter "name=pawsco_db" | grep -q pawsco_db; then
        echo -e "${GREEN}✅ Container pawsco_db is RUNNING${NC}"
        docker port pawsco_db
    else
        echo -e "${YELLOW}⚠️  Container pawsco_db exists but is STOPPED${NC}"
        echo "   Run: docker compose up -d postgres"
    fi
else
    echo -e "${YELLOW}⚠️  Container pawsco_db does not exist${NC}"
    echo "   Run: docker compose up -d postgres"
fi
echo ""

# 4. Network Status
echo -e "${BLUE}4️⃣  Network Status:${NC}"
if docker network ls --filter "name=pawsco_network" | grep -q pawsco_network; then
    echo -e "${GREEN}✅ Network 'pawsco_network' exists${NC}"
else
    echo -e "${RED}❌ Network 'pawsco_network' not found${NC}"
fi
echo ""

# 5. Database Connectivity
echo -e "${BLUE}5️⃣  Database Connectivity:${NC}"
if command -v psql &> /dev/null; then
    if psql -h localhost -U pawsco_user -d pawsco_dev -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is accessible on localhost:5432${NC}"
    else
        echo -e "${RED}❌ PostgreSQL on localhost:5432 is not accessible${NC}"
    fi
elif docker compose exec -T postgres pg_isready -U pawsco_user &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is ready inside container${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL health check inconclusive${NC}"
fi
echo ""

# 6. Environment Variables
echo -e "${BLUE}6️⃣  Environment Variables:${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    echo "   DB_HOST=$(grep DB_HOST .env | cut -d= -f2)"
    echo "   DB_PORT=$(grep DB_PORT .env | cut -d= -f2)"
    echo "   NODE_ENV=$(grep NODE_ENV .env | cut -d= -f2)"
else
    echo -e "${RED}❌ .env file not found${NC}"
fi
echo ""

# 7. Node.js & npm
echo -e "${BLUE}7️⃣  Node.js & npm:${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm not installed${NC}"
fi
echo ""

# 8. Database Tables
echo -e "${BLUE}8️⃣  Database Tables:${NC}"
if docker compose exec -T postgres psql -U pawsco_user -d pawsco_dev -c "\dt" 2>/dev/null | grep -q "users\|pets"; then
    echo -e "${GREEN}✅ Database tables exist${NC}"
    docker compose exec -T postgres psql -U pawsco_user -d pawsco_dev -c "\dt" 2>/dev/null | tail -n +3
else
    echo -e "${YELLOW}⚠️  No database tables found${NC}"
    echo "   Run: npm run db:seed"
fi
echo ""

# 9. Port Availability
echo -e "${BLUE}9️⃣  Port Availability:${NC}"
if ! lsof -i :3001 &> /dev/null; then
    echo -e "${GREEN}✅ Port 3001 is available${NC}"
else
    echo -e "${YELLOW}⚠️  Port 3001 is in use${NC}"
    lsof -i :3001
fi

if ! lsof -i :5432 &> /dev/null; then
    echo -e "${GREEN}✅ Port 5432 is available${NC}"
else
    echo -e "${YELLOW}⚠️  Port 5432 is in use (likely Docker)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

echo -e "Next steps:"
echo "1. Start database:  ${YELLOW}npm run db:start${NC}"
echo "2. Seed database:   ${YELLOW}npm run db:seed${NC}"
echo "3. Start server:    ${YELLOW}npm start${NC}"
echo "4. Visit:           ${YELLOW}http://localhost:3001${NC}\n"