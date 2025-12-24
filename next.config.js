/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence error and use webpack instead
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for Windows path issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    // Exclude native modules from webpack bundling (server-side only)
    if (isServer) {
      // Externalize native modules that can't be bundled
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'dockerode': 'commonjs dockerode',
          'ssh2': 'commonjs ssh2',
          'docker-modem': 'commonjs docker-modem',
        })
      } else {
        config.externals = [
          config.externals,
          {
            'dockerode': 'commonjs dockerode',
            'ssh2': 'commonjs ssh2',
            'docker-modem': 'commonjs docker-modem',
          }
        ]
      }
      
      // Ignore native binary files
      config.module = config.module || {}
      config.module.rules = config.module.rules || []
      config.module.rules.push({
        test: /\.node$/,
        loader: 'ignore-loader',
      })
    }
    
    // Add aliases for path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@payaid/db': require('path').resolve(__dirname, 'lib/db/prisma'),
    }
    return config
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Internal rewrites to map tenant-scoped URLs to existing routes
  async rewrites() {
    return [
      {
        source: '/dashboard/:tenantId/:path*',
        destination: '/dashboard/:path*',
        has: [
          {
            type: 'header',
            key: 'authorization',
          },
        ],
      },
    ]
  },
  
  // Note: API routes are synced from module directories to app/api/ for Next.js to serve them
  // Source of truth: Module directories (crm-module/app/api/, etc.)
  // Runtime location: app/api/ (synced via scripts/sync-module-routes-to-monolith.ts)
  // Future: Routes will be served from separate module deployments
}

module.exports = nextConfig

