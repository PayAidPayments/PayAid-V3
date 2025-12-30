# Productivity Suite Database Migration Guide

## Overview
This guide will help you apply the database schema changes for the Productivity Suite features (Spreadsheet, Docs, Drive, Slides, Meet).

## ⚠️ Pre-Migration Checklist

- [ ] **Backup Database** - Create full database backup
- [ ] **Review Schema Changes** - Understand what's being added
- [ ] **Test on Staging** - Run migration on staging first (if applicable)
- [ ] **Verify Prisma Client** - Ensure Prisma client is generated

---

## 📋 Schema Changes Summary

### New Models Created:
1. **Spreadsheet** - Spreadsheet documents with data and settings
2. **SpreadsheetCollaborator** - User collaboration on spreadsheets
3. **SpreadsheetVersion** - Version history for spreadsheets
4. **Document** - Document files with content
5. **DocumentCollaborator** - User collaboration on documents
6. **DocumentVersion** - Version history for documents
7. **DriveFile** - File storage with folder structure
8. **DriveFileVersion** - Version history for files
9. **Presentation** - Presentation slides
10. **PresentationCollaborator** - User collaboration on presentations
11. **PresentationVersion** - Version history for presentations
12. **Meeting** - Video conferencing meetings

### Relations Added:
- All models linked to `Tenant` and `User` models
- Proper cascade deletion configured
- Indexes added for performance

---

## 🚀 Migration Steps

### Step 1: Generate Prisma Client

```bash
npm run db:generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.22.0)
```

---

### Step 2: Push Schema to Database

**For Development (Recommended):**
```bash
npm run db:push
```

**For Production (with Migration History):**
```bash
npm run db:migrate
```

**What This Does:**
- Creates all new tables in the database
- Adds all relations and indexes
- Updates Prisma migration history (if using migrate)

**Expected Output:**
```
✔ Database synchronized
✔ Generated Prisma Client
```

---

### Step 3: Verify Tables Created

You can verify the tables were created using Prisma Studio:

```bash
npm run db:studio
```

Or check directly in your database:
- `Spreadsheet`
- `SpreadsheetCollaborator`
- `SpreadsheetVersion`
- `Document`
- `DocumentCollaborator`
- `DocumentVersion`
- `DriveFile`
- `DriveFileVersion`
- `Presentation`
- `PresentationCollaborator`
- `PresentationVersion`
- `Meeting`

---

## 🔍 Verification

### Check Database Connection
```bash
npm run verify-env
```

### Test API Endpoints
Once migration is complete, test the endpoints:
- `GET /api/spreadsheets` - Should return empty array (or existing spreadsheets)
- `GET /api/documents` - Should return empty array (or existing documents)
- `GET /api/drive` - Should return empty array (or existing files)
- `GET /api/slides` - Should return empty array (or existing presentations)
- `GET /api/meet` - Should return empty array (or existing meetings)

---

## 🐛 Troubleshooting

### Issue: "Table already exists"
**Solution:** The tables may have been created manually. Run `npm run db:push` with `--force-reset` flag (⚠️ **WARNING**: This will delete all data)

### Issue: "Foreign key constraint failed"
**Solution:** Ensure `Tenant` and `User` tables exist and have data. Run seed script if needed:
```bash
npm run db:seed
```

### Issue: "Connection timeout"
**Solution:** 
- Check your `DATABASE_URL` in `.env`
- For Supabase, use direct connection URL (not pooler)
- Verify database is accessible

### Issue: "Prisma Client not found"
**Solution:** Run `npm run db:generate` first

---

## 📝 Post-Migration

After successful migration:

1. ✅ **Test Creating Items**
   - Create a spreadsheet via UI
   - Create a document via UI
   - Upload a file to Drive
   - Create a presentation
   - Create a meeting

2. ✅ **Verify Data Persistence**
   - Create items, refresh page, verify they persist
   - Edit items, verify changes save
   - Delete items, verify they're removed

3. ✅ **Check Relations**
   - Verify createdBy/updatedBy relations work
   - Verify tenant isolation works
   - Verify version history is created

---

## 🎯 Quick Migration Command

For quick setup (development only):

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Verify (optional)
npm run db:studio
```

---

## 📊 Database Size Considerations

The new tables will add minimal overhead initially:
- Each spreadsheet/document stores JSON data (varies by size)
- File storage uses file system (not database)
- Version history can grow over time (consider cleanup policies)

**Storage Limits:**
- Drive: 50GB free tier per tenant
- No hard limits on spreadsheets/documents/presentations (limited by database size)

---

## ✅ Success Indicators

You'll know the migration was successful when:
- ✅ All 12 new tables exist in database
- ✅ Prisma client includes new models
- ✅ API endpoints return data (even if empty)
- ✅ UI can create/edit/delete items
- ✅ No TypeScript errors related to new models

---

## 🔄 Rollback (If Needed)

If you need to rollback:

1. **Manual Rollback:**
   ```sql
   -- Drop tables in reverse order (respecting foreign keys)
   DROP TABLE IF EXISTS "Meeting";
   DROP TABLE IF EXISTS "PresentationVersion";
   DROP TABLE IF EXISTS "PresentationCollaborator";
   DROP TABLE IF EXISTS "Presentation";
   -- ... (continue for all tables)
   ```

2. **Using Prisma:**
   - If using migrations, you can revert: `npx prisma migrate reset`
   - ⚠️ **WARNING**: This will delete ALL data

---

## 📞 Support

If you encounter issues:
1. Check Prisma logs for detailed error messages
2. Verify database connection string
3. Ensure all dependencies are installed: `npm install`
4. Check that Prisma version matches: `npx prisma --version`

