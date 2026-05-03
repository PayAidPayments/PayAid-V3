'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Trash2,
  Presentation,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SlideItem {
  id: string
  type: 'title' | 'content'
  content: { title: string; subtitle?: string; body?: string }
}

function generateId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultTitleSlide(): SlideItem {
  return { id: generateId(), type: 'title', content: { title: 'Untitled Presentation', subtitle: '' } }
}

function defaultContentSlide(): SlideItem {
  return { id: generateId(), type: 'content', content: { title: 'Slide Title', body: 'Add your content here...' } }
}

interface PayAidSlidesEditorProps {
  presentationId: string
  name: string
  initialSlides: unknown[]
  theme: string
  token: string
  backHref: string
}

const SAVE_DEBOUNCE_MS = 1200

export function PayAidSlidesEditor({
  presentationId,
  name,
  initialSlides,
  token,
  backHref,
}: PayAidSlidesEditorProps) {
  const normalized =
    Array.isArray(initialSlides) && initialSlides.length > 0
      ? (initialSlides as SlideItem[]).map((s) => ({
          id: s.id || generateId(),
          type: (s.type === 'title' ? 'title' : 'content') as 'title' | 'content',
          content: {
            title: s.content?.title ?? 'Title',
            subtitle: s.content?.subtitle ?? '',
            body: s.content?.body ?? '',
          },
        }))
      : [defaultTitleSlide()]

  const [slides, setSlides] = useState<SlideItem[]>(normalized)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [presentMode, setPresentMode] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveToApi = useCallback(
    async (newSlides: SlideItem[]) => {
      try {
        await fetch(`/api/slides/${presentationId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slides: newSlides }),
        })
      } catch (e) {
        console.error('Save presentation failed:', e)
      }
    },
    [presentationId, token]
  )

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveToApi(slides)
      saveTimeoutRef.current = null
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [slides, saveToApi])

  const currentSlide = slides[currentIndex] ?? slides[0]
  const setCurrentSlideContent = (patch: Partial<SlideItem['content']>) => {
    if (!currentSlide) return
    setSlides((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, content: { ...s.content, ...patch } } : s))
    )
  }

  const addSlide = (type: 'title' | 'content') => {
    const newSlide = type === 'title' ? defaultTitleSlide() : defaultContentSlide()
    setSlides((prev) => {
      const next = [...prev]
      next.splice(currentIndex + 1, 0, newSlide)
      return next
    })
    setCurrentIndex(currentIndex + 1)
  }

  const removeSlide = () => {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, i) => i !== currentIndex))
    setCurrentIndex(Math.min(currentIndex, slides.length - 2))
  }

  useEffect(() => {
    if (!presentMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresentMode(false)
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentMode, slides.length])

  if (presentMode) {
    const slide = slides[currentIndex]
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-12">
        <button
          type="button"
          onClick={() => setPresentMode(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
        >
          Exit (Esc)
        </button>
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full text-center">
          {slide?.type === 'title' ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {slide.content.title || 'Untitled'}
              </h1>
              {slide.content.subtitle && (
                <p className="text-xl text-slate-300">{slide.content.subtitle}</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-6">{slide?.content.title ?? 'Slide'}</h2>
              <p className="text-lg text-slate-300 whitespace-pre-wrap text-left max-w-2xl mx-auto">
                {slide?.content.body ?? ''}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 pb-8">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="text-slate-400 text-sm">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))}
            disabled={currentIndex === slides.length - 1}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <Link
          href={backHref}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          title="Back to presentations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">
          {name || 'Untitled presentation'}
        </span>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setPresentMode(true)}>
          <Presentation className="h-4 w-4" />
          Present
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                i === currentIndex
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-l-2 border-l-purple-500'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => setCurrentIndex(i)}
            >
              <GripVertical className="h-4 w-4 text-slate-400 shrink-0 cursor-grab" />
              <div className="flex-1 min-w-0 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                {slide.type === 'title' ? slide.content.title : slide.content.title || 'Slide'}
              </div>
              <span className="text-xs text-slate-400">{i + 1}</span>
            </div>
          ))}
          <div className="p-2 flex gap-1">
            <button
              type="button"
              onClick={() => addSlide('title')}
              className="flex-1 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + Title
            </button>
            <button
              type="button"
              onClick={() => addSlide('content')}
              className="flex-1 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + Content
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Slide {currentIndex + 1} of {slides.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={removeSlide}
              disabled={slides.length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete slide
            </Button>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-inner min-h-[280px]">
            {currentSlide?.type === 'title' ? (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Title
                </label>
                <input
                  type="text"
                  value={currentSlide.content.title}
                  onChange={(e) => setCurrentSlideContent({ title: e.target.value })}
                  placeholder="Presentation title"
                  className="w-full text-2xl font-bold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 focus:outline-none focus:ring-0 focus:border-purple-500 text-slate-900 dark:text-slate-100"
                />
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-4">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={currentSlide.content.subtitle ?? ''}
                  onChange={(e) => setCurrentSlideContent({ subtitle: e.target.value })}
                  placeholder="Subtitle (optional)"
                  className="w-full text-lg bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Slide title
                </label>
                <input
                  type="text"
                  value={currentSlide?.content.title ?? ''}
                  onChange={(e) => setCurrentSlideContent({ title: e.target.value })}
                  placeholder="Slide title"
                  className="w-full text-xl font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 focus:outline-none focus:ring-0 focus:border-purple-500 text-slate-900 dark:text-slate-100"
                />
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-4">
                  Content
                </label>
                <textarea
                  value={currentSlide?.content.body ?? ''}
                  onChange={(e) => setCurrentSlideContent({ body: e.target.value })}
                  placeholder="Add your content..."
                  rows={8}
                  className="w-full text-sm bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100 resize-y min-h-[120px]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
