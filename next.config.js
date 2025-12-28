/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence error, but we'll use webpack for better compatibility
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for Windows path issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        child_process: false,
      }
    }
    
    // Exclude native modules from webpack bundling (server-side only)
    if (isServer) {
      // Externalize native modules that can't be bundled
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push(
          {
            'dockerode': 'commonjs dockerode',
            'ssh2': 'commonjs ssh2',
            'docker-modem': 'commonjs docker-modem',
            'bull': 'commonjs bull',
            'pdfkit': 'commonjs pdfkit',
          }
        )
      } else {
        config.externals = [
          config.externals,
          {
            'dockerode': 'commonjs dockerode',
            'ssh2': 'commonjs ssh2',
            'docker-modem': 'commonjs docker-modem',
            'bull': 'commonjs bull',
            'pdfkit': 'commonjs pdfkit',
          }
        ]
      }
    }
    
    // Ignore problematic modules in client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'dockerode': false,
        'ssh2': false,
        'docker-modem': false,
        'bull': false,
        'pdfkit': false,
        'jpeg-exif': false,
        'png-js': false,
      }
    }
    
    // Add aliases for path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@payaid/db': require('path').resolve(__dirname, 'lib/db/prisma'),
      'lucide-react': require('path').resolve(__dirname, 'node_modules/lucide-react'),
    }
    return config
  },
  images: {
    // domains is deprecated, use remotePatterns instead
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Internal rewrites to map tenant-scoped URLs to existing routes
  // This allows /dashboard/[tenantId]/websites to internally route to /dashboard/websites
  // while keeping the tenant ID in the browser URL
  async rewrites() {
    return [
      {
        source: '/dashboard/:tenantId/:path*',
        destination: '/dashboard/:path*',
      },
    ]
  },
  
  // Note: API routes are synced from module directories to app/api/ for Next.js to serve them
  // Source of truth: Module directories (crm-module/app/api/, etc.)
  // Runtime location: app/api/ (synced via scripts/sync-module-routes-to-monolith.ts)
  // Future: Routes will be served from separate module deployments
}

module.exports = nextConfig

