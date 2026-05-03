'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Search, Plus, BookOpen, HelpCircle, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[]
  isPublished: boolean
  isPublic: boolean
  viewCount: number
  helpfulCount: number
  notHelpfulCount: number
  author: {
    name: string
    email: string
  }
  createdAt: string
}

export default function HelpCenterPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public')

  const { data, isLoading } = useQuery({
    queryKey: ['help-center-articles', search, selectedCategory, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (viewMode === 'public') {
        params.set('isPublished', 'true')
        params.set('isPublic', 'true')
      }

      const response = await fetch(`/api/help-center/articles?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch articles')
      return response.json()
    },
  })

  const articles: Article[] = data?.articles || []

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'modules', label: 'Modules' },
    { id: 'billing', label: 'Billing' },
    { id: 'api', label: 'API & Integrations' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
  ]

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/help-center/articles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to delete article')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-center-articles'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-2 text-gray-600">
            Self-service knowledge base and documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'public' ? 'default' : 'outline'}
            onClick={() => setViewMode('public')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Public View
          </Button>
          <Button
            variant={viewMode === 'admin' ? 'default' : 'outline'}
            onClick={() => setViewMode('admin')}
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Articles
          </Button>
          {viewMode === 'admin' && (
            <Link href="/dashboard/help-center/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="text-center py-12">Loading articles...</div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No articles found</p>
            {viewMode === 'admin' && (
              <Link href="/dashboard/help-center/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Article
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  {viewMode === 'admin' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to edit
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this article?')) {
                            deleteArticle.mutate(article.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex gap-4">
                    <span>👁️ {article.viewCount}</span>
                    <span>👍 {article.helpfulCount}</span>
                  </div>
                  {article.category && (
                    <Badge variant="outline">{article.category}</Badge>
                  )}
                </div>
                {article.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

