'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Article {
  id: string
  title: string
  content: string
  category?: string
  tags: string[]
  viewCount: number
  helpfulCount: number
}

export default function PublicHelpCenterPage() {
  const params = useParams()
  const tenantSlug = (params.tenantSlug as string) || ''
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [tenantSlug, selectedCategory])

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('isPublished', 'true')
      params.append('isPublic', 'true')
      if (selectedCategory) params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/help-center/articles?${params}`)
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchArticles()
  }

  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600">Find answers to common questions</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 justify-center flex-wrap">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat || '')}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Articles */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No articles found. Please try a different search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  {article.category && (
                    <CardDescription>{article.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                  </p>
                  <Link href={`/help/${tenantSlug}/${article.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Read More
                    </Button>
                  </Link>
                  <div className="mt-2 text-xs text-gray-500">
                    {article.viewCount} views
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

