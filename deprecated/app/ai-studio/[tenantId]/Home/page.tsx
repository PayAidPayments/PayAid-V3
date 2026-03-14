'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, MessageSquare, Lightbulb, Globe, Palette, BookOpen, Bot } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function AIStudioHomePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('ai-studio') || getModuleConfig('crm')!

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

  const heroMetrics = [
    {
      label: 'AI Features',
      value: '7',
      icon: <Bot className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Active Agents',
      value: '9',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'gold' as const,
    },
    {
      label: 'Total Interactions',
      value: '1.2K',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'info' as const,
    },
    {
      label: 'AI Insights',
      value: '24/7',
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'success' as const,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="AI Studio"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <GlassCard key={feature.href} delay={index * 0.1}>
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
              </GlassCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
