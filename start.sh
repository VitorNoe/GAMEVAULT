#!/bin/bash

echo "🎮 Starting GameVault..."
echo ""

# Start backend in background
echo "🔧 Starting Backend API..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend Web..."
cd ../frontend-web
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "📍 URLs:"
echo "  Backend:  http://localhost:3000/api/health"
echo "  Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
