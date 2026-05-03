import pg from 'pg'

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://payaid:payaid@127.0.0.1:5433/payaid_v3?schema=public'

const timeoutMs = Number(process.env.LOCAL_DB_WAIT_TIMEOUT_MS || 90000)
const sleepMs = Number(process.env.LOCAL_DB_WAIT_INTERVAL_MS || 2000)
const startedAt = Date.now()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function canConnect() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    statement_timeout: 5000,
    query_timeout: 5000,
  })
  try {
    await client.connect()
    await client.query('select 1 as ok')
    return true
  } catch {
    return false
  } finally {
    await client.end().catch(() => undefined)
  }
}

for (;;) {
  // eslint-disable-next-line no-await-in-loop
  const ok = await canConnect()
  if (ok) {
    process.stdout.write('Local DB is ready.\n')
    process.exit(0)
  }

  if (Date.now() - startedAt >= timeoutMs) {
    process.stderr.write(`Timed out waiting for local DB after ${timeoutMs}ms.\n`)
    process.exit(1)
  }
  // eslint-disable-next-line no-await-in-loop
  await sleep(sleepMs)
}
