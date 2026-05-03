'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Play, Plus, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function SlidesEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const presentationId = params?.id as string
  const [presentationName, setPresentationName] = useState('Untitled Presentation')
  const [slides, setSlides] = useState<any[]>([])
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (presentationId && presentationId !== 'new') {
      loadPresentation()
    } else if (presentationId === 'new') {
      // Redirect to new page
      router.push('/dashboard/slides/new')
    }
  }, [presentationId, router])

  const loadPresentation = async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/slides/${presentationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const presentation = await response.json()
        setPresentationName(presentation.name)
        setSlides(presentation.slides || [])
      }
    } catch (error) {
      console.error('Error loading presentation:', error)
    }
  }

  const handleSave = async () => {
    if (!token) {
      alert('Please log in to save')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/slides/${presentationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: presentationName,
          slides,
        }),
      })
      if (response.ok) {
        // Success - could show a toast notification here
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save presentation')
      }
    } catch (error) {
      console.error('Error saving presentation:', error)
      alert('Failed to save presentation. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const addSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      type: 'content',
      content: { title: 'New Slide', body: '' },
    }
    setSlides([...slides, newSlide])
    setSelectedSlide(slides.length)
  }

  const deleteSlide = (index: number) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index)
      setSlides(newSlides)
      if (selectedSlide >= newSlides.length) {
        setSelectedSlide(newSlides.length - 1)
      }
    }
  }

  const currentSlide = slides[selectedSlide]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Slide Thumbnails */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={addSlide}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Slide
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => setSelectedSlide(index)}
              className={`p-2 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedSlide === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">Slide {index + 1}</div>
              <div className="bg-gray-100 rounded h-24 flex items-center justify-center text-gray-400 text-sm">
                {slide.type === 'title' ? 'Title' : 'Content'}
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSlide(index)
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/slides"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <input
              type="text"
              value={presentationName}
              onChange={(e) => setPresentationName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl aspect-video p-12">
            {currentSlide && (
              <div className="h-full flex flex-col">
                {currentSlide.type === 'title' ? (
                  <>
                    <input
                      type="text"
                      value={currentSlide.content?.title || ''}
                      onChange={(e) => {
                        const newSlides = [...slides]
                        newSlides[selectedSlide].content.title = e.target.value
                        setSlides(newSlides)
                      }}
                      className="text-4xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-4"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={currentSlide.content?.subtitle || ''}
                      onChange={(e) => {
                        const newSlides = [...slides]
                        newSlides[selectedSlide].content.subtitle = e.target.value
                        setSlides(newSlides)
                      }}
                      className="text-xl text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                      placeholder="Subtitle"
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={currentSlide.content?.title || ''}
                      onChange={(e) => {
                        const newSlides = [...slides]
                        newSlides[selectedSlide].content.title = e.target.value
                        setSlides(newSlides)
                      }}
                      className="text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-4"
                      placeholder="Slide Title"
                    />
                    <textarea
                      value={currentSlide.content?.body || ''}
                      onChange={(e) => {
                        const newSlides = [...slides]
                        newSlides[selectedSlide].content.body = e.target.value
                        setSlides(newSlides)
                      }}
                      className="flex-1 text-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none"
                      placeholder="Slide content..."
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

