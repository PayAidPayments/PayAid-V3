import type { Config } from 'tailwindcss'
import rootConfig from '../../tailwind.config'

/**
 * Voice app Tailwind config.
 * Must include monorepo root paths used via `@/` (same pattern as apps/dashboard);
 * the repo-root tailwind.config only scans ./app relative to the repo root (no root
 * app dir), which misses `apps/voice/app` and can force wasteful rescans.
 */
const config: Config = {
  darkMode: rootConfig.darkMode ?? 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '!../../components/voice-agent/_archive/**',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../contexts/**/*.{js,ts,jsx,tsx,mdx}',
    // Voice import graph under @/lib (avoid scanning all 600+ lib/*.ts files)
    '../../lib/voice-agent/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/middleware/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/stores/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/auth/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/utils/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/db/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/twilio-utils.ts',
    '../../lib/ai/gateway.ts',
    '../../lib/ai/groq.ts',
    '../../lib/ai/generation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: rootConfig.theme ?? {},
  plugins: rootConfig.plugins ?? [],
}
export default config
