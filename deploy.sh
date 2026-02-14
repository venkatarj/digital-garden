#!/bin/bash
set -e

# Configuration
REMOTE_USER="venkatarohithj"
REMOTE_HOST="34.60.230.204"
REMOTE_DIR="~/digital-garden"

echo "🚀 Deploying to $REMOTE_HOST..."

# 0. Generate production .env file if it doesn't exist remotely
# We creates a temporary env file locally to sync
cat > .env.prod <<EOL
APP_PASSWORD=secret
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_postgres_password
POSTGRES_DB=garden
EOL

# 1. Sync files to remote server
echo "📂 Syncing files..."
# Added --exclude 'certbot' to prevent rsync from deleting production certs/config
rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' --exclude 'certbot' \
    ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 2. Run Docker Compose on remote server
echo "🐳 Building and starting containers..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && \
    mv .env.prod .env && \
    docker compose -f docker-compose.prod.yml down && \
    docker system prune -f && \
    docker compose -f docker-compose.prod.yml up --build -d"

echo "✅ Deployment complete! Check logs with: ssh $REMOTE_USER@$REMOTE_HOST 'docker compose logs -f'"
