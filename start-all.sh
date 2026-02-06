#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║    GameVault - Complete Startup      ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

cd /workspaces/GAMEVAULT

# Check if Docker is running
echo -e "${YELLOW}1️⃣  Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start Docker services
echo -e "${YELLOW}2️⃣  Starting database (PostgreSQL + PGAdmin)...${NC}"
docker-compose up -d
sleep 10
echo -e "${GREEN}✅ Database started${NC}"

# Verify database
echo -e "${YELLOW}3️⃣  Checking database connection...${NC}"
if docker exec gamevault_postgres psql -U postgres -d gamevault -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connected${NC}"
else
    echo -e "${RED}❌ Error connecting to database${NC}"
    exit 1
fi

# Start backend
echo -e "${YELLOW}4️⃣  Starting Backend (port 3000)...${NC}"
cd backend
npm install > /dev/null 2>&1
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 5

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running at http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Error starting backend${NC}"
    cat /tmp/backend.log
    exit 1
fi

# Start frontend
echo -e "${YELLOW}5️⃣  Starting Frontend (port 3001)...${NC}"
cd ../frontend-web
npm install > /dev/null 2>&1
BROWSER=none PORT=3001 npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 20

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running at http://localhost:3001${NC}"
else
    echo -e "${RED}⚠️  Frontend may still be compiling${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗"
echo "║  🎮 GameVault is ready! 🎮          ║"
echo "╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo "  🌐 Frontend:  http://localhost:3001"
echo "  🔌 Backend:   http://localhost:3000"
echo "  📊 PGAdmin:   http://localhost:5050 (admin@gamevault.com / admin)"
echo "  💾 Database:  localhost:5432"
echo ""
echo -e "${YELLOW}Background Processes:${NC}"
echo "  Backend PID:   $BACKEND_PID"
echo "  Frontend PID:  $FRONTEND_PID"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo "  pkill -f 'npm start'"
echo "  docker-compose down"
echo ""
