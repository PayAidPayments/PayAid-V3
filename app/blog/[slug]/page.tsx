'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBlogPostBySlug, blogPosts } from '@/lib/data/blog'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { parseMarkdown } from '@/lib/utils/markdown'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setMounted(true)
    }, 0)
  }, [])

  if (!mounted) {
    return null
  }

  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/blog" className="flex items-center gap-2 text-xl font-bold" style={{ color: '#53328A' }}>
              <span>←</span>
              <span>PayAid Blog</span>
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#53328A' }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-96 w-full">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {post.category}
            </span>
            <span>{post.readTime} read</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#53328A' }}>
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 font-bold">{post.author.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.author}</p>
              <p className="text-sm text-gray-500">PayAid Team</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {parseMarkdown(post.content)}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#53328A' }}>
              Related Posts
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="relative h-48 w-full">
                    <img
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#53328A' }}>
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r" style={{ background: 'linear-gradient(135deg, #53328A 0%, #6B4BA1 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your free trial and experience the power of PayAid V3
          </p>
          <Link 
            href="/register"
            className="inline-block px-8 py-3 rounded-lg font-medium text-purple-900 bg-yellow-400 hover:bg-yellow-300 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 PayAid V3. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

