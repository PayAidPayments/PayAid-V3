import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const isVercel = process.env.VERCEL === '1'

// Load root .env so DATABASE_URL and other vars are available when running from apps/dashboard
try {
  loadEnv({ path: path.join(rootDir, '.env'), override: false })
  loadEnv({ path: path.join(rootDir, '.env.local'), override: false })
  loadEnv({ path: path.join(rootDir, '.env.development'), override: false })
  loadEnv({ path: path.join(rootDir, '.env.development.local'), override: false })
} catch (_) {
  // dotenv may not be installed or files missing
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack currently struggles with Bull's server-relative child-process imports.
  // Keep Bull external so app-route/instrumentation bundles do not attempt to resolve
  // node_modules/bull/lib/process/* at build time.
  serverExternalPackages: ['bull', 'ioredis'],
  // Prevent Vercel deployment stalls in large monorepo typecheck phase.
  // Keep strict typecheck in local/CI via `npm run -w apps/dashboard typecheck`.
  typescript: { ignoreBuildErrors: process.env.VERCEL === '1' },
  productionBrowserSourceMaps: false,
  // Per-page static generation cap (seconds); avoids one bad route stalling the whole build indefinitely.
  staticPageGenerationTimeout: 180,
  // Monorepo: trace serverless deps from repo root (hoisted node_modules), not only apps/dashboard
  outputFileTracingRoot: rootDir,
  transpilePackages: ['@payaid/db', '@payaid/social', '@payaid/ai'],
  async redirects() {
    return [
      { source: '/marketing/:tenantId/Social-Media/Create-Post', destination: '/marketing/:tenantId/Studio', permanent: true },
      { source: '/marketing/:tenantId/Social-Media/Create-Image', destination: '/marketing/:tenantId/Studio', permanent: true },
      { source: '/marketing/:tenantId/Social-Media/Schedule', destination: '/marketing/:tenantId/Studio', permanent: true },
    ]
  },
  experimental: {
    // This optimization improves bundle ergonomics but increases compile pressure.
    // Keep it off on Vercel to reduce OOM risk on 8 GB build workers.
    ...(isVercel
      ? {}
      : {
          optimizePackageImports: ['@radix-ui/*', 'lucide-react', 'framer-motion', 'recharts', 'handsontable', '@tiptap/react'],
        }),
    // Vercel (8GB): prefer lower peak memory over faster parallel build throughput.
    // This avoids worker SIGKILL/OOM in large monorepo compiles.
    ...(isVercel
      ? {
          memoryBasedWorkersCount: false,
          webpackMemoryOptimizations: true,
          webpackBuildWorker: false,
          parallelServerBuildTraces: false,
        }
      : {}),
  },
  webpack: (config, { webpack }) => {
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    // Optional dependency: lib/monitoring/statsd uses require() inside try/catch; do not fail the bundle when absent.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^node-statsd$/,
      })
    )
    return config
  },
}
export default nextConfig
