/**
 * Prisma `schema.prisma` uses `directUrl = env("DATABASE_DIRECT_URL")`.
 * Load `.env` here (CLI wrappers run before Prisma injects env) then default DIRECT from
 * DATABASE_URL when unset. Supabase: still set DATABASE_DIRECT_URL to the direct (non-pooler)
 * URI for reliable `migrate deploy`.
 */
const path = require('path')

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch {
  /* optional dep path */
}
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
} catch {
  /* optional */
}

if (!process.env.DATABASE_DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DATABASE_DIRECT_URL = process.env.DATABASE_URL
}
