# 🚀 GameVault - How to Start

Quick reference guide to start the GameVault application.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Docker running (for database)
- ✅ Dependencies installed (run if not sure):
  ```bash
  cd backend && npm install
  cd ../frontend-web && npm install --legacy-peer-deps
  ```

## Option 1: Quick Start (2 Terminals)

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Database connection established
✅ Database models synchronized
🎮 GameVault API running on http://localhost:3000
📍 Environment: development
✅ CORS enabled for: http://localhost:3001
🔗 Health check: http://localhost:3000/api/health
```

### Terminal 2: Start Frontend
```bash
cd frontend-web
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view gamevault-frontend in the browser.

  Local:            http://localhost:3001
  On Your Network:  http://192.168.x.x:3001
```

**That's it!** Open http://localhost:3001 in your browser.

---

## Option 2: Background Mode

### Start Backend in Background
```bash
cd backend
npm run dev > backend.log 2>&1 &
echo $! > backend.pid
```

### Start Frontend in Background
```bash
cd frontend-web
npm start > frontend.log 2>&1 &
echo $! > frontend.pid
```

### Stop Services
```bash
# Stop backend
kill $(cat backend/backend.pid)

# Stop frontend
kill $(cat frontend-web/frontend.pid)
```

---

## Verify Everything is Working

### 1. Check Backend Health
```bash
curl http://localhost:3000/api/health
```

**Should return:**
```json
{
  "success": true,
  "message": "GameVault API is running",
  "timestamp": "2026-01-22T..."
}
```

### 2. Check Games Endpoint
```bash
curl http://localhost:3000/api/games
```

### 3. Check Frontend
Open browser: http://localhost:3001

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3001 | Web application |
| **Backend API** | http://localhost:3000/api | REST API |
| **Health Check** | http://localhost:3000/api/health | API status |
| **Database (pgAdmin)** | http://localhost:5050 | Database GUI |
| **PostgreSQL** | localhost:5432 | Direct DB access |

---

## Common Issues

### Port 3000 Already in Use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Port 3001 Already in Use
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Database Not Running
```bash
# Check status
docker ps | grep postgres

# Start if stopped
docker-compose up -d postgres

# Check logs
docker logs gamevault-postgres
```

### Cannot Connect to Database
```bash
# Test connection
./scripts/test-db.sh

# Restart database
docker-compose restart postgres
```

### Frontend Shows API Error
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check [frontend-web/.env](../frontend-web/.env) has correct API URL
3. Check CORS settings in [backend/.env](../backend/.env)

---

## Development Workflow

### 1. Start Development
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend-web && npm start
```

### 2. Make Changes
- Edit files in `backend/src/` or `frontend-web/src/`
- Both have hot reload - changes appear automatically

### 3. Test API
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 4. View Database
```bash
# CLI
docker exec -it gamevault-postgres psql -U postgres -d gamevault

# Or use pgAdmin: http://localhost:5050
```

---

## Stop Everything

### Stop Terminals
Press `Ctrl+C` in each terminal running the services

### Stop Database (optional)
```bash
docker-compose stop postgres
```

### Stop All
```bash
# Kill all node processes (careful!)
pkill -f "node"

# Or individually
pkill -f "ts-node-dev"  # backend
pkill -f "react-scripts" # frontend
```

---

## Restart After Stopping

### Full Restart
```bash
# 1. Ensure database is running
docker-compose start postgres

# 2. Start backend
cd backend && npm run dev

# 3. Start frontend (new terminal)
cd frontend-web && npm start
```

### Restart Only Backend
```bash
# Stop: Ctrl+C in backend terminal
# Start: npm run dev
```

### Restart Only Frontend
```bash
# Stop: Ctrl+C in frontend terminal
# Start: npm start
```

---

## Useful Commands Reference

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code
```

### Frontend
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

### Database
```bash
# Access DB
docker exec -it gamevault-postgres psql -U postgres -d gamevault

# Run SQL file
docker exec -i gamevault-postgres psql -U postgres -d gamevault < database/schema.sql

# View tables
docker exec gamevault-postgres psql -U postgres -d gamevault -c "\dt"

# Count records
docker exec gamevault-postgres psql -U postgres -d gamevault -c "SELECT 'users' as table, COUNT(*) FROM users UNION SELECT 'games', COUNT(*) FROM games UNION SELECT 'platforms', COUNT(*) FROM platforms;"
```

---

## Next Steps

1. ✅ Start backend and frontend
2. 📝 Open http://localhost:3001
3. 🔐 Register a new account
4. 🎮 Browse games and platforms
5. 💻 Start developing features

---

## Need Help?

- **Detailed Setup**: See [SETUP.md](SETUP.md)
- **API Docs**: See [backend/README_API.md](backend/README_API.md)
- **Backend Setup**: See [BACKEND_SETUP_COMPLETE.md](BACKEND_SETUP_COMPLETE.md)

---

**Happy coding! 🎮**
