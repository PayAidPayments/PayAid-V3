'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, MessageSquare, Lightbulb, Globe, Palette, BookOpen } from 'lucide-react'

export default function AIStudioHomePage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const aiFeatures = [
    {
      title: 'AI Co-founder',
      description: 'Your business AI assistant with 9 specialist agents for finance, sales, marketing, HR, and more',
      href: `/ai-studio/${tenantId}/Cofounder`,
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'AI Chat',
      description: 'General-purpose conversational AI assistant for questions, explanations, and creative tasks',
      href: `/ai-studio/${tenantId}/Chat`,
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'AI Insights',
      description: 'AI-powered business analysis, revenue insights, risk warnings, and data-driven recommendations',
      href: `/ai-studio/${tenantId}/Insights`,
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Website Builder',
      description: 'AI-powered website builder with component generation, templates, and live preview',
      href: `/ai-studio/${tenantId}/Websites`,
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Logo Generator',
      description: 'AI-powered logo creation with multiple variations and customization options',
      href: `/ai-studio/${tenantId}/Logos`,
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Knowledge & RAG AI',
      description: 'Document Q&A with RAG, source citations, audit trails, and multi-document search',
      href: `/ai-studio/${tenantId}/Knowledge`,
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'AI Agent Marketplace',
      description: 'Browse and use specialized AI agents for sales, marketing, finance, HR, and more',
      href: `/ai-studio/${tenantId}/Agents`,
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Studio</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Explore all AI-powered features to enhance your business operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.href}>
                  <Button className="w-full" variant="outline">
                    Open {feature.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
