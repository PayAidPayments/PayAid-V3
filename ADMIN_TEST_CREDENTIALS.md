# Admin Test Credentials

Use these accounts to test **Super Admin** and **Business Admin** after running the seed.

## 1. Create the users (one-time)

### Option A: Using API route (recommended, works with Supabase)

Open your browser or use curl/Postman:

```bash
# In browser, go to:
http://localhost:3000/api/admin/create-test-users

# Or use curl:
curl -X POST http://localhost:3000/api/admin/create-test-users
```

This creates the users server-side and handles Supabase connections properly.

### Option B: Using seed script

From the project root:

```bash
npm run seed:admin-users
```

**If you use Supabase:** Some operations require a direct database URL. Set `DIRECT_URL` in `.env` (or use `DATABASE_URL` with the direct connection string for seeding), then run the command again.

This creates/updates:

- **Super Admin** user (PayAid team)
- **Business Admin** user (tenant admin for Demo Business)

---

## 2. Super Admin (PayAid team)

Use this to access **Super Admin** at `/super-admin` (platform-wide tenants, users, plans, feature flags, billing, system).

| Field     | Value                    |
|----------|---------------------------|
| **Email**   | `admin@payaidpayments.com` |
| **User ID** | `PayAid_SuperAdmin` (for reference; login uses email) |
| **Password** | `PayAid_SuperAdmin_2025!` |

**Steps:**

1. Go to `/login`.
2. Sign in with the email and password above.
3. After login, open **Super Admin** in the sidebar, or go directly to **`/super-admin`**.

---

## 3. Business Admin (tenant admin)

Use this to access **Business Admin** at `/admin` (tenant users, roles, modules, billing, integrations, audit log).

| Field       | Value                          |
|------------|---------------------------------|
| **Email**    | `businessadmin@demobusiness.com` |
| **Password** | `BusinessAdmin_2025!`            |

**Steps:**

1. Go to `/login`.
2. Sign in with the email and password above.
3. After login, open **Admin** in the sidebar, or go directly to **`/admin`**.

*(This user belongs to the **Demo Business** tenant. If the demo tenant does not exist, the seed creates it.)*

---

## 4. Quick reference

| Role            | Email                          | Password              | Where to go after login   |
|----------------|---------------------------------|------------------------|----------------------------|
| Super Admin    | admin@payaidpayments.com        | PayAid_SuperAdmin_2025! | `/super-admin`            |
| Business Admin | businessadmin@demobusiness.com  | BusinessAdmin_2025!      | `/admin`                  |

---

**Security:** Change these passwords in production and do not commit real credentials to the repo.

---

## Troubleshooting

**If login fails with "Invalid email or password":**

1. **Verify users exist:** Call `POST /api/admin/create-test-users` first (see Option A above).
2. **Check database:** Ensure your database is connected and migrations are run (`npm run db:migrate` or `npm run db:push`).
3. **Check email case:** Login is case-insensitive, but ensure you're using the exact email: `admin@payaidpayments.com`.
4. **Check password:** Ensure no extra spaces and use the exact password: `PayAid_SuperAdmin_2025!`.
