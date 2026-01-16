# Update Demo Business Industry to Service Business

## Quick Update Methods

### Method 1: API Endpoint (Easiest)
If your dev server is running (`npm run dev`), simply visit:
```
http://localhost:3000/api/admin/set-demo-industry
```
Or use Postman/curl to POST to that URL.

### Method 2: Database Query
Run this SQL query directly in your database:
```sql
UPDATE "Tenant" 
SET "industry" = 'service-business', 
    "industrySubType" = NULL,
    "industrySettings" = '{"setForDemo": true}'::jsonb
WHERE "subdomain" = 'demo' OR "name" ILIKE '%Demo Business%';
```

### Method 3: Re-seed Database
```bash
npm run db:seed
```
Note: This will recreate all demo data.

## Verification
After updating, check the industry:
```sql
SELECT name, subdomain, industry FROM "Tenant" WHERE subdomain = 'demo';
```

Expected result:
- name: Demo Business Pvt Ltd
- subdomain: demo
- industry: service-business

