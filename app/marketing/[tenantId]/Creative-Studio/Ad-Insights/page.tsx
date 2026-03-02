'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Lightbulb,
  Target,
  ArrowRight,
  TrendingUp,
  Package,
  ImageIcon,
  Bookmark,
  Trash2,
} from 'lucide-react'

const SAVED_COMPETITORS_KEY = 'adInsightsSavedCompetitors'

function getSavedCompetitors(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAVED_COMPETITORS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0) : []
  } catch {
    return []
  }
}

function setSavedCompetitors(urls: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SAVED_COMPETITORS_KEY, JSON.stringify(urls))
  } catch {
    // ignore
  }
}

const WINNING_STRATEGIES = [
  {
    title: 'Hook in the first 3 seconds',
    body: 'Reels, Shorts and TikTok skip fast. Put your strongest benefit or curiosity gap in the first 1–3 seconds.',
  },
  {
    title: 'Test one variable at a time',
    body: 'Change only hook, creative, or audience in each test so you know what drives performance.',
  },
  {
    title: 'Use UGC-style creatives',
    body: 'Authentic, testimonial-style ads often outperform polished brand creatives on social.',
  },
  {
    title: 'Match creative to placement',
    body: 'Square for feed, 9:16 for Stories/Reels/Shorts. Native formats get better approval and engagement.',
  },
  {
    title: 'Lead with problem or desire',
    body: 'State the problem your product solves or the outcome they want, then show the product.',
  },
]

export default function AdInsightsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [savedCompetitors, setSavedCompetitorsState] = useState<string[]>([])
  const [researchMessage, setResearchMessage] = useState<string | null>(null)

  useEffect(() => {
    setSavedCompetitorsState(getSavedCompetitors())
  }, [])

  const addCompetitor = () => {
    const url = competitorUrl.trim()
    if (!url) return
    const next = [...new Set([...savedCompetitors, url])]
    setSavedCompetitorsState(next)
    setSavedCompetitors(next)
    setCompetitorUrl('')
  }

  const removeCompetitor = (url: string) => {
    const next = savedCompetitors.filter((u) => u !== url)
    setSavedCompetitorsState(next)
    setSavedCompetitors(next)
  }

  const handleAnalyze = () => {
    if (!competitorUrl.trim()) {
      setResearchMessage('Enter a competitor page or ad URL to analyze (e.g. Facebook Ad Library link).')
      return
    }
    setResearchMessage('Competitor and market research is coming soon. We’ll analyze top creatives and suggest angles. For now, use the winning strategies below and create in Product Studio or Image Ads.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800">
          <BarChart3 className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ad Insights (AI-CMO)</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Winning strategies, research placeholders, and quick links to create high-performing creatives.
          </p>
        </div>
      </div>

      {/* Research */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Research
          </CardTitle>
          <CardDescription>
            Connect ad accounts or enter competitor / campaign URLs to analyze top creatives (integration coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="Competitor or ad page URL (e.g. Meta Ad Library)"
              className="flex-1 dark:bg-slate-900 dark:border-slate-700"
            />
            <Button onClick={handleAnalyze} variant="secondary">
              Analyze
            </Button>
          </div>
          {researchMessage && (
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              {researchMessage}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Future: Ad Library API integration, competitor ad inspiration (where compliant), and budget/creative suggestions.
          </p>
        </CardContent>
      </Card>

      {/* Saved competitors */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved competitors
          </CardTitle>
          <CardDescription>
            Save competitor or ad page URLs to analyze later. Analysis (coming soon) will suggest angles and creatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              placeholder="Paste competitor or ad page URL"
              className="flex-1 dark:bg-slate-900 dark:border-slate-700"
            />
            <Button onClick={addCompetitor} variant="secondary">
              Add
            </Button>
          </div>
          {savedCompetitors.length > 0 ? (
            <ul className="space-y-2">
              {savedCompetitors.map((url) => (
                <li
                  key={url}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0" title={url}>
                    {url}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" disabled className="text-xs">
                      Analyze (coming soon)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeCompetitor(url)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No saved competitors yet. Add a URL above.</p>
          )}
        </CardContent>
      </Card>

      {/* Winning strategies */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Winning strategies
          </CardTitle>
          <CardDescription>
            Best-practice tips to improve ad performance and reduce guesswork.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {WINNING_STRATEGIES.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{s.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Suggest creatives */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Create high-performing creatives
          </CardTitle>
          <CardDescription>
            Use Product Studio and Image Ads to turn insights into creatives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={`/marketing/${tenantId}/Creative-Studio/Product-Studio`}>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">Product Studio</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Marketplace-ready product images</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
            <Link href={`/marketing/${tenantId}/Creative-Studio/Image-Ads`}>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">Image Ads</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hooks, price tags, CTAs</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
