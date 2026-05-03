import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/developer/sdk/download
 * Download SDK libraries (JavaScript, Python, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'api-integration-hub')

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'javascript'

    // SDK package information
    const sdks = {
      javascript: {
        name: '@payaid/sdk-js',
        version: '3.0.0',
        description: 'PayAid JavaScript SDK',
        npm: 'npm install @payaid/sdk-js',
        github: 'https://github.com/payaid/sdk-js',
        documentation: '/dashboard/api-docs?lang=javascript',
        downloadUrl: 'https://github.com/payaid/sdk-js/releases/latest',
      },
      python: {
        name: 'payaid-sdk-python',
        version: '3.0.0',
        description: 'PayAid Python SDK',
        pip: 'pip install payaid-sdk-python',
        github: 'https://github.com/payaid/sdk-python',
        documentation: '/dashboard/api-docs?lang=python',
        downloadUrl: 'https://github.com/payaid/sdk-python/releases/latest',
      },
      php: {
        name: 'payaid/php-sdk',
        version: '3.0.0',
        description: 'PayAid PHP SDK',
        composer: 'composer require payaid/php-sdk',
        github: 'https://github.com/payaid/sdk-php',
        documentation: '/dashboard/api-docs?lang=php',
        downloadUrl: 'https://github.com/payaid/sdk-php/releases/latest',
      },
      nodejs: {
        name: '@payaid/sdk-node',
        version: '3.0.0',
        description: 'PayAid Node.js SDK',
        npm: 'npm install @payaid/sdk-node',
        github: 'https://github.com/payaid/sdk-node',
        documentation: '/dashboard/api-docs?lang=nodejs',
        downloadUrl: 'https://github.com/payaid/sdk-node/releases/latest',
      },
    }

    const sdk = sdks[language as keyof typeof sdks] || sdks.javascript

    return NextResponse.json({ sdk })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get SDK error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SDK information' },
      { status: 500 }
    )
  }
}

