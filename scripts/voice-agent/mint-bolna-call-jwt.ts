/**
 * CLI: mint a per-call Bolna bridge JWT (stdout = token).
 * Usage: tsx scripts/voice-agent/mint-bolna-call-jwt.ts <tenantId> <agentId> <callSid>
 */
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

import { mintBolnaCallJwt } from '../../lib/voice-agent/runtime/bolna'

const [tenantId, agentId, callSid] = process.argv.slice(2)
if (!tenantId || !agentId || !callSid) {
  console.error('Usage: mint-bolna-call-jwt.ts <tenantId> <agentId> <callSid>')
  process.exit(1)
}

const { token } = mintBolnaCallJwt({ tenantId, agentId, callSid })
process.stdout.write(token)
