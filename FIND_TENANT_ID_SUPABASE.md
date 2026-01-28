# How to Find Your Tenant ID in Supabase

## Method 1: SQL Editor (Easiest)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run this query:**
   ```sql
   SELECT id, name, subdomain, status, "createdAt"
   FROM "Tenant"
   ORDER BY "createdAt" DESC;
   ```

4. **You'll see a table with:**
   - `id` - This is your TENANT_ID (copy this!)
   - `name` - Tenant name
   - `subdomain` - Subdomain (if set)
   - `status` - Active/Inactive
   - `createdAt` - When created

## Method 2: Table Editor

1. **Go to Supabase Dashboard**
2. **Click "Table Editor"** in left sidebar
3. **Click on "Tenant" table**
4. **You'll see all tenants with their IDs in the first column**

## Method 3: Via API Response (After Login)

1. **Login** to your app: https://payaid-v3.vercel.app/login
2. **Open Browser DevTools** (F12)
3. **Go to Network tab**
4. **Find the `/api/auth/login` request**
5. **Click on it → Response tab**
6. **Look for:**
   ```json
   {
     "tenant": {
       "id": "clx123...",  // <-- This is your TENANT_ID
       "name": "Your Company Name"
     }
   }
   ```

## Method 4: From Browser Local Storage

1. **Login** to your app
2. **Open DevTools** (F12)
3. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
4. **Click Local Storage** → Your domain
5. **Look for keys like:**
   - `auth-storage` or similar
   - Decode the JSON to find `tenant.id`

## Quick SQL Query

**To get just the ID and name:**
```sql
SELECT id, name FROM "Tenant";
```

**To get ID for a specific tenant by name:**
```sql
SELECT id, name FROM "Tenant" WHERE name = 'Your Company Name';
```

**To get ID for a specific tenant by subdomain:**
```sql
SELECT id, name FROM "Tenant" WHERE subdomain = 'your-subdomain';
```

## Example Output

When you run the query, you'll see something like:

```
id                                    | name              | subdomain
--------------------------------------|-------------------|------------
clx123abc456def789ghi012jkl345mno678  | Acme Corporation  | acme-corp
clx987zyx654wvu321tsr098qpo765nml432  | Test Company      | test-company
```

**Copy the `id` value** - that's your TENANT_ID!

## Using the Tenant ID

Once you have the ID, you can:

1. **Initialize roles for that tenant:**
   ```sql
   -- Use the ID in the SQL from INITIALIZE_ROLES_ALTERNATIVES.md
   -- Replace 'YOUR_TENANT_ID_HERE' with the actual ID
   ```

2. **Or use in the script:**
   ```bash
   npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id clx123abc456def789ghi012jkl345mno678
   ```

3. **Or use in API call:**
   ```json
   {
     "tenantId": "clx123abc456def789ghi012jkl345mno678"
   }
   ```

---

**The easiest way: Run the SQL query in Supabase SQL Editor!**
