const dbUrl = process.env.DATABASE_URL || ''

if (!dbUrl) {
  process.stderr.write('DATABASE_URL is not set.\n')
  process.exit(1)
}

let host = ''
try {
  host = new URL(dbUrl).hostname
} catch {
  process.stderr.write('DATABASE_URL is not a valid URL.\n')
  process.exit(1)
}

const localHosts = new Set(['127.0.0.1', 'localhost'])
if (!localHosts.has(host)) {
  process.stderr.write(
    `Refusing local-only DB operation: host "${host}" is not local (expected 127.0.0.1 or localhost).\n`
  )
  process.exit(1)
}

process.stdout.write(`Local DB safety check passed (${host}).\n`)
