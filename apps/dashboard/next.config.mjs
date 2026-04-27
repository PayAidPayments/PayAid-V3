import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const isVercel = process.env.VERCEL === '1'
const isProduction = process.env.NODE_ENV === 'production'
const customDistDir = process.env.NEXT_BUILD_DIST_DIR
// One flag to enable all dependency/shell triage stubs (does not stub route families).
const triageCombinedAll = process.env.NEXT_BUILD_TRIAGE_COMBINED_ALL === '1'
const disableChartsForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_CHARTS === '1' || triageCombinedAll
const disableAiWebsitePagesForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_AI_WEBSITE_PAGES === '1' || triageCombinedAll
const disableCoreModuleShellForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_CORE_MODULE_SHELL === '1' || triageCombinedAll
const disabledRouteFamiliesForBuildTriage = String(
  process.env.NEXT_BUILD_TRIAGE_DISABLE_FAMILIES || ''
)
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const buildSurfaceProfile = String(process.env.NEXT_BUILD_SURFACE_PROFILE || '')
  .trim()
  .toLowerCase()
const coreSurfaceExcludedFamilies = [
  '(demo)',
  'about',
  'agriculture',
  'ai-chat',
  'ai-cofounder',
  'ai-insights',
  'ai-studio',
  'appointments',
  'asset-management',
  'automotive',
  'beauty',
  'blog',
  'careers',
  'communication',
  'compliance',
  'construction',
  'contact',
  'contracts',
  'customer-portal',
  'docs',
  'drive',
  'ecommerce',
  'education',
  'events',
  'features',
  'field-service',
  'financial-services',
  'forgot-password',
  'healthcare',
  'help',
  'help-center',
  'home',
  'hospitality',
  'industries',
  'industry-intelligence',
  'knowledge-rag',
  'legal',
  'lms',
  'logistics',
  'logo-generator',
  'manufacturing',
  'marketing',
  'marketing-demo',
  'marketplace',
  'meet',
  'modules',
  'onboarding',
  'pdf',
  'portal',
  'pricing',
  'privacy-policy',
  'productivity',
  'professional-services',
  'projects',
  'real-estate',
  'register',
  'reset-password',
  'restaurant',
  'retail',
  'sales',
  'security',
  'signup',
  'sites',
  'slides',
  'spreadsheet',
  'support',
  'terms-of-service',
  'voice-agents',
  'website-builder',
  'website-builder-v2',
  'wholesale',
  'workflow-automation',
]
const paymentsCoreSurfaceExcludedFamilies = [
  ...coreSurfaceExcludedFamilies,
  'admin',
  'analytics',
  'approvals',
  'hr',
  'inventory',
  'notifications',
  'super-admin',
]
const paymentsMinSurfaceExcludedFamilies = [
  ...paymentsCoreSurfaceExcludedFamilies,
  'checkout',
  'crm',
  'dashboard',
  'finance',
  'settings',
]
const corePageDataLiteExcludedFamilies = [
  ...coreSurfaceExcludedFamilies,
  'admin',
  'analytics',
  'approvals',
  'super-admin',
]
const profileExcludedRouteFamiliesForBuild =
  buildSurfaceProfile === 'core'
    ? coreSurfaceExcludedFamilies
    : buildSurfaceProfile === 'core-page-data-lite'
    ? corePageDataLiteExcludedFamilies
    : buildSurfaceProfile === 'payments-core'
    ? paymentsCoreSurfaceExcludedFamilies
    : buildSurfaceProfile === 'payments-min'
    ? paymentsMinSurfaceExcludedFamilies
    : []
const effectiveDisabledRouteFamiliesForBuildTriage = [
  ...new Set([...disabledRouteFamiliesForBuildTriage, ...profileExcludedRouteFamiliesForBuild]),
]
const disableFramerMotionForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_FRAMER_MOTION === '1' || triageCombinedAll
const disablePayaidAiForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_PAYAID_AI === '1' || triageCombinedAll
const disableTiptapForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_TIPTAP === '1' || triageCombinedAll
const disableXlsxForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_XLSX === '1' || triageCombinedAll
const disableApiRoutesForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_API_ROUTES === '1' || triageCombinedAll
const disableTranspilePackagesForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_TRANSPILE_PACKAGES === '1'
const forceOptimizePackageImportsForBuildTriage =
  process.env.NEXT_BUILD_FORCE_OPTIMIZE_PACKAGE_IMPORTS === '1'
const disableOutputFileTracingForBuildTriage =
  process.env.NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING === '1'
const disableOptimizePackageImports =
  process.env.PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === '1'

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
  // Monorepo: trace serverless deps from repo root (hoisted node_modules), not only apps/dashboard.
  // Next.js 16 no longer accepts `outputFileTracing: false` (invalid config / stripped). When
  // NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1, we strip TraceEntryPointsPlugin in webpack below.
  outputFileTracingRoot: rootDir,
  ...(disableTranspilePackagesForBuildTriage
    ? {}
    : { transpilePackages: ['@payaid/db', '@payaid/social', '@payaid/ai'] }),
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
    ...((isVercel && !forceOptimizePackageImportsForBuildTriage) ||
    disableOptimizePackageImports ||
    !isProduction
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
  webpack: (config, { webpack, isServer }) => {
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    if (disableOutputFileTracingForBuildTriage && isServer) {
      config.plugins = (config.plugins || []).filter(
        (p) => p?.constructor?.name !== 'TraceEntryPointsPlugin'
      )
    }
    if (disableChartsForBuildTriage) {
      // Build-triage mode: replace recharts with a lightweight shim so we can
      // measure how much chart-heavy bundles contribute to compile duration.
      config.resolve.alias.recharts = path.resolve(__dirname, 'lib/build-triage/recharts-stub.tsx')
    }
    if (disableAiWebsitePagesForBuildTriage) {
      // Build-triage mode: replace AI Studio + Website Builder page modules so
      // we can measure their compile contribution without deleting routes.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /app[\\/](ai-studio|website-builder)[\\/].*[\\/]page\.(tsx|ts|jsx|js)$/,
          path.resolve(__dirname, 'lib/build-triage/route-page-stub.tsx')
        )
      )
    }
    if (disableCoreModuleShellForBuildTriage) {
      const coreStub = path.resolve(__dirname, 'lib/build-triage/core-module-shell-stub.tsx')
      // Build-triage mode: replace shared module-shell UI wrappers to measure
      // whether the global module shell stack is a dominant compile cost.
      config.resolve.alias['@/components/modules/AppShell'] = coreStub
      config.resolve.alias['@/components/modules/UniversalModuleLayout'] = coreStub
      config.resolve.alias['@/components/modules/UniversalModuleHero'] = coreStub
      config.resolve.alias['@/components/modules/GlassCard'] = coreStub
    }
    if (effectiveDisabledRouteFamiliesForBuildTriage.length > 0) {
      // Build-triage mode: replace selected top-level app route families to
      // identify which domain contributes most compile-time pressure.
      for (const family of effectiveDisabledRouteFamiliesForBuildTriage) {
        const familyRegex = new RegExp(
          `app[\\\\/]${family.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}[\\\\/].*[\\\\/]page\\.(tsx|ts|jsx|js)$`
        )
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            familyRegex,
            path.resolve(__dirname, 'lib/build-triage/route-page-stub.tsx')
          )
        )
      }
    }
    if (disableFramerMotionForBuildTriage) {
      const stub = path.resolve(__dirname, 'lib/build-triage/framer-motion-stub.tsx')
      config.resolve.alias['framer-motion'] = stub
    }
    if (disablePayaidAiForBuildTriage) {
      const stub = path.resolve(__dirname, 'lib/build-triage/payaid-ai-stub.ts')
      config.resolve.alias['@payaid/ai'] = stub
    }
    if (disableTiptapForBuildTriage) {
      config.resolve.alias['@tiptap/react'] = path.resolve(
        __dirname,
        'lib/build-triage/tiptap-react-stub.tsx'
      )
      config.resolve.alias['@tiptap/starter-kit'] = path.resolve(
        __dirname,
        'lib/build-triage/tiptap-starter-kit-stub.ts'
      )
    }
    if (disableXlsxForBuildTriage) {
      config.resolve.alias.xlsx = path.resolve(__dirname, 'lib/build-triage/xlsx-stub.ts')
    }
    if (disableApiRoutesForBuildTriage) {
      // Build-triage mode: replace app/api route handlers to measure
      // whether API route graph is a dominant compile-time contributor.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /app[\\/]api[\\/].*[\\/]route\.(tsx|ts|jsx|js)$/,
          path.resolve(__dirname, 'lib/build-triage/api-route-stub.ts')
        )
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
