#!/bin/sh
# PayAid V3 Database Backup Script
# Runs daily at 2 AM (configure via cron or docker-compose)
# Retention: 30 days local, 90 days off-site (configure off-site separately)

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/payaid_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_USER=${POSTGRES_USER:-payaid}
POSTGRES_DB=${POSTGRES_DB:-payaid_v3}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}Starting database backup...${NC}"
echo "Database: ${POSTGRES_DB}"
echo "Host: ${POSTGRES_HOST}"
echo "Backup file: ${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform backup
echo "${YELLOW}Creating backup...${NC}"
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "${GREEN}✓ Backup created successfully${NC}"
  echo "  File: ${BACKUP_FILE}"
  echo "  Size: ${BACKUP_SIZE}"
else
  echo "${RED}✗ Backup failed!${NC}"
  exit 1
fi

# Clean up old backups (keep only last N days)
echo "${YELLOW}Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "payaid_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "payaid_backup_*.sql.gz" -type f | wc -l)
echo "${GREEN}✓ Cleanup complete. ${REMAINING_BACKUPS} backup(s) remaining${NC}"

# List recent backups
echo "${YELLOW}Recent backups:${NC}"
ls -lh "${BACKUP_DIR}"/payaid_backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

echo "${GREEN}Backup process completed successfully!${NC}"
