#!/bin/bash

echo "========================================"
echo "  ReneStore - Starting All Services"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists in Backend
if [ ! -d "Backend/node_modules" ]; then
    echo -e "${YELLOW}[1/4]${NC} Installing Backend dependencies..."
    cd Backend
    npm install
    cd ..
else
    echo -e "${GREEN}[1/4]${NC} Backend dependencies already installed ✓"
fi

# Check if node_modules exists in Frontend
if [ ! -d "Frontend/node_modules" ]; then
    echo -e "${YELLOW}[2/4]${NC} Installing Frontend dependencies..."
    cd Frontend
    npm install
    cd ..
else
    echo -e "${GREEN}[2/4]${NC} Frontend dependencies already installed ✓"
fi

echo ""
echo -e "${YELLOW}[3/4]${NC} Starting Backend server..."
cd Backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

echo -e "${YELLOW}[4/4]${NC} Starting Frontend server..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  ✓ All services started!"
echo "========================================"
echo ""
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Sign in using an authorized administrator account for your environment."
echo ""
echo "  To stop all servers: Ctrl+C"
echo ""

# Wait for background processes
wait
