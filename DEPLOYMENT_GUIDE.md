# 🎮 GameVault - Deployment Guide

## ✅ Project Status

The **GameVault** project is fully functional with:

- ✅ **Backend API** running at `http://localhost:3000`
- ✅ **Frontend Web** running at `http://localhost:3001`
- ✅ **PostgreSQL Database** persisting data at `localhost:5432`
- ✅ **PGAdmin** for database management at `http://localhost:5050`

---

## 🚀 How to Start the Project

### Option 1: Start Everything in Background

```bash
# Navigate to project directory
cd /workspaces/GAMEVAULT

# Start docker (database)
docker-compose up -d

# Wait 10 seconds for database to be ready
sleep 10

# Start backend
cd backend && npm start &

# Start frontend
cd ../frontend-web && npm start &
```

### Option 2: Start Manually in Separate Terminals

**Terminal 1 - Docker (Database):**
```bash
cd /workspaces/GAMEVAULT
docker-compose up
```

**Terminal 2 - Backend:**
```bash
cd /workspaces/GAMEVAULT/backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd /workspaces/GAMEVAULT/frontend-web
npm start
```

---

## 📊 Access the Database

### Via PGAdmin (Web Interface)
- URL: `http://localhost:5050`
- Email: `admin@gamevault.com`
- Password: `admin`

### Via Command Line
```bash
docker exec gamevault_postgres psql -U postgres -d gamevault
```

### Useful PostgreSQL Commands
```sql
-- List all tables
\dt

-- View registered users
SELECT id, name, email, user_type, created_at FROM users;

-- View user details
SELECT * FROM users WHERE email='your-email@example.com';

-- Count total users
SELECT COUNT(*) as total_users FROM users;
```

---

## 🔐 Test Users (Seed Data)

The database comes with 3 test users:

| Email | Type | Password |
|-------|------|----------|
| admin@gamevault.com | Admin | (needs reset) |
| john@example.com | Regular | (needs reset) |
| jane@example.com | Regular | (needs reset) |

---

## 📝 Register New Users

### Via Frontend
1. Access `http://localhost:3001`
2. Click "Create Account"
3. Fill in: Name, Email, Password
4. Click "Sign Up"

### Via Backend (cURL)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your-email@example.com",
    "password": "StrongPassword123!"
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": 4,
      "name": "Your Name",
      "email": "your-email@example.com",
      "type": "regular"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔑 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get authenticated user data

### Health
- `GET /api/health` - API status
- `GET /` - API information

---

## 💾 Data Persistence

Data is persisted in **Docker Volumes**:

- **postgres_data** - Stores PostgreSQL database
- **pgadmin_data** - Stores PGAdmin configuration

### View Volumes
```bash
docker volume ls | grep gamevault
```

### Backup Database
```bash
docker exec gamevault_postgres pg_dump -U postgres -d gamevault > backup.sql
```

### Restore from Backup
```bash
docker exec -i gamevault_postgres psql -U postgres -d gamevault < backup.sql
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" on port 3000/3001

**Solution:**
```bash
# Check if servers are running
lsof -i :3000
lsof -i :3001

# Kill old processes
pkill -f "node.*index.js"
pkill -f "react-scripts"

# Restart
cd /workspaces/GAMEVAULT/backend && npm start
cd /workspaces/GAMEVAULT/frontend-web && npm start
```

### Issue: PostgreSQL ENUM type error

**Solution:** (already resolved)
Sequelize is configured to **NOT auto-sync**. Use SQL scripts in `database/schema.sql` and `database/seed.sql`.

### Issue: Database not starting

**Solution:**
```bash
# Remove old containers and volumes
docker-compose down -v

# Restart everything
docker-compose up -d
```

---

## 📦 Project Structure

```
GAMEVAULT/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Controllers
│   │   ├── middlewares/     # Middleware (auth, errors)
│   │   └── config/          # Configuration (database)
│   └── package.json
├── frontend-web/            # React App
│   ├── src/
│   │   ├── pages/           # Pages (Login, Register, Home)
│   │   ├── components/      # Reusable components
│   │   ├── services/        # Services (API, Auth)
│   │   ├── contexts/        # Context API (Auth)
│   │   └── types/           # TypeScript types
│   └── package.json
├── database/                # SQL scripts
│   ├── schema.sql           # Table structure
│   └── seed.sql             # Test data
└── docker-compose.yml       # Docker configuration
```

---

## 🌐 Cloud Deployment (Next Steps)

For production deployment, consider:

1. **Backend Hosting:**
   - Heroku, Railway, Render, DigitalOcean
   - Environment variables: `NODE_ENV=production`, `DATABASE_URL`

2. **Frontend Hosting:**
   - Vercel, Netlify, GitHub Pages
   - Variable: `REACT_APP_API_URL` (backend URL)

3. **Database:**
   - AWS RDS PostgreSQL
   - DigitalOcean Managed Database
   - Azure Database for PostgreSQL

4. **CORS Configuration:**
   - Update `CORS_ORIGIN` in backend
   - SSL/TLS certificate

---

## 📝 Important Notes

- ✅ All data is saved in PostgreSQL
- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Authentication uses JWT tokens
- ✅ Frontend synchronized with backend
- ✅ Database with complete schema

---

**Last Update:** January 26, 2026
**Status:** ✅ Fully Functional and Ready for Use
