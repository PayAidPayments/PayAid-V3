#!/bin/sh
# Setup automated daily backups via cron
# Run this script once to configure daily backups at 2 AM

set -e

BACKUP_SCRIPT="/path/to/scripts/backup-database.sh"
CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM

echo "Setting up automated database backups..."

# Check if backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
  echo "Error: Backup script not found at ${BACKUP_SCRIPT}"
  exit 1
fi

# Make backup script executable
chmod +x "${BACKUP_SCRIPT}"

# Add cron job (if not already exists)
(crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}"; echo "${CRON_SCHEDULE} ${BACKUP_SCRIPT} >> /var/log/payaid-backup.log 2>&1") | crontab -

echo "✓ Cron job configured successfully"
echo "Backups will run daily at 2 AM"
echo "Logs: /var/log/payaid-backup.log"

# List current cron jobs
echo ""
echo "Current cron jobs:"
crontab -l | grep -E "backup|payaid" || echo "No PayAid cron jobs found"
