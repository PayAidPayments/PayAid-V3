import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Globe, Home } from 'lucide-react'

export default function SiteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mb-6">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Site or page not found
        </h1>
        <p className="text-slate-600 mb-6">
          This site isn&apos;t published yet, or the page you&apos;re looking for doesn&apos;t exist. Try the main PayAid site or contact the business for the correct link.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-[#53328A] hover:bg-[#422070]">
              <Home className="w-4 h-4 mr-2" />
              Go to PayAid
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
