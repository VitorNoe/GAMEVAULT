#!/bin/bash

# GameVault Quick Start Script
# Complete setup and launch for the GameVault application

set -e

echo "🎮 GameVault Quick Start"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo "Install Docker to use the automated database setup"
    echo "Or install PostgreSQL manually and run: ./scripts/setup-database.sh"
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⏭️  Backend dependencies already installed${NC}"
fi

# Install frontend dependencies
if [ ! -d "frontend-web/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend-web
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⏭️  Frontend dependencies already installed${NC}"
fi

echo ""
echo "🗄️  Setting up database..."
echo ""

# Start PostgreSQL with Docker
if command -v docker-compose &> /dev/null; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    echo -e "${BLUE}📊 pgAdmin available at: http://localhost:5050${NC}"
    echo "   Email: admin@gamevault.com"
    echo "   Password: admin"
else
    echo -e "${YELLOW}⚠️  Docker Compose not available${NC}"
    echo "Make sure PostgreSQL is running manually"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo -e "${GREEN}To start the application:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "  cd frontend-web"
echo "  npm start"
echo ""
echo -e "${GREEN}Access points:${NC}"
echo "  🌐 Frontend: http://localhost:3001"
echo "  🔌 Backend API: http://localhost:3000"
echo "  📊 Database Admin: http://localhost:5050"
echo ""
