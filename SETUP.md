# GameVault Setup Guide

Complete guide to set up and run the GameVault application locally.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or use Docker)
- Git

## Quick Start with Docker (Recommended)

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend-web
npm install
```

### 2. Start PostgreSQL Database

```bash
# From project root
docker-compose up -d postgres
```

This will:
- Start PostgreSQL on port 5432
- Create the `gamevault` database
- Run schema creation automatically
- Load sample seed data

### 3. Verify Database

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Optional: Access pgAdmin at http://localhost:5050
# Email: admin@gamevault.com
# Password: admin
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`

### 5. Start Frontend

```bash
cd frontend-web
npm start
```

The web app will be available at `http://localhost:3001`

## Manual PostgreSQL Setup (Without Docker)

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# In psql console:
CREATE DATABASE gamevault;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE gamevault TO postgres;
\q
```

### 3. Run Schema

```bash
# Run schema creation
psql -U postgres -d gamevault -f database/schema.sql

# Optional: Load seed data
psql -U postgres -d gamevault -f database/seed.sql
```

## Environment Variables

### Backend (.env)

The `.env` file is already created in the backend folder. Update if needed:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamevault
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=gamevault_secret_key_dev_only
JWT_EXPIRES_IN=7d
```

### Frontend (.env)

The `.env` file is already created in the frontend-web folder:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_NAME=GameVault
REACT_APP_ENV=development
```

## Available Scripts

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Frontend

```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Games
- `GET /api/games` - Get all games (with pagination)
- `GET /api/games/:id` - Get game by ID
- `POST /api/games` - Create game (admin only)
- `PUT /api/games/:id` - Update game (admin only)
- `DELETE /api/games/:id` - Delete game (admin only)

### Platforms
- `GET /api/platforms` - Get all platforms
- `GET /api/platforms/:id` - Get platform by ID
- `POST /api/platforms` - Create platform (admin only)
- `PUT /api/platforms/:id` - Update platform (admin only)
- `DELETE /api/platforms/:id` - Delete platform (admin only)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID (admin only)

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get games (with auth token)
curl http://localhost:3000/api/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using the Frontend

1. Navigate to `http://localhost:3001`
2. Click "Register" to create an account
3. Login with your credentials
4. Browse games and explore features

## Database Management

### Access Database

```bash
# Using Docker
docker exec -it gamevault_postgres psql -U postgres -d gamevault

# Local PostgreSQL
psql -U postgres -d gamevault
```

### Common SQL Queries

```sql
-- View all users
SELECT id, name, email, user_type FROM users;

-- View all games
SELECT id, title, release_status, availability_status FROM games;

-- View all platforms
SELECT id, name, type, manufacturer FROM platforms;

-- Reset database (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Check if PostgreSQL is running:
```bash
docker-compose ps
# or
sudo systemctl status postgresql
```

2. Verify credentials in `.env` file
3. Check firewall settings
4. Ensure database exists:
```bash
psql -U postgres -l
```

### CORS Errors

1. Verify `CORS_ORIGIN` in backend `.env`
2. Ensure frontend is running on correct port
3. Clear browser cache

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Environment Variables

Update the following for production:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASSWORD=<secure-password>
CORS_ORIGIN=https://your-domain.com
```

### Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend-web
npm run build
# Serve the 'build' folder with nginx or similar
```

## Support

For issues and questions:
- Check existing documentation
- Review error logs
- Open an issue on GitHub

## License

MIT License - See LICENSE file for details
