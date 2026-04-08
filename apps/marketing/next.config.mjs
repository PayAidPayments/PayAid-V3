/** Phase 17: Zoho speed – Turbopack + PPR + caching */
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payaid/social', '@payaid/core', '@payaid/db'],
  // Next.js 16: experimental.ppr has been merged into `cacheComponents`
  cacheComponents: true,
  webpack: (config) => {
    config.resolve.alias = config.resolve.alias || {}
    // Keep '@/...' pointing at repo root
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }],
      },
    ]
  },
}

export default nextConfig
