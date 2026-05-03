import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Layers, ArrowLeft, Grid3X3 } from 'lucide-react'

export default function FeatureNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mb-6">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Feature not found
        </h1>
        <p className="text-gray-600 mb-6">
          This feature page doesn&apos;t exist or the link may be outdated. Explore our features or start a free trial to see what PayAid can do for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/#features">
            <Button className="w-full sm:w-auto" style={{ backgroundColor: '#53328A' }}>
              <Grid3X3 className="w-4 h-4 mr-2" />
              View features
            </Button>
          </Link>
          <Link href="/#industry-selector">
            <Button variant="outline" className="w-full sm:w-auto">
              Choose industry & start
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
