import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

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
    optimizePackageImports: ['@radix-ui/*', 'lucide-react', 'framer-motion', 'recharts', 'handsontable', '@tiptap/react'],
    // Vercel (8GB): let Next scale static page collection workers from free memory; speeds up
    // "Collecting page data" vs a single worker. webpackMemoryOptimizations reduces peak heap.
    ...(process.env.VERCEL === '1'
      ? {
          memoryBasedWorkersCount: true,
          webpackMemoryOptimizations: true,
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
