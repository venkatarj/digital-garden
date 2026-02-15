#!/bin/bash
# Production setup script - Run this on the server

echo "🔧 Setting up production environment..."

# Exit container if inside one
exit 2>/dev/null || true

# Navigate to project directory
cd ~/digital-garden

# Create .env file with production secrets
echo "📝 Creating .env file..."
cat > .env << 'EOF'
APP_PASSWORD=secret
POSTGRES_PASSWORD=postgres
JWT_SECRET=2JvfPhQr04IHh3OC8Iva-aD6cMpQ_e3s1IMt61NMjAU
JWT_EXPIRE_MINUTES=10080
EOF

echo "✅ .env file created"

# Restart services to pick up new environment
echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Run migration
echo "🗄️  Running database migration..."
docker compose -f docker-compose.prod.yml exec backend python migrate_existing_data.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Visit your site and login with:"
echo "     Email: admin@lifeos.local"
echo "     Password: changeme123"
echo "  2. Change the default password immediately!"
