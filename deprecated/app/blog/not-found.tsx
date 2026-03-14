import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft, BookOpen } from 'lucide-react'

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Post not found
        </h1>
        <p className="text-gray-600 mb-6">
          This blog post doesn&apos;t exist or may have been moved. Browse our blog for other articles or head back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/blog">
            <Button className="w-full sm:w-auto" style={{ backgroundColor: '#53328A' }}>
              <BookOpen className="w-4 h-4 mr-2" />
              All posts
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
