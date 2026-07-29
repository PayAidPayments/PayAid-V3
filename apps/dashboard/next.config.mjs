import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const isVercel = process.env.VERCEL === '1'
const isProduction = process.env.NODE_ENV === 'production'
const customDistDir = process.env.NEXT_BUILD_DIST_DIR
const disableOutputFileTracingForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING === '1'
const disableOptimizePackageImports =
  process.env.PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === '1'
// Vercel monorepo-root deploys copy apps/dashboard/app → ./app; local builds use apps/dashboard/app.
const dashboardAppDir = existsSync(path.join(rootDir, 'app', 'providers.tsx'))
  ? path.join(rootDir, 'app')
  : path.resolve(__dirname, 'app')

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
  ...(customDistDir ? { distDir: customDistDir } : {}),
  // Turbopack does not use webpack resolve.alias — mirror tsconfig paths here.
  // Turbopack resolveAlias paths are relative to the Next project root (build cwd).
  // Vercel monorepo-root deploys: cwd has ./app (copied). Local apps/dashboard: ./app is native.
  turbopack: {
    resolveAlias: {
      '@dashboard': './app',
      '@dashboard/*': './app/*',
      '@app': './app',
      '@app/*': './app/*',
      '@/*': './*',
    },
  },
  // Turbopack currently struggles with Bull's server-relative child-process imports.
  // Keep Bull external so app-route/instrumentation bundles do not attempt to resolve
  // node_modules/bull/lib/process/* at build time.
  serverExternalPackages: ['bull', 'ioredis'],
  // Fail production builds on TypeScript errors (operator trust).
  // Emergency escape hatch only: PAYAID_ALLOW_TS_BUILD_ERRORS=1
  typescript: {
    ignoreBuildErrors: process.env.PAYAID_ALLOW_TS_BUILD_ERRORS === '1',
  },
  productionBrowserSourceMaps: false,
  // Per-page static generation cap (seconds); avoids one bad route stalling the whole build indefinitely.
  staticPageGenerationTimeout: 180,
  // Monorepo: trace serverless deps from repo root (hoisted node_modules), not only apps/dashboard.
  // Next.js 16 does not accept outputFileTracing: false; when triage env is set, strip TraceEntryPointsPlugin below.
  outputFileTracingRoot: rootDir,
  transpilePackages: ['@payaid/db', '@payaid/social', '@payaid/ai'],
  async rewrites() {
    const voiceOrigin = (
      process.env.VOICE_MODULE_URL ||
      process.env.VOICE_API_ORIGIN ||
      (process.env.NODE_ENV === 'production' ? 'https://voice-six-xi.vercel.app' : 'http://localhost:3003')
    ).replace(/\/$/, '')
    return [
      { source: '/api/v1/voice-agents/:path*', destination: `${voiceOrigin}/api/v1/voice-agents/:path*` },
      { source: '/api/public/agents/:path*', destination: `${voiceOrigin}/api/public/agents/:path*` },
      { source: '/api/tts', destination: `${voiceOrigin}/api/tts` },
      { source: '/api/voice/ping', destination: `${voiceOrigin}/api/voice/ping` },
      { source: '/embed.js', destination: `${voiceOrigin}/embed.js` },
    ]
  },
  async redirects() {
    // Voice UI hop is handled in middleware with SSO query params (token cookie →
    // voice-six-xi). Do not hard-redirect here or the session is dropped.
    return [
      { source: '/marketing/:tenantId/Social-Media/Create-Post', destination: '/marketing/:tenantId/Studio', permanent: true },
      { source: '/marketing/:tenantId/Social-Media/Create-Image', destination: '/marketing/:tenantId/Studio', permanent: true },
      { source: '/marketing/:tenantId/Social-Media/Schedule', destination: '/marketing/:tenantId/Studio', permanent: true },
      // One builder truth
      { source: '/website-builder-v2', destination: '/website-builder', permanent: true },
      { source: '/website-builder-v2/:path*', destination: '/website-builder/:path*', permanent: true },
      // Legacy /dashboard/* → decoupled module homes (tenant resolved client-side via /home)
      { source: '/dashboard/crm', destination: '/crm', permanent: true },
      { source: '/dashboard/finance', destination: '/finance', permanent: true },
      { source: '/dashboard/hr', destination: '/hr', permanent: true },
      { source: '/dashboard/marketing', destination: '/marketing', permanent: true },
      { source: '/dashboard/projects', destination: '/projects', permanent: true },
      { source: '/dashboard/sales', destination: '/sales', permanent: true },
      { source: '/dashboard/workflows', destination: '/workflow-automation', permanent: true },
      { source: '/dashboard/contracts', destination: '/contracts', permanent: true },
      { source: '/dashboard/help-center', destination: '/help-center', permanent: true },
    ]
  },
  experimental: {
    // This optimization improves bundle ergonomics but increases compile pressure.
    // Keep it off on Vercel to reduce OOM risk on 8 GB build workers.
    ...(isVercel || disableOptimizePackageImports || !isProduction
      ? {}
      : {
          optimizePackageImports: ['@radix-ui/*', 'lucide-react', 'framer-motion', 'recharts', 'handsontable', '@tiptap/react'],
        }),
    // Vercel (8GB): prefer lower peak memory over faster parallel build throughput.
    // This avoids worker SIGKILL/OOM in large monorepo compiles.
    ...(isVercel
      ? {
          // Cap SSG concurrency on 8 GB Vercel builders (1155+ routes OOM with 4 workers).
          staticGenerationMaxConcurrency: 1,
          memoryBasedWorkersCount: true,
          webpackMemoryOptimizations: true,
          webpackBuildWorker: false,
          parallelServerBuildTraces: false,
        }
      : {}),
  },
  webpack: (config, { webpack, isServer }) => {
    // Vercel build workers share RAM; cap parallel module work to reduce SIGKILL/OOM risk.
    if (isVercel) {
      config.parallelism = 1
    }
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    config.resolve.alias['@dashboard'] = dashboardAppDir
    config.resolve.alias['@app'] = dashboardAppDir
    if (disableOutputFileTracingForBuildTriage && isServer) {
      config.plugins = (config.plugins || []).filter(
        (p) => p?.constructor?.name !== 'TraceEntryPointsPlugin'
      )
    }
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
