#!/usr/bin/env node
/** Print bridge secret from best source (stdout). Priority: PAYAID_BRIDGE_SECRET_OVERRIDE > .env.local file > sidecar */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })

function fromFile(file) {
  if (!existsSync(file)) return ''
  const m = readFileSync(file, 'utf8').match(/^BOLNA_BRIDGE_SECRET=(.+)$/m)
  return m ? m[1].replace(/^"|"$/g, '').trim() : ''
}

const override = process.env.PAYAID_BRIDGE_SECRET_OVERRIDE || ''
const localFile = fromFile(path.join(root, '.env.local'))
const local = localFile || String(process.env.BOLNA_BRIDGE_SECRET || '').trim()
const sidecar = fromFile(path.join(root, 'deployment/bolna/.env'))

let chosen = local
if (override.length >= 16) chosen = override
else if (local.length < 16 && sidecar.length >= 16) chosen = sidecar
else if (local.length < 32 && sidecar.length >= 32) chosen = sidecar

if (chosen.length < 16) process.exit(1)
process.stdout.write(chosen)
