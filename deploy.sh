#!/bin/bash
set -e

# Production deployment script for Life OS

REMOTE_USER="venkatarohithj"
REMOTE_HOST="34.60.230.204"
REMOTE_DIR="~/digital-garden"

echo "🚀 Deploying to production..."

# Sync files to remote server (excluding node_modules, .git, etc.)
echo "📦 Syncing files..."
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude '__pycache__' \
           --exclude '*.pyc' \
           --exclude 'frontend/dist' \
           --exclude 'backend/.env' \
           ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# Deploy on remote server
echo "🔧 Building and starting services..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && \
    docker compose -f docker-compose.prod.yml down && \
    docker compose -f docker-compose.prod.yml up --build -d"

echo "✅ Deployment complete! Check logs with: ssh $REMOTE_USER@$REMOTE_HOST 'docker compose logs -f'"
echo ""
echo "⚠️  IMPORTANT: After first deployment with auth system:"
echo "   1. SSH into server: ssh $REMOTE_USER@$REMOTE_HOST"
echo "   2. Set JWT_SECRET in .env file (if not already set)"
echo "   3. Run migration: docker compose exec backend python migrate_existing_data.py"
echo "   4. Change default user password after logging in"
