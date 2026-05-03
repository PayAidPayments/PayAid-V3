/** Phase 17: Zoho speed – Turbopack + PPR */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payaid/core', '@payaid/db'],
  experimental: {
    turbopack: true,
    ppr: true,
  },
  async headers() {
    return [
      { source: '/(.*)', headers: [{ key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }] },
    ]
  },
}
export default nextConfig
