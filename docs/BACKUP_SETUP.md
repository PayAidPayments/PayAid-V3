# Database Backup Setup Guide

This guide explains how to set up automated database backups for PayAid CRM.

## Prerequisites

- PostgreSQL database
- AWS CLI (optional, for S3 backups)
- Cron or Task Scheduler access

## Setup Steps

### 1. Run Setup Script

```bash
npx tsx scripts/infrastructure/setup-backups.ts
```

This creates:
- `config/backups.json` - Backup configuration
- `scripts/infrastructure/backup-database.sh` - Backup script

### 2. Configure Environment Variables

Add to `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
AWS_S3_BACKUP_BUCKET=your-backup-bucket (optional)
AWS_REGION=us-east-1 (optional)
```

### 3. Test Backup

```bash
./scripts/infrastructure/backup-database.sh
```

### 4. Schedule Automated Backups

#### Linux/Mac (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/project/scripts/infrastructure/backup-database.sh
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Set action: Start a program
5. Program: `bash`
6. Arguments: `scripts/infrastructure/backup-database.sh`

## Backup Types

- **Full Backup**: Complete database dump (weekly)
- **Incremental Backup**: Schema-only dump (daily)

## Restore from Backup

```bash
# Restore full backup
psql $DATABASE_URL < backups/full-YYYYMMDD-HHMMSS.sql

# Or from compressed backup
gunzip < backups/full-YYYYMMDD-HHMMSS.sql.gz | psql $DATABASE_URL
```

## S3 Backup (Optional)

If AWS_S3_BACKUP_BUCKET is set, backups are automatically uploaded to S3.

## Retention

- Full backups: 4 weeks
- Incremental backups: 7 days

Configure in `config/backups.json`.
