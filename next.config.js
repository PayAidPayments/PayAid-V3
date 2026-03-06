/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 16: silence Turbopack vs webpack conflict when using --webpack in scripts
  turbopack: {},
  // Vercel uses serverless functions, not standalone builds
  // Only enable standalone for Docker/self-hosted deployments
  // output: 'standalone', // Disabled for Vercel compatibility
  // Enable response compression (gzip/brotli) for better performance
  compress: true,
  // Custom webpack used via npm run dev --webpack / npm run build --webpack
  // Optimize TypeScript compilation
  typescript: {
    // Don't fail build on type errors during build (type checking happens separately)
    // This speeds up builds significantly
    // Set to true for Vercel builds to allow deployment even with type errors
    ignoreBuildErrors: true,
  },
  // Reduce OOM risk on Vercel (8GB build container): leave headroom for OS + Prisma + subprocesses
  productionBrowserSourceMaps: false,
  // Optimize build performance
  experimental: {
    // Enable faster builds with SWC minification
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
    // Lower memory use during build (Next.js 15+)
    webpackMemoryOptimizations: true,
    // Disable worker so single Node process uses one heap (avoids OOM from main+worker)
    webpackBuildWorker: false,
    cpus: 1,
  },

  // Security Headers (Layer 6)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws://localhost:3001 wss://localhost:3001 ws://127.0.0.1:3001 wss://127.0.0.1:3001 https://*.supabase.co https://*.vercel.app;"
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(self), camera=()'
          }
        ],
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Ensure path aliases are set first for both server and client
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@payaid/db': require('path').resolve(__dirname, 'lib/db/prisma'),
      'lucide-react': require('path').resolve(__dirname, 'node_modules/lucide-react'),
    }
    
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
      
      // Ignore problematic modules in client bundle
      // Preserve existing aliases (especially @ alias)
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
      
      // Ensure @ alias is still set (in case it was lost)
      if (!config.resolve.alias['@']) {
        config.resolve.alias['@'] = require('path').resolve(__dirname)
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
            'node-statsd': 'commonjs node-statsd',
            'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
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
            'node-statsd': 'commonjs node-statsd',
            'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
          }
        ]
      }
      
      // Ensure pdf-lib is properly resolved (it's a server-side only module)
      // Preserve existing aliases (especially @ alias)
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-lib': require('path').resolve(__dirname, 'node_modules/pdf-lib'),
      }
      
      // Ensure @ alias is still set (in case it was lost)
      if (!config.resolve.alias['@']) {
        config.resolve.alias['@'] = require('path').resolve(__dirname)
      }
    }

    // Reduce OOM: single-thread minification (Node heap 5120 in package.json "build")
    if (!dev && config.optimization?.minimizer) {
      try {
        const idx = config.optimization.minimizer.findIndex(m => m?.constructor?.name === 'TerserPlugin')
        if (idx >= 0 && config.optimization.minimizer[idx]?.options) {
          config.optimization.minimizer[idx].options = {
            ...config.optimization.minimizer[idx].options,
            parallel: 1,
          }
        }
      } catch (_) {}
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
  // while keeping the tenant ID in the browser URL.
  // Do NOT rewrite /home/:tenantId to /tenant-home/:tenantId - that caused an infinite
  // redirect loop (tenant-home shows "Redirecting..." and sends back to /home/:tenantId).
  async rewrites() {
    return [
      {
        source: '/dashboard/:tenantId/:path*',
        destination: '/dashboard/:path*',
      },
    ]
  },
  
  // Decoupled structure: API routes are synced from module directories to app/api/ for Next.js to serve
  // Source of truth: Module directories (crm-module/app/api/, hr-module/app/api/, etc.)
  // Runtime location: app/api/ (synced via scripts/sync-module-routes-to-monolith.ts)
  // Future: Routes can be served from separate module deployments
}

module.exports = nextConfig

