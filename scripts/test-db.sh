#!/bin/bash

# Test database connection and display info

echo "🔍 Testing Database Connection"
echo "==============================="
echo ""

# Load environment variables
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gamevault}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Test connection
echo "Connecting to PostgreSQL..."
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    echo ""
    
    # Get table count
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo "📊 Database Statistics:"
    echo "   Tables: $TABLE_COUNT"
    
    # Get user count
    USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    echo "   Users: $USER_COUNT"
    
    # Get game count
    GAME_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM games;" 2>/dev/null || echo "0")
    echo "   Games: $GAME_COUNT"
    
    # Get platform count
    PLATFORM_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM platforms;" 2>/dev/null || echo "0")
    echo "   Platforms: $PLATFORM_COUNT"
    
    echo ""
    echo "✅ Database is ready to use!"
else
    echo "❌ Failed to connect to database"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if PostgreSQL is running: docker ps"
    echo "2. Verify credentials in backend/.env"
    echo "3. Try: docker-compose up -d postgres"
    exit 1
fi
