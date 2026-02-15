#!/bin/bash
set -e

echo "🚀 Starting Life OS Development Environment..."
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Creating from example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env - Please update VITE_GOOGLE_CLIENT_ID"
    exit 1
fi

# Load environment variables (filter out comments and empty lines)
export $(grep -v '^#' backend/.env | grep -v '^$' | sed 's/#.*$//' | xargs)
export $(grep -v '^#' frontend/.env | grep -v '^$' | sed 's/#.*$//' | xargs)

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose up --build

echo ""
echo "✅ Development environment is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop: Press Ctrl+C"
