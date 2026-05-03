#!/bin/sh
# PayAid V3 Database Restore Script
# Usage: ./restore-database.sh <backup-file.sql.gz>
# Example: ./restore-database.sh payaid_backup_20260115_020000.sql.gz

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_USER=${POSTGRES_USER:-payaid}
POSTGRES_DB=${POSTGRES_DB:-payaid_v3}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "${RED}Error: Backup file not specified${NC}"
  echo "Usage: $0 <backup-file.sql.gz>"
  echo "Example: $0 payaid_backup_20260115_020000.sql.gz"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR}"/payaid_backup_*.sql.gz 2>/dev/null || echo "No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# If relative path, assume it's in BACKUP_DIR
if [ ! -f "${BACKUP_FILE}" ]; then
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

echo "${YELLOW}WARNING: This will restore the database from backup!${NC}"
echo "Database: ${POSTGRES_DB}"
echo "Host: ${POSTGRES_HOST}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "${YELLOW}Restore cancelled${NC}"
  exit 0
fi

# Create backup of current database before restore (safety measure)
CURRENT_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
echo "${YELLOW}Creating safety backup of current database...${NC}"
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-acl \
  | gzip > "${CURRENT_BACKUP}"
echo "${GREEN}✓ Safety backup created: ${CURRENT_BACKUP}${NC}"

# Restore database
echo "${YELLOW}Restoring database from backup...${NC}"
gunzip -c "${BACKUP_FILE}" | \
  PGPASSWORD="${PGPASSWORD}" psql \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}"

if [ $? -eq 0 ]; then
  echo "${GREEN}✓ Database restored successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Verify data integrity"
  echo "2. Run database migrations if needed: npx prisma migrate deploy"
  echo "3. Restart application services"
else
  echo "${RED}✗ Restore failed!${NC}"
  echo "You can restore the safety backup if needed:"
  echo "  $0 ${CURRENT_BACKUP}"
  exit 1
fi
