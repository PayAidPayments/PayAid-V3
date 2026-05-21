import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const disableOptimizePackageImports =
  process.env.PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === '1'
const disableTranspilePackages =
  process.env.PAYAID_DISABLE_TRANSPILE_PACKAGES === '1'
const isVercel = process.env.VERCEL === '1'

/** When set (positive integer), overrides webpack `parallelism` for local triage (memory vs throughput). */
function applyWebpackParallelism(config) {
  const raw = process.env.PAYAID_WEBPACK_PARALLELISM
  const n = raw === '' || raw === undefined ? NaN : Number(raw)
  if (Number.isFinite(n) && n > 0) {
    config.parallelism = n
    return
  }
  if (isVercel) config.parallelism = 2
}

let withBundleAnalyzer = (config) => config
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: true,
    })
  } catch (_) {}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  ...(!disableTranspilePackages ? { transpilePackages: ['@payaid/db'] } : {}),
  experimental: {
    ...(disableOptimizePackageImports
      ? {}
      : {
          optimizePackageImports: [
            '@radix-ui/*',
            'lucide-react',
            'framer-motion',
            'recharts',
            'handsontable',
            '@tiptap/react',
            'x-data-spreadsheet',
          ],
        }),
  },
  webpack: (config, { webpack }) => {
    applyWebpackParallelism(config)
    if (process.env.PAYAID_WEBPACK_PROGRESS === '1') {
      let lastEmitted = -10
      config.plugins ??= []
      config.plugins.push(
        new webpack.ProgressPlugin((fraction, message, ...args) => {
          const pct = Math.min(100, Math.floor(Number(fraction) * 100))
          if (pct - lastEmitted < 5 && pct < 100) return
          lastEmitted = pct
          const tail = args.length ? ` ${args.join(' ')}` : ''
          console.info(`[payaid-webpack-progress] ${pct}% ${message}${tail}`)
        })
      )
    }
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    return config
  },
}
export default withBundleAnalyzer(nextConfig)
