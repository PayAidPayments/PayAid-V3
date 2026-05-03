# Tenant ID Migration Guide

## Overview

This guide explains how to migrate your existing tenant ID from CUID format (`cmjptk2mw0000aocw31u48n64`) to personalized format (`demo-a3b2c1`).

## Migration Script

A migration script has been created at: `scripts/migrate-tenant-id.ts`

### Usage

```bash
npx tsx scripts/migrate-tenant-id.ts <old-tenant-id> <business-name>
```

### Example

```bash
npx tsx scripts/migrate-tenant-id.ts cmjptk2mw0000aocw31u48n64 "Demo Business Pvt Ltd"
```

### What It Does

1. **Verifies tenant exists** - Checks if the old tenant ID exists
2. **Generates new ID** - Creates personalized ID based on business name
3. **Updates all records** - Updates tenant and all related records:
   - Tenant record
   - Users
   - Deals
   - Contacts
   - Tasks
   - Leads
   - Invoices
   - Products
   - Orders
   - And other related tables

### Important Notes

⚠️ **WARNING:** This script updates the tenant ID which is used as a foreign key in many tables.

**Before Running:**
1. ✅ Backup your database
2. ✅ Test on a development/staging environment first
3. ✅ Ensure no users are actively using the system

**After Migration:**
1. ✅ Users will need to log out and log back in
2. ✅ JWT tokens will need to be regenerated
3. ✅ Clear browser cache
4. ✅ Update any hardcoded tenant IDs in your code/config

## Alternative: Create New Account

If migration seems risky, you can:
1. Create a new account with business name "Demo Business Pvt Ltd"
2. New tenant will automatically get personalized ID: `demo-[random-suffix]`
3. Test all features with the new account

## Expected Result

**Before:**
- Tenant ID: `cmjptk2mw0000aocw31u48n64`
- URL: `/crm/cmjptk2mw0000aocw31u48n64/Home/`

**After:**
- Tenant ID: `demo-a3b2c1` (example)
- URL: `/crm/demo-a3b2c1/Home/`

## Troubleshooting

### Error: "Tenant not found"
- Verify the tenant ID is correct
- Check if tenant exists in database

### Error: "Duplicate tenant ID"
- The script will retry with different suffixes
- If still fails, manually specify a unique suffix

### Error: "Foreign key constraint"
- Some tables might have foreign key constraints
- Check Prisma schema for all relations
- Update script to include missing relations

## Support

If you encounter issues:
1. Check database logs
2. Verify Prisma schema includes all relations
3. Ensure database connection is stable
4. Consider using database transaction rollback if migration fails
