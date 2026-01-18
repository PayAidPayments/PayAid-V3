'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getAllIndustries, getRecommendedModules, getIndustryConfig } from '@/lib/industries/config'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/brand/Logo'
import { 
  getModulePricing, 
  calculateTotalPrice, 
  getBestPricing,
  MODULE_PRICING 
} from '@/lib/pricing/config'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

// Deprecated modules to exclude (defined outside component to avoid scope issues)
const deprecatedModules = ['invoicing', 'accounting'] as const

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  // All hooks must be called before any conditional returns
  const [showModuleSelection, setShowModuleSelection] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional'>('professional')
  const [activeTab, setActiveTab] = useState<'crm' | 'invoicing' | 'inventory' | 'analytics'>('crm')
  const [isPaused, setIsPaused] = useState(false)
  const industries = getAllIndustries()
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Define tabs constant before hooks
  const tabs = [
    { id: 'crm' as const, label: 'CRM' },
    { id: 'invoicing' as const, label: 'Invoicing' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'analytics' as const, label: 'Analytics' },
  ]

  // Redirect authenticated users to /home (app selection page)
  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      router.replace('/home')
    }
  }, [isAuthenticated, router])

  // Auto-scroll through tabs with hover to pause
  useEffect(() => {
    if (!isPaused) {
      autoScrollIntervalRef.current = setInterval(() => {
        setActiveTab((prev) => {
          const currentIndex = tabs.findIndex(t => t.id === prev)
          const nextIndex = (currentIndex + 1) % tabs.length
          return tabs[nextIndex].id
        })
      }, 3000) // Change tab every 3 seconds
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  // Initialize selected modules when industry is selected
  useEffect(() => {
    if (selectedIndustry) {
      const recommendedModules = getRecommendedModules(selectedIndustry)
      const allRecommended = [
        ...recommendedModules.coreModules,
        ...recommendedModules.industryPacks,
      ]
      // Filter out deprecated modules
      const filteredRecommended = allRecommended.filter(
        moduleId => !deprecatedModules.includes(moduleId)
      )
      // Always include ai-studio
      const modulesToSelect = filteredRecommended.includes('ai-studio') 
        ? filteredRecommended 
        : [...filteredRecommended, 'ai-studio']
      setSelectedModules(modulesToSelect)
      setShowModuleSelection(true)
      // Scroll to module selection
      setTimeout(() => {
        document.getElementById('module-selection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndustry])

  // Don't render landing page for authenticated users
  if (!mounted || isAuthenticated) {
    return null
  }

  // All available modules for selection
  const allAvailableModules = [
    { id: 'crm', name: 'CRM', description: 'Manage contacts, leads, and customer relationships', icon: '👥' },
    { id: 'sales', name: 'Sales', description: 'Track sales, deals, and revenue', icon: '💼' },
    { id: 'marketing', name: 'Marketing', description: 'Run campaigns, email marketing, and social media', icon: '📢' },
    { id: 'finance', name: 'Finance & Accounting', description: 'Accounting, invoicing, and financial management', icon: '💰' },
    { id: 'hr', name: 'HR & Payroll', description: 'Employee management, payroll, and HR operations', icon: '👔' },
    { id: 'communication', name: 'Communication', description: 'Email, SMS, WhatsApp, and team communication', icon: '💬' },
    { id: 'inventory', name: 'Inventory', description: 'Stock management and tracking', icon: '📦' },
    { id: 'projects', name: 'Projects', description: 'Project management, tasks, and time tracking', icon: '📁' },
    { id: 'analytics', name: 'Analytics', description: 'Business intelligence and reporting', icon: '📊' },
    { id: 'productivity', name: 'Productivity Suite', description: 'Docs, spreadsheets, presentations, and collaboration', icon: '📝' },
    { id: 'workflow', name: 'Workflow Automation', description: 'Automate business processes and workflows', icon: '⚙️' },
    { id: 'ai-studio', name: 'AI Studio', description: 'AI-powered automation and insights', icon: '✨' },
  ]

  // Get recommended modules for display
  const recommendedModules = selectedIndustry 
    ? getRecommendedModules(selectedIndustry) 
    : { coreModules: [], industryPacks: [] }

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId)
    setShowModuleSelection(false)
    setSelectedModules([])
  }

  const handleModuleToggle = (moduleId: string) => {
    // AI Studio is always included
    if (moduleId === 'ai-studio') return
    // Don't allow deprecated modules
    if (deprecatedModules.includes(moduleId)) return
    
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId)
      } else {
        // Ensure ai-studio is always included
        const newModules = [...prev, moduleId]
        if (!newModules.includes('ai-studio')) {
          newModules.push('ai-studio')
        }
        return newModules
      }
    })
  }

  const handleStartTrial = () => {
    // Filter out deprecated modules before signup
    const filteredModules = selectedModules.filter(
      moduleId => !deprecatedModules.includes(moduleId)
    )
    const modulesParam = filteredModules.join(',')
    router.push(`/signup?industry=${selectedIndustry}&modules=${modulesParam}&tier=${selectedTier}`)
  }

  // Calculate pricing (filter out deprecated modules)
  const activeModules = selectedModules.filter(
    moduleId => !deprecatedModules.includes(moduleId)
  )
  const pricing = activeModules.length > 0 
    ? getBestPricing(selectedIndustry, activeModules, selectedTier)
    : null

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    setIsPaused(true)
    // Resume after 5 seconds
    setTimeout(() => setIsPaused(false), 5000)
  }

    return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo href="/" />
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white">
                  Get Started
                </Button>
              </Link>
        </div>
      </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              10×
            </div>
            <div className="text-sm md:text-base text-gray-700 dark:text-gray-400 font-medium" style={{ color: '#374151' }}>
              Faster Execution
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              50%
            </div>
            <div className="text-sm md:text-base text-gray-700 dark:text-gray-400 font-medium" style={{ color: '#374151' }}>
              Cost Savings
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              100%
            </div>
            <div className="text-sm md:text-base text-gray-700 dark:text-gray-400 font-medium" style={{ color: '#374151' }}>
              Business Visibility
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              0
            </div>
            <div className="text-sm md:text-base text-gray-700 dark:text-gray-400 font-medium" style={{ color: '#374151' }}>
              Tools to Switch
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section - Two Column Layout */}
      <section className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Column - Text and CTA */}
          <div className="space-y-6 lg:space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="text-[#53328A]" style={{ color: '#53328A' }}>Your Complete Business OS </span>
              <span className="text-[#F5C700]" style={{ color: '#F5C700' }}>Powered by AI</span>
          </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-500 leading-relaxed max-w-2xl" style={{ color: '#4B5563' }}>
            AI-powered CRM, automation, and intelligence to streamline operations, reduce costs, and elevate customer experiences. Everything your business needs—from conversational AI to workflow automation—all in one platform. Built for India.
          </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-[#53328A] hover:bg-[#3F1F62] text-white px-8 py-6 text-base font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#53328A', color: '#FFFFFF' }}
                >
                Start Free Trial
              </Button>
            </Link>
              <Link href="#dashboard-showcase">
                <Button 
                  size="lg" 
                  className="bg-white border-2 border-[#53328A] text-[#53328A] hover:bg-gray-50 px-8 py-6 text-base font-semibold rounded-lg transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#53328A', 
                    color: '#53328A',
                    borderWidth: '2px'
                  }}
                >
                Explore AI Features →
              </Button>
            </Link>
          </div>
        </div>

          {/* Right Column - Superhero Illustration */}
          <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px] xl:min-h-[700px]">
            <Image
              src="/hero-digital-specialists.png"
              alt="Digital Specialists Ready to Transform Your Business"
              fill
              className="object-contain"
              priority
            />
          </div>
          </div>
        </section>

        {/* Industry Selection Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4 text-gray-900 dark:text-white" style={{ color: '#111827' }}>
            What industry is your business in?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-500 mb-6" style={{ color: '#4B5563' }}>
            Select your industry to get started with tailored features
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry-select" className="text-base font-medium text-gray-700 dark:text-gray-300" style={{ color: '#374151' }}>
                Select Your Industry
              </Label>
              <Select
                value={selectedIndustry}
                onValueChange={handleIndustrySelect}
              >
                <SelectTrigger 
                  id="industry-select" 
                  className="w-full h-12 text-base dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  <SelectValue placeholder="Choose your industry..." />
            {industries.map((industry) => (
                    <SelectItem 
                      key={industry.id} 
                      value={industry.id}
                    >
                      {industry.icon} {industry.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="others">
                    ➕ Others (Not Listed)
                  </SelectItem>
                </SelectTrigger>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Module Selection Section */}
      {showModuleSelection && selectedIndustry && (
        <section id="module-selection" className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            {/* Free Trial Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 mb-8 text-center shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="text-2xl font-bold">Start with ALL Modules FREE for 1 Month</h3>
              </div>
              <p className="text-green-50 text-lg">
                No credit card required • Cancel anytime • Modify modules during trial
              </p>
        </div>

                {/* Tier Selection */}
            <div className="mb-8">
              <Label className="text-base font-semibold mb-4 block" style={{ color: '#111827' }}>
                Choose Your Plan
              </Label>
              <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedTier('starter')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          selectedTier === 'starter'
                      ? 'border-[#53328A] bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                  <div className="font-semibold text-lg mb-1" style={{ color: '#111827' }}>Starter</div>
                  <div className="text-sm" style={{ color: '#4B5563' }}>For small teams</div>
                      </button>
                      <button
                        onClick={() => setSelectedTier('professional')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          selectedTier === 'professional'
                      ? 'border-[#53328A] bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                  <div className="font-semibold text-lg mb-1" style={{ color: '#111827' }}>
                    Professional <span className="text-sm text-[#F5C700]">⭐ Most Popular</span>
                  </div>
                  <div className="text-sm" style={{ color: '#4B5563' }}>For growing businesses</div>
                </button>
                  </div>
                </div>

            {/* Recommended Modules */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#111827' }}>
                Recommended Modules for Your Industry
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6" style={{ color: '#4B5563' }}>
                Based on your industry selection, we recommend these modules. You can customize your selection.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAvailableModules
                  .filter(module => !deprecatedModules.includes(module.id))
                  .map((module) => {
                  const isSelected = selectedModules.includes(module.id)
                  const isAIStudio = module.id === 'ai-studio'
                  const modulePricing = MODULE_PRICING[module.id]
                  const price = modulePricing 
                    ? selectedTier === 'starter' 
                      ? modulePricing.starter 
                      : modulePricing.professional
                    : 0
                        
                        return (
                    <Card 
                      key={module.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected 
                          ? 'border-2 border-[#53328A] bg-purple-50 dark:bg-purple-900/20' 
                          : 'border border-gray-200 dark:border-gray-700'
                      } ${isAIStudio ? 'bg-gradient-to-br from-purple-50 to-yellow-50 dark:from-purple-900/30 dark:to-yellow-900/30' : ''}`}
                      onClick={() => !isAIStudio && handleModuleToggle(module.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              disabled={isAIStudio}
                            onCheckedChange={() => !isAIStudio && handleModuleToggle(module.id)}
                            className="mt-1"
                          />
                              <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{module.icon}</span>
                              <h4 className="font-semibold text-lg" style={{ color: '#111827' }}>
                                {module.name}
                                {isAIStudio && <span className="ml-2 text-sm text-[#53328A] font-bold">(Always FREE)</span>}
                              </h4>
                            </div>
                            <p className="text-sm mb-2" style={{ color: '#4B5563' }}>
                              {module.description}
                            </p>
                            {modulePricing && (
                              <div className="text-sm">
                                {selectedTier === 'professional' && modulePricing.starter > 0 && (
                                  <span className="line-through text-gray-400 mr-2">
                                    ₹{modulePricing.starter.toLocaleString()}
                                  </span>
                                )}
                                <span className="font-semibold" style={{ color: '#111827' }}>
                                  ₹{price.toLocaleString()}/mo
                                </span>
                              </div>
                              )}
                            </div>
                          </div>
                      </CardContent>
                    </Card>
                        )
                      })}
                    </div>
                  </div>

            {/* Pricing Summary */}
            {pricing && selectedModules.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#111827' }}>Pricing Summary</h3>
                <div className="space-y-3">
                  {pricing.originalPrice && pricing.originalPrice !== pricing.price && (
                    <div className="flex justify-between">
                      <span style={{ color: '#4B5563' }}>Original Price:</span>
                      <span className="line-through text-gray-400">
                        ₹{pricing.originalPrice.toLocaleString()}/mo
                      </span>
                    </div>
                  )}
                  {pricing.savings && pricing.savings > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>You Save:</span>
                      <span className="font-semibold">
                        ₹{pricing.savings.toLocaleString()}/mo ({pricing.savingsPercentage}% off)
                            </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span style={{ color: '#111827' }}>After Trial:</span>
                    <span className="text-[#53328A]">
                      ₹{pricing.price.toLocaleString()}/mo
                            </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You can modify your module selection during your free trial
                  </p>
                        </div>
                      </div>
                    )}

            {/* CTA Button */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartTrial}
                className="bg-[#53328A] hover:bg-[#3F1F62] text-white px-12 py-6 text-lg font-semibold rounded-lg"
                style={{ backgroundColor: '#53328A', color: '#FFFFFF' }}
              >
                Start 1 Month Free Trial
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No credit card required • All modules included • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Entire Business, One Dashboard Section - With Tab Switching */}
      <section id="dashboard-showcase" className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Dashboard Images with Auto-Switch */}
          <div 
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              <Image
                src="/CRM-Dashboard.png"
                alt="CRM Dashboard"
                fill
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'crm' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'crm'}
              />
              <Image
                src="/Invoicing.png"
                alt="Invoicing Dashboard"
                fill
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'invoicing' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'invoicing'}
              />
              <Image
                src="/Inventory.png"
                alt="Inventory Dashboard"
                fill
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'inventory' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'inventory'}
              />
              <Image
                src="/Analytics.png"
                alt="Analytics Dashboard"
                fill
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'analytics' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'analytics'}
              />
                  </div>
                </div>

          {/* Right Column - Text and Tabs */}
          <div className="space-y-6 order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight" style={{ color: '#111827' }}>
              Entire Business, One Dashboard
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-500 leading-relaxed" style={{ color: '#4B5563' }}>
              Manage your entire business from a single, intuitive dashboard. Access customer management, invoicing, inventory, payments, HR, accounting, analytics, and AI-powered insights all in one place. No switching between tools. No learning curves.
            </p>
            
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className={`px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#53328A] to-[#6B42A3] text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#53328A] hover:text-[#53328A]'
                  }`}
                >
                  {tab.label}
                </button>
                          ))}
                            </div>
                    </div>
                  </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ color: '#111827' }}>Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400" style={{ color: '#4B5563' }}>
                <li>
                  <Link href="/features" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/app-store" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
                </div>

            {/* Solutions */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ color: '#111827' }}>Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400" style={{ color: '#4B5563' }}>
                <li>
                  <Link href="/industries/restaurant" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Restaurants
                  </Link>
                </li>
                <li>
                  <Link href="/industries/retail" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Retail
                  </Link>
                </li>
                <li>
                  <Link href="/industries/services" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/industries/ecommerce" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    E-Commerce
                  </Link>
                </li>
              </ul>
                        </div>
                        
            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ color: '#111827' }}>Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400" style={{ color: '#4B5563' }}>
                <li>
                  <Link href="/about" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
                            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ color: '#111827' }}>Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400" style={{ color: '#4B5563' }}>
                <li>
                  <Link href="/privacy-policy" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-[#53328A] dark:hover:text-[#F5C700] transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
                </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400" style={{ color: '#4B5563' }}>
              &copy; 2025 PayAid. Built for Indian Businesses. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
