/**
 * Voice project (Vercel) runtime env contract — names must match code reads.
 * Used by verify/push scripts; do not log secret values.
 */

/** @typedef {{ key: string, required: boolean, minLength?: number, readers: string[], notes?: string }} VoiceVercelEnvSpec */

/** Production voice runtime secrets synced from local .env / .env.local */
export const VOICE_VERCEL_PUSH_SECRETS = [
  {
    key: 'BOLNA_BRIDGE_SECRET',
    required: true,
    minLength: 16,
    readers: ['lib/voice-agent/runtime/bolna.ts (verifyBolnaBridgeSecret)', 'bridge routes via X-PayAid-Bridge-Secret'],
    notes: 'Must match deployment/bolna/.env and local smoke header.',
  },
  {
    key: 'DATABASE_URL',
    required: true,
    readers: ['packages/db/src/client.ts (Prisma datasource)'],
    notes: 'Supabase pooler URL; required for bridge tools/events and analytics.',
  },
  {
    key: 'JWT_SECRET',
    required: true,
    minLength: 16,
    readers: ['lib/auth/jwt.ts (verifyToken)', 'requireModuleAccess on analytics'],
    notes: 'Mint tokens with npm run voice-agent:mint-validation-auth-token using the same secret.',
  },
]

/** Pulled from Vercel API into .env.local (non-secret or project metadata) */
export const VOICE_VERCEL_PULL_LOCAL = [
  { key: 'BASE_URL', readers: ['smoke/latency scripts', 'PAYAID_BRIDGE_BASE_URL sync'] },
  { key: 'PAYAID_BRIDGE_BASE_URL', readers: ['Bolna sidecar callbacks'] },
  { key: 'VERCEL_PROTECTION_BYPASS', readers: ['smoke/latency Vercel Deployment Protection'] },
]

/** Public build-time flags for browser live voice (M1). */
export const VOICE_BROWSER_LIVE_VERCEL_PUBLIC = [
  {
    key: 'NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO',
    required: true,
    defaultValue: '1',
    readers: ['VoiceAgentsSidebar', 'VoiceAgentLiveDemoWorkspace', 'voice-agent-table'],
    notes: 'Set to 1 to expose Live voice nav and LiveDemo route.',
  },
  {
    key: 'NEXT_PUBLIC_VOICE_LIVE_WS_URL',
    required: false,
    readers: ['lib/voice-agent/browser-live/live-voice-transport.ts (resolveLiveWsUrl)'],
    notes: 'wss:// sidecar URL after deploying deployment/browser-live-ws. Omit locally (uses ws://host:3002).',
  },
]

export const VOICE_VERCEL_REDEPLOY_NOTE =
  'Vercel env changes apply only to new deployments. After push-stage1-vercel-secrets, run npm run deploy:voice:git-archive (or voice-agent:deploy-pipeline).'

export const VOICE_RUNTIME_LOG_PATTERNS = {
  bridge: [
    /Invalid or missing X-PayAid-Bridge-Secret/i,
    /BOLNA_BRIDGE_SECRET/i,
    /DATABASE_URL environment variable is not set/i,
    /bridge-auth/i,
    /tools\/execute|kb\/search|runtime\/bolna\/events/i,
  ],
  analytics: [/Analytics error:/i, /Failed to fetch analytics/i, /P2024/i, /voice-agents\/analytics/i],
}
