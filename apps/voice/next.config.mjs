import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { applyMonorepoWebpackAliases } from '../../scripts/next-monorepo-aliases.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

// Load root .env so DATABASE_URL / JWT / voice keys match dashboard when running from apps/voice
try {
  const envOpts = { override: false, quiet: true }
  loadEnv({ path: path.join(rootDir, '.env'), ...envOpts })
  loadEnv({ path: path.join(rootDir, '.env.local'), ...envOpts })
  loadEnv({ path: path.join(rootDir, '.env.development'), ...envOpts })
  loadEnv({ path: path.join(rootDir, '.env.development.local'), ...envOpts })
} catch (_) {
  // optional
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  // Match dashboard tracing so serverless/output resolution stays consistent with hoisted node_modules
  outputFileTracingRoot: rootDir,
  // Skip bundling these in server routes (faster dev compiles; Node loads from node_modules at runtime)
  serverExternalPackages: [
    'bull',
    'ioredis',
    '@prisma/client',
    'prisma',
    'jsonwebtoken',
    'twilio',
    'groq-sdk',
    'fluent-ffmpeg',
    'pdfkit',
    'exceljs',
    'sharp',
    'canvas',
    'playwright',
    'pdf-parse',
  ],
  // @payaid/domain-voice: webpack alias to packages/domains/voice/src (Vercel archive may not link workspace in node_modules)
  transpilePackages: ['@payaid/db', '@payaid/ai'],
  experimental: {
    // Only packages present in the voice client/server graph (smaller transform surface than the dashboard list)
    optimizePackageImports: ['@radix-ui/*', 'lucide-react', 'recharts'],
  },
  webpack: (config, { webpack }) => {
    applyMonorepoWebpackAliases(config, path.join(__dirname), 'voice')
    config.resolve.alias = config.resolve.alias || {}
    // Workspace package (works before npm install links @payaid/domain-voice in node_modules)
    const domainVoiceSrc = path.join(rootDir, 'packages/domains/voice/src')
    config.resolve.alias['@payaid/domain-voice'] = domainVoiceSrc
    config.resolve.alias['@payaid/domain-voice$'] = path.join(domainVoiceSrc, 'index.ts')
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^node-statsd$/,
      })
    )
    return config
  },
}
export default nextConfig
