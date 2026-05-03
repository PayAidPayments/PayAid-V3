'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function AppReviewsPage() {
  const params = useParams()
  const appId = params?.id as string
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  const { data, refetch } = useQuery({
    queryKey: ['app-reviews', appId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/apps/${appId}/reviews`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load reviews')
      return res.json()
    },
  })

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/marketplace/apps/${appId}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create review')
      }
      return res.json()
    },
    onSuccess: () => {
      refetch()
      setTitle('')
      setComment('')
      setRating(5)
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Reviews</h1>
        <p className="text-gray-600 mt-1">Share your experience with this app</p>
      </div>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{data.averageRating?.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i <= Math.round(data.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      i <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              placeholder="Brief summary"
            />
          </div>
          <div>
            <Label htmlFor="comment">Review</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={4}
              placeholder="Share your experience..."
            />
          </div>
          <Button
            onClick={() =>
              createReviewMutation.mutate({ rating, title, comment })
            }
            disabled={createReviewMutation.isPending}
          >
            Submit Review
          </Button>
        </CardContent>
      </Card>

      {data?.reviews && data.reviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Reviews</h2>
          {data.reviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold">{review.user?.name || 'Anonymous'}</div>
                      {review.isVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.title && (
                      <div className="font-medium mb-1">{review.title}</div>
                    )}
                    {review.comment && (
                      <div className="text-gray-700">{review.comment}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
