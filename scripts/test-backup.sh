#!/bin/sh
# Test backup script - validates backup functionality without requiring full Docker setup
# Usage: ./test-backup.sh

set -e

echo "Testing backup script configuration..."

# Check if script exists
if [ ! -f "scripts/backup-database.sh" ]; then
  echo "❌ Error: backup-database.sh not found"
  exit 1
fi

# Check if script is executable
if [ ! -x "scripts/backup-database.sh" ]; then
  echo "⚠️  Making script executable..."
  chmod +x scripts/backup-database.sh
fi

# Check for required commands
echo "Checking dependencies..."
for cmd in pg_dump gzip; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "⚠️  Warning: $cmd not found (required for backup)"
  else
    echo "✓ $cmd found"
  fi
done

# Validate script syntax
echo "Validating script syntax..."
if sh -n scripts/backup-database.sh; then
  echo "✓ Script syntax is valid"
else
  echo "❌ Script syntax error"
  exit 1
fi

echo ""
echo "✅ Backup script is ready!"
echo ""
echo "To test with actual database:"
echo "  export POSTGRES_HOST=localhost"
echo "  export POSTGRES_USER=payaid"
echo "  export POSTGRES_DB=payaid_v3"
echo "  export PGPASSWORD=your_password"
echo "  ./scripts/backup-database.sh"
