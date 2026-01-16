#!/bin/sh
# Production Backup Script - Run BEFORE any migration
# Creates complete backup of production environment

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./production-backups/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

echo "🚀 Starting Production Backup..."
echo "Backup directory: ${BACKUP_DIR}"

# 1. Backup Database
echo "📦 Backing up database..."
if [ -n "${DATABASE_URL}" ]; then
  ./scripts/backup-database.sh
  cp backups/payaid_backup_*.sql.gz "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  Database backup not found"
else
  echo "⚠️  DATABASE_URL not set, skipping database backup"
fi

# 2. Backup Code (Git)
echo "📦 Backing up code..."
git tag "production-backup-${TIMESTAMP}"
git push origin "production-backup-${TIMESTAMP}" || echo "⚠️  Could not push tag (may need to set remote)"

# Create archive
git archive --format=tar.gz --output="${BACKUP_DIR}/code-backup.tar.gz" HEAD

# 3. Backup Environment Variables
echo "📦 Backing up environment variables..."
echo "⚠️  Manual step required:"
echo "   1. Go to Vercel Dashboard > Settings > Environment Variables"
echo "   2. Export all variables"
echo "   3. Save to: ${BACKUP_DIR}/env-variables.txt"
echo ""
read -p "Press Enter after exporting environment variables..."

# 4. Document Current State
echo "📦 Documenting current state..."
cat > "${BACKUP_DIR}/backup-info.txt" << EOF
Production Backup Information
=============================
Date: $(date)
Timestamp: ${TIMESTAMP}

Git Information:
- Branch: $(git branch --show-current)
- Commit: $(git rev-parse HEAD)
- Tag: production-backup-${TIMESTAMP}

Database:
- URL: ${DATABASE_URL:-Not set}

Vercel:
- Project: Check Vercel dashboard
- Environment: Production

Backup Location: ${BACKUP_DIR}
EOF

# 5. List all files
echo "📦 Creating backup manifest..."
find "${BACKUP_DIR}" -type f > "${BACKUP_DIR}/manifest.txt"

echo ""
echo "✅ Backup complete!"
echo "Backup location: ${BACKUP_DIR}"
echo ""
echo "Files backed up:"
ls -lh "${BACKUP_DIR}"

echo ""
echo "📋 Next steps:"
echo "1. Verify backup files"
echo "2. Test restore procedure (on staging)"
echo "3. Store backup in secure location"
echo "4. Proceed with migration"
