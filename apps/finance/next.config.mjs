import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payaid/db'],
  webpack: (config) => {
    config.resolve.alias = config.resolve.alias || {}
    // Keep '@/...' pointing at repo root (same pattern as apps/crm)
    config.resolve.alias['@'] = path.resolve(__dirname, '../..')
    return config
  },
}

export default nextConfig
