import path from 'node:path'
import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const databaseUrl = process.env.DATABASE_URL || ''
const tenantId = process.env.TENANT_ID || process.env.CANONICAL_STAGING_TENANT_ID || ''

if (!databaseUrl) {
  console.error('DATABASE_URL is missing')
  process.exit(1)
}

const client = new Client({ connectionString: databaseUrl })

try {
  await client.connect()

  let row = null
  if (tenantId) {
    const byTenant = await client.query(
      'SELECT id, "tenantId", "createdAt" FROM "Campaign" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC NULLS LAST LIMIT 1',
      [tenantId]
    )
    row = byTenant.rows?.[0] || null
  }

  if (!row) {
    const anyRow = await client.query(
      'SELECT id, "tenantId", "createdAt" FROM "Campaign" ORDER BY "createdAt" DESC NULLS LAST LIMIT 1'
    )
    row = anyRow.rows?.[0] || null
  }

  if (!row) {
    console.log(JSON.stringify({ ok: false, message: 'No campaigns found.' }, null, 2))
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        campaignId: row.id,
        tenantId: row.tenantId,
        createdAt: row.createdAt,
        powershell: [`$env:EMAIL_CAMPAIGN_ID=\"${row.id}\"`],
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await client.end().catch(() => undefined)
}

