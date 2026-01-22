#!/bin/bash

# GameVault Database Setup Script
# This script sets up the PostgreSQL database for GameVault

set -e

echo "🎮 GameVault Database Setup"
echo "=============================="

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gamevault}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if PostgreSQL is running
check_postgres() {
    echo "📡 Checking PostgreSQL connection..."
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw postgres; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
        return 1
    fi
}

# Function to create database
create_database() {
    echo "🗄️  Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"
    echo -e "${GREEN}✅ Database created or already exists${NC}"
}

# Function to run schema
run_schema() {
    echo "📋 Running database schema..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./database/schema.sql
    echo -e "${GREEN}✅ Schema created successfully${NC}"
}

# Function to run seed data
run_seed() {
    echo "🌱 Loading seed data..."
    if [ -f ./database/seed.sql ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./database/seed.sql
        echo -e "${GREEN}✅ Seed data loaded successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Seed file not found, skipping...${NC}"
    fi
}

# Main execution
main() {
    if ! check_postgres; then
        echo -e "${YELLOW}💡 Tip: Start PostgreSQL with Docker: docker-compose up -d postgres${NC}"
        exit 1
    fi

    create_database
    run_schema
    run_seed

    echo ""
    echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
    echo ""
    echo "Database Information:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend"
    echo "  2. npm install"
    echo "  3. npm run dev"
    echo ""
}

# Run main function
main
