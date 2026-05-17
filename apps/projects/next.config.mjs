import path from 'path'
import { fileURLToPath } from 'url'
import { applyMonorepoWebpackAliases } from '../../scripts/next-monorepo-aliases.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@payaid/db', '@payaid/domain-projects'],
  webpack: (config) => {
    applyMonorepoWebpackAliases(config, __dirname, 'projects')
    return config
  },
}

export default nextConfig
