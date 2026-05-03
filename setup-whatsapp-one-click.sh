#!/bin/bash
# WhatsApp One-Click Setup - Environment Configuration Script

echo "🔧 Setting up WhatsApp One-Click environment variables..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

# Add WhatsApp One-Click variables if not present
if ! grep -q "INTERNAL_WAHA_BASE_URL" .env; then
    echo "" >> .env
    echo "# WhatsApp One-Click Setup" >> .env
    echo "INTERNAL_WAHA_BASE_URL=http://127.0.0.1" >> .env
    echo "PAYAID_PUBLIC_URL=http://localhost:3000" >> .env
    echo "✅ Added WhatsApp One-Click environment variables"
else
    echo "✅ WhatsApp One-Click variables already exist"
fi

# Check Docker
echo ""
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "✅ Docker is running"
    else
        echo "⚠️  Docker is installed but not running. Please start Docker Desktop."
    fi
else
    echo "❌ Docker is not installed. Please install Docker Desktop."
fi

# Check ports
echo ""
echo "🔌 Checking ports 3500-3600..."
if command -v netstat &> /dev/null; then
    OCCUPIED=$(netstat -tuln 2>/dev/null | grep -E ':(350[0-9]|35[1-9][0-9]|3600)' | wc -l)
    if [ "$OCCUPIED" -gt 0 ]; then
        echo "⚠️  Some ports in range 3500-3600 are occupied"
        netstat -tuln 2>/dev/null | grep -E ':(350[0-9]|35[1-9][0-9]|3600)'
    else
        echo "✅ Ports 3500-3600 are available"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review .env file and update PAYAID_PUBLIC_URL if needed"
echo "2. Run: npx prisma generate"
echo "3. Run: npm run dev"
echo "4. Navigate to: http://localhost:3000/dashboard/whatsapp/setup"
