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
  typescript: { ignoreBuildErrors: false },
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
  },
  webpack: (config) => {
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    return config
  },
}
export default nextConfig
