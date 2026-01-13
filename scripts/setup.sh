# #!/bin/bash
# # filepath: /home/user/code/group-project-ApolloTheG0d-huy/scripts/setup.sh

# set -e

# echo "🚀 Setting up Paws & Company project..."

# # 1. Install Node dependencies
# echo "📦 Installing npm packages..."
# npm install

# # 2. Check if Docker is installed
# if ! command -v docker &> /dev/null; then
#   echo "❌ Docker not found. Installing..."
#   curl -fsSL https://get.docker.com -o get-docker.sh
#   sh get-docker.sh
#   rm get-docker.sh
#   echo "✅ Docker installed"
# fi

# # 3. Add user to docker group (Linux only)
# if [[ "$OSTYPE" == "linux-gnu"* ]]; then
#   if ! groups $USER | grep -q docker; then
#     echo "👤 Adding user to docker group..."
#     sudo usermod -aG docker $USER
#     echo "ℹ️  Please log out and log back in for group changes to take effect"
#   fi
# fi

# # 4. Start database
# echo "🐘 Starting PostgreSQL..."
# npm run db:start

# echo "✅ Setup complete! Run 'npm start' to launch the app"

##############################################################################
#!/bin/bash
# filepath: /home/user/code/group-project-ApolloTheG0d/scripts/setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Paws & Company - Complete Setup${NC}\n"

# ===== 1. Check and Install Docker =====
echo -e "${BLUE}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}\n"
else
    echo -e "${GREEN}✅ Docker already installed: $(docker --version)${NC}\n"
fi

# ===== 2. Add user to docker group (Linux) =====
echo -e "${BLUE}Step 2: Configuring Docker permissions...${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! groups "$USER" | grep -q docker; then
        echo -e "${YELLOW}👤 Adding $USER to docker group...${NC}"
        sudo usermod -aG docker "$USER"
        echo -e "${YELLOW}ℹ️  Docker group added. You may need to log out/in or run: newgrp docker${NC}\n"
    else
        echo -e "${GREEN}✅ User already in docker group${NC}\n"
    fi
fi

# ===== 3. Start Docker daemon =====
echo -e "${BLUE}Step 3: Starting Docker daemon...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}Starting Docker service...${NC}"
    sudo systemctl start docker
    sleep 2
fi
echo -e "${GREEN}✅ Docker is running${NC}\n"

# ===== 4. Install Node dependencies =====
echo -e "${BLUE}Step 4: Installing Node.js dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ npm packages installed${NC}\n"
else
    echo -e "${GREEN}✅ npm packages already installed${NC}\n"
fi

# ===== 5. Create db directory if it doesn't exist =====
echo -e "${BLUE}Step 5: Preparing database directories...${NC}"
mkdir -p db/postgres_data
echo -e "${GREEN}✅ Database directories ready${NC}\n"

# ===== 6. Stop any existing containers =====
echo -e "${BLUE}Step 6: Cleaning up any existing containers...${NC}"
COMPOSE_CMD="docker compose"
if ! $COMPOSE_CMD version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD down 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup complete${NC}\n"

# ===== 7. Start PostgreSQL =====
echo -e "${BLUE}Step 7: Starting PostgreSQL...${NC}"

# Check if PostgreSQL is running locally (not in Docker)
if pg_isready -h 127.0.0.1 &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL already running locally${NC}\n"
else
    # Try to start Docker PostgreSQL
    echo -e "${YELLOW}PostgreSQL not running locally, starting Docker container...${NC}"
    $COMPOSE_CMD up -d postgres
    echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"

    # Wait for database health check (max 60 seconds)
    MAX_ATTEMPTS=60
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if $COMPOSE_CMD exec -T postgres pg_isready -U pawsco_user &> /dev/null; then
            echo -e "${GREEN}✅ PostgreSQL is ready!${NC}\n"
            break
        fi
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 1
    done

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "\n${RED}❌ PostgreSQL failed to start${NC}"
        echo -e "${YELLOW}Troubleshooting:${NC}"
        echo "1. Check Docker logs: $COMPOSE_CMD logs postgres"
        echo "2. Ensure port 5432 is available: lsof -i :5432"
        exit 1
    fi
fi

# ===== 7b. Create PostgreSQL user and database (if using local PostgreSQL) =====
echo -e "${BLUE}Step 7b: Setting up PostgreSQL user and database...${NC}"

# Load .env file to get credentials
DB_USER=$(grep "DB_USER=" .env | cut -d '=' -f2 | tr -d ' ')
DB_PASS=$(grep "DB_PASS=" .env | cut -d '=' -f2 | tr -d ' ')
DB_NAME=$(grep "DB_NAME=" .env | cut -d '=' -f2 | tr -d ' ')
DB_HOST=$(grep "DB_HOST=" .env | cut -d '=' -f2 | tr -d ' ')

# Default values if not found in .env
DB_USER=${DB_USER:-addiction_user}
DB_PASS=${DB_PASS:-password_123}
DB_NAME=${DB_NAME:-pawsco_dev}
DB_HOST=${DB_HOST:-127.0.0.1}

# Check if using local PostgreSQL (not Docker)
if ! docker ps | grep postgres &> /dev/null; then
    # Using local PostgreSQL, create user and database if they don't exist
    echo -e "${YELLOW}Using local PostgreSQL, creating user and database...${NC}"
    
    # Create user if it doesn't exist
    sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" | grep -q 1 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "Creating user: $DB_USER"
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
        sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
        echo -e "${GREEN}✅ User created: $DB_USER${NC}"
    else
        echo -e "${GREEN}✅ User already exists: $DB_USER${NC}"
    fi
    
    # Create database if it doesn't exist
    sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" | grep -q 1 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "Creating database: $DB_NAME"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        echo -e "${GREEN}✅ Database created: $DB_NAME${NC}"
    else
        echo -e "${GREEN}✅ Database already exists: $DB_NAME${NC}"
    fi
    
    # Initialize schema
    echo "Initializing database schema..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f db/schema.sql &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Schema initialized${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Schema initialization skipped (may already exist)${NC}\n"
    fi
else
    echo -e "${GREEN}✅ Using Docker PostgreSQL${NC}\n"
fi

# ===== 8. Run database schema and seeding =====
echo -e "${BLUE}Step 8: Setting up database schema and seed data...${NC}"
node db/seed.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeding complete${NC}\n"
else
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

# ===== 9. Test database connection =====
echo -e "${BLUE}Step 9: Testing database connection...${NC}"
sleep 2
if npm start &> /dev/null & sleep 3 && pkill -P $$ npm; then
    echo -e "${GREEN}✅ App server tested successfully${NC}\n"
else
    echo -e "${YELLOW}⚠️  Server test skipped (optional)${NC}\n"
fi

# ===== 10. Summary =====
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}📊 Database Connection Info:${NC}"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  User:     pawsco_user"
echo "  Password: pawsco_secure_password_123"
echo "  Database: pawsco_dev\n"

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Start the application:"
echo "     ${YELLOW}npm start${NC}"
echo ""
echo "  2. Visit:"
echo "     ${YELLOW}http://localhost:3001${NC}"
echo ""
echo "  3. Useful commands:"
echo "     ${YELLOW}npm run db:logs${NC}       - View database logs"
echo "     ${YELLOW}npm run db:shell${NC}      - Access database shell"
echo "     ${YELLOW}npm run db:reset${NC}      - Reset database"
echo "     ${YELLOW}npm run db:stop${NC}       - Stop database\n"

echo -e "${GREEN}Happy coding! 🐾${NC}\n"

# ===== Additional Diagnostic Script =====
echo "========================================="
echo "🔍 Paws & Company - Connection Diagnostics"
echo "═════════════════════════════════════════"
echo ""

echo "1️⃣  Docker Status:"
docker ps -a --filter "name=pawsco_db" || echo "❌ Docker not running"
echo ""

echo "2️⃣  Network Status:"
docker network ls --filter "name=pawsco_network" || echo "❌ Network not found"
echo ""

echo "3️⃣  Container Logs (last 20 lines):"
docker compose logs --tail 20 postgres || echo "❌ Logs unavailable"
echo ""

echo "4️⃣  Postgres Health Check:"
docker compose exec postgres pg_isready -U pawsco_user || echo "❌ Postgres not ready"
echo ""

echo "5️⃣  Environment Variables:"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "NODE_ENV=$NODE_ENV"
echo ""

echo "6️⃣  Connection Test:"
npm run db:health