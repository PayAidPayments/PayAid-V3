'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion, useInView } from './motion-lite'
import { getAllIndustries, getRecommendedModules } from '@/lib/industries/config'
import { MODULE_PRICING, getBestPricing } from '@/lib/pricing/config'
import { modules } from '@/lib/modules.config'
import { getModuleMarketingHref } from '@/lib/moduleMarketing'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
} from '@/components/ui/custom-select'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/brand/Logo'
const LottieHero = dynamic(() => import('@/components/landing/LottieHero'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />,
})
import { 
  ChevronDown, 
  Users, 
  IndianRupee, 
  ShoppingCart, 
  FileText, 
  BarChart3,
  Sparkles,
  Briefcase,
  MessageSquare,
  Globe,
  FileEdit,
  Folder,
  Presentation,
  Video,
  Zap,
  CheckCircle2,
  ArrowRight,
  X,
  UserCircle,
  Wrench,
  Factory,
  UtensilsCrossed,
  Store,
  Package
} from 'lucide-react'


// Count-up animation component
function StatCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  useEffect(() => {
    if (!isInView) return
    
    let startTime: number | null = null
    const duration = 2000
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isInView, value])
  
  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
      {count}{suffix}
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const onboardingHref = '/#industry-selector'
  const demoVideoUrl = process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL || ''
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [showModuleSelection, setShowModuleSelection] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional'>('starter')
  const [activeTab, setActiveTab] = useState<'crm' | 'invoicing' | 'inventory' | 'analytics'>('crm')
  const [isPaused, setIsPaused] = useState(false)
  const [showAllModules, setShowAllModules] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<string>('')
  const [isThinking, setIsThinking] = useState(false)
  const [typedResponse, setTypedResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const industries = getAllIndustries()


  // AI response data with corrected terminology
  const aiResponses = [
    {
      query: 'Show me unpaid invoices',
      response: 'You have <strong>3 unpaid invoices</strong> totaling <strong>₹45,000</strong>. The oldest invoice is 15 days overdue. I recommend sending payment reminders to these customers today. Would you like me to draft the reminder emails?',
      specialist: 'CFO',
      icon: IndianRupee
    },
    {
      query: 'What leads need follow-up?',
      response: 'You have <strong>5 hot leads</strong> that need immediate attention. 3 are from last week and 2 are from this week. The highest priority is "ABC Tech Pvt Ltd" - they showed strong interest in your enterprise package. I suggest reaching out today with a personalized proposal.',
      specialist: 'Sales Specialist',
      icon: Users
    },
    {
      query: 'Create a LinkedIn post',
      response: 'Here\'s a LinkedIn post for your business:<br/><br/><strong>🚀 Thrilled to announce that ABC Tech Pvt Ltd has successfully delivered 500+ projects this year!</strong><br/><br/>From innovative software solutions to exceptional client service, we\'re helping businesses across India transform their digital operations. Grateful to our amazing team and trusted partners for making this possible.<br/><br/>#TechInnovation #DigitalTransformation #ABCTech #IndianTech',
      specialist: 'Marketing Specialist',
      icon: MessageSquare
    },
    {
      query: 'What should I focus on this week?',
      response: 'Based on your business data, here are your top priorities this week:<br/><br/>1. <strong>Follow up with 5 hot leads</strong> - High conversion potential<br/>2. <strong>Send payment reminders</strong> for 3 overdue invoices (₹45,000)<br/>3. <strong>Review Q4 marketing campaign</strong> performance<br/>4. <strong>Schedule team meeting</strong> to discuss new product launch<br/><br/>I\'ve added these to your task list.',
      specialist: 'Co-Founder',
      icon: Sparkles
    },
    {
      query: 'How is my cash flow this month?',
      response: 'Your cash flow this month shows:<br/><br/>✅ <strong>Inflow:</strong> ₹2,45,000 (from invoices paid)<br/>❌ <strong>Outflow:</strong> ₹1,85,000 (expenses & payroll)<br/>💰 <strong>Net Positive:</strong> ₹60,000<br/><br/>You\'re in a healthy position! However, I notice 3 pending invoices worth ₹45,000 that could improve your cash position if collected soon.',
      specialist: 'CFO',
      icon: IndianRupee
    },
    {
      query: 'Generate a sales report',
      response: 'Here\'s your sales report for this month:<br/><br/>📊 <strong>Total Sales:</strong> ₹3,20,000<br/>📈 <strong>Growth:</strong> +15% vs last month<br/>🎯 <strong>Top Product:</strong> Enterprise Package (₹1,50,000)<br/>👥 <strong>New Customers:</strong> 12<br/>🔄 <strong>Conversion Rate:</strong> 24%<br/><br/>Your sales team is performing exceptionally well!',
      specialist: 'Sales Specialist',
      icon: Users
    },
    {
      query: 'What are my top expenses?',
      response: 'Your top expenses this month:<br/><br/>1. <strong>Payroll:</strong> ₹1,20,000 (40% of total)<br/>2. <strong>Marketing:</strong> ₹45,000 (15% of total)<br/>3. <strong>Office Rent:</strong> ₹35,000 (12% of total)<br/>4. <strong>Software Subscriptions:</strong> ₹25,000 (8% of total)<br/><br/>Your expense ratio is healthy at 65% of revenue. Consider optimizing marketing spend for better ROI.',
      specialist: 'CFO',
      icon: IndianRupee
    },
    {
      query: 'Write a follow-up email to a client',
      response: 'Here\'s a professional follow-up email:<br/><br/><strong>Subject:</strong> Following Up: [Project Name] - Next Steps & Timeline<br/><br/>Dear [Client Name],<br/><br/>I hope this message finds you well. I wanted to follow up on our recent conversation regarding [specific topic/project] and share some valuable insights that might be relevant to your business objectives.<br/><br/>Based on our discussion, I\'ve prepared a brief proposal outlining the key deliverables, timeline, and expected outcomes. I believe this aligns perfectly with your goals of [specific goal mentioned].<br/><br/>I\'d appreciate the opportunity to schedule a brief call this week to discuss this further and answer any questions you might have. Would [specific date/time] work for you? Alternatively, please let me know your preferred time, and I\'ll accommodate accordingly.<br/><br/>Thank you for your time and consideration. I look forward to the possibility of working together.<br/><br/>Warm regards,<br/>[Your Name]<br/>[Your Title]<br/>[Company Name]<br/>[Contact Information]',
      specialist: 'Communication Specialist',
      icon: MessageSquare
    },
    {
      query: 'What tasks are overdue?',
      response: 'You have <strong>4 overdue tasks</strong>:<br/><br/>1. Review Q4 marketing campaign (2 days overdue)<br/>2. Send proposal to ABC Tech Pvt Ltd (1 day overdue)<br/>3. Update website pricing page (3 days overdue)<br/>4. Schedule team meeting (1 day overdue)<br/><br/>I recommend prioritizing the ABC Tech proposal as it\'s a high-value opportunity.',
      specialist: 'Co-Founder',
      icon: Sparkles
    },
    {
      query: 'Show me employee attendance summary',
      response: 'Here\'s your team\'s attendance for this month:<br/><br/>✅ <strong>Average Attendance:</strong> 95%<br/>👥 <strong>Total Employees:</strong> 25<br/>📅 <strong>Working Days:</strong> 22<br/>🏖️ <strong>Leaves Taken:</strong> 12 (all approved)<br/>⏰ <strong>Average Check-in:</strong> 9:15 AM<br/><br/>Your team attendance is excellent! No concerns to report.',
      specialist: 'HR Specialist',
      icon: UserCircle
    }
  ]

  // Typing animation effect - only when user clicks
  useEffect(() => {
    // Don't run animation on initial load, only when user interacts
    if (!hasUserInteracted || !selectedQuery) {
      return
    }

    const selectedItem = aiResponses.find(item => item.query === selectedQuery)
    if (!selectedItem) return

    // Reset states
    setTypedResponse('')
    setIsThinking(true)
    setIsTyping(false)

    // Auto-scroll to response area when query changes (only on user click)
    const scrollTimeout = setTimeout(() => {
      const responseElement = document.getElementById('ai-response-area')
      if (responseElement) {
        responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100) // Small delay to ensure DOM is ready

    // Show thinking state for 1.5 seconds
    const thinkingTimeout = setTimeout(() => {
      setIsThinking(false)
      setIsTyping(true)

      // Parse HTML and type word by word while preserving HTML structure
      const html = selectedItem.response
      const words: string[] = []
      let currentWord = ''
      let inTag = false
      let tagContent = ''

      // Split HTML into words and tags
      for (let i = 0; i < html.length; i++) {
        const char = html[i]
        if (char === '<') {
          if (currentWord.trim()) {
            words.push(currentWord)
            currentWord = ''
          }
          inTag = true
          tagContent = '<'
        } else if (char === '>') {
          tagContent += '>'
          words.push(tagContent)
          tagContent = ''
          inTag = false
        } else if (inTag) {
          tagContent += char
        } else {
          if (char === ' ' || char === '\n') {
            if (currentWord.trim()) {
              words.push(currentWord + char)
              currentWord = ''
            } else if (char === ' ') {
              words.push(' ')
            }
          } else {
            currentWord += char
          }
        }
      }
      if (currentWord.trim()) {
        words.push(currentWord)
      }

      // Type word by word
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex < words.length) {
          const typedPortion = words.slice(0, currentIndex + 1).join('')
          setTypedResponse(typedPortion)
          currentIndex++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)
          setTypedResponse(selectedItem.response)
        }
      }, 80) // 80ms per word for smooth typing

      return () => {
        clearInterval(typingInterval)
      }
    }, 1500)

    return () => {
      clearTimeout(thinkingTimeout)
      clearTimeout(scrollTimeout)
    }
  }, [selectedQuery, hasUserInteracted])
  
  // Get all modules excluding industries
  const allModules = modules.filter(m => m.category !== 'industry' && m.status === 'active')
  
  // Most important modules for Indian businesses (18 modules)
  const importantModuleIds = [
    'crm',                    // CRM - Customer management
    'finance',                // Finance & Accounting - GST critical
    'sales',                  // Sales - Sales tracking
    'marketing',              // Marketing - WhatsApp marketing
    'hr',                     // HR & Payroll - Employee management
    'inventory',              // Inventory - Stock management
    'analytics',              // Analytics - Business insights
    'communication',          // Communication - WhatsApp integration
    'ai-cofounder',           // AI Co-founder - AI assistance
    'projects',               // Projects - Project management
    'appointments',           // Appointments - Booking system
    'workflow',               // Workflow Automation - Process automation
    'contracts',              // Contracts - Legal compliance
    'website-builder',        // Website Builder - Online presence
    'pdf',                    // PDF Tools - Document management
    'spreadsheet',            // Spreadsheet - Data management
    'docs',                   // Docs - Document creation
    'drive',                  // Drive - Cloud storage
  ]
  
  // Get important modules in order
  const importantModules = importantModuleIds
    .map(id => allModules.find(m => m.id === id))
    .filter(Boolean) as typeof allModules
  
  // Remaining modules (excluding the important ones)
  const remainingModules = allModules.filter(m => !importantModuleIds.includes(m.id))
  
  // Icon mapping for modules
  const moduleIconMap: Record<string, any> = {
    'Users': Users,
    'ShoppingCart': ShoppingCart,
    'Megaphone': MessageSquare,
    'IndianRupee': IndianRupee,
    'Briefcase': Briefcase,
    'MessageSquare': MessageSquare,
    'Sparkles': Sparkles,
    'BarChart3': BarChart3,
    'Globe': Globe,
    'FileEdit': FileEdit,
    'FileText': FileText,
    'GitBranch': Zap,
    'Package': Package,
    'UserCircle': UserCircle,
    'Lightbulb': Sparkles,
    'Palette': FileEdit,
    'BookOpen': FileText,
    'Phone': MessageSquare,
    'Newspaper': FileText,
    'Calendar': FileText,
    'Table': FileText,
    'Folder': Folder,
    'Presentation': Presentation,
    'Video': Video,
    'Wrench': Wrench,
  }

  // All available modules for selection - use modules from config, excluding industries
  const allAvailableModules = allModules.map(module => {
    // Map icon names to icon components
    const IconComponent = moduleIconMap[module.icon] || FileText
    return {
      id: module.id,
      name: module.name,
      description: module.description,
      icon: IconComponent,
    }
  })

  // Deprecated modules to exclude
  const deprecatedModules = ['invoicing', 'accounting']

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
  }, [selectedIndustry])

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
    router.push(`/signup?industry=${selectedIndustry}&modules=${modulesParam}&tier=${selectedTier}&billing=annual`)
  }

  // Helper function to handle navigation - use window.location for reliability
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Force navigation using window.location
    window.location.href = path
  }

  // Helper function to handle anchor scroll
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchorId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const element = document.getElementById(anchorId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Auto-scroll through tabs
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setActiveTab((prev) => {
          const tabs: typeof activeTab[] = ['crm', 'invoicing', 'inventory', 'analytics']
          const currentIndex = tabs.indexOf(prev)
          const nextIndex = (currentIndex + 1) % tabs.length
          return tabs[nextIndex]
        })
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Mega Menu */}
      <header className="fixed top-0 w-full z-50 bg-white/98 backdrop-blur-lg border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">
            <Logo href="/" />
            <div className="hidden md:flex items-center gap-8">
              {/* Products Dropdown */}
              <div className="relative group z-40">
                <button 
                  type="button"
                  className="flex items-center gap-1 text-gray-900 hover:text-[#53328A] font-medium transition-colors"
                  onMouseEnter={() => {}}
                >
                  Products <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-200 p-6 z-50 pointer-events-auto">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Core Modules</h4>
                      <ul className="space-y-2">
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>CRM Management</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Invoicing & Billing</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Inventory Tracking</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Payment Processing</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>HR & Payroll</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Accounting & GST</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Advanced Features</h4>
                      <ul className="space-y-2">
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Analytics & Reports</Link></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>AI Co-founder</Link></li>
                        <li><a href="/app-store" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Third-party Integrations</a></li>
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Mobile Applications</Link></li>
                        <li><a href="/app-store" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>API Access</a></li>
                        <li><a href="/security" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Enterprise Security</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solutions Dropdown */}
              <div className="relative group z-40" onMouseLeave={(e) => {
                // Small delay to allow clicks to register before closing
                const target = e.currentTarget
                setTimeout(() => {
                  if (target) {
                    const dropdown = target.querySelector('.dropdown-menu')
                  if (dropdown && !dropdown.matches(':hover')) {
                    // Dropdown will close naturally via CSS
                    }
                  }
                }, 100)
              }}>
                <button 
                  type="button"
                  className="flex items-center gap-1 text-gray-900 hover:text-[#53328A] font-medium transition-colors"
                >
                  Solutions <ChevronDown className="h-4 w-4" />
                </button>
                <div className="dropdown-menu absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-200 p-6 z-50 pointer-events-auto" onMouseEnter={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">By Industry</h4>
                      <ul className="space-y-2">
                        <li><a href="/industries/restaurant" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Restaurants & Cafes</a></li>
                        <li><a href="/industries/retail" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Retail Stores</a></li>
                        <li><a href="/industries/services" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Service Businesses</a></li>
                        <li><a href="/industries/manufacturing" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>Manufacturing</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Use Cases</h4>
                      <ul className="space-y-2">
                        <li><Link href="#features" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => handleAnchorClick(e, 'features')}>Multi-Location Management</Link></li>
                        <li><a href="/app-store" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>E-Commerce Integration</a></li>
                        <li><a href="/compliance" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block" onClick={(e) => { e.stopPropagation(); }}>GST Compliance</a></li>
                        <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors block">Business Scaling</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Link 
                href="/pricing" 
                className="text-gray-900 hover:text-[#53328A] font-medium transition-colors cursor-pointer"
              >
                Pricing
              </Link>
              <a 
                href="/about" 
                className="text-gray-900 hover:text-[#53328A] font-medium transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  // Let the anchor tag navigate naturally
                }}
              >
                Company
              </a>
            </div>
            <div className="flex items-center gap-4 relative z-50">
              <Link 
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer relative z-50"
              >
                Sign In
              </Link>
              <Link 
                href={onboardingHref}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white transition-colors cursor-pointer relative z-50"
              >
                Choose Industry & Start
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mt-11 min-h-[calc(100vh-2.75rem)] flex items-center justify-center bg-gradient-to-b from-white to-purple-50 px-4 py-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:items-stretch">
            {/* Left Column - Text and CTA */}
            <div className="text-center lg:text-left lg:flex lg:flex-col lg:justify-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                The All-in-One{' '}
                <span className="bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent">
                  Business OS
                </span>{' '}
                Built for India
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Everything your business needs in one powerful platform. Manage CRM, Invoicing, Inventory, HR, Payments, Accounting, and more. 
                Built specifically for Indian SMBs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 relative z-10">
                <Link 
                  href={onboardingHref}
                  className="inline-flex items-center justify-center rounded-md text-lg font-medium h-11 px-8 py-6 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white transition-colors cursor-pointer relative z-10"
                >
                  Choose Industry & Start
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-lg font-medium h-11 px-8 py-6 border-2 border-[#53328A] text-[#53328A] hover:bg-purple-50 transition-colors cursor-pointer relative z-10"
                  onClick={() => {
                    document.getElementById('try-it-now')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  Try Demo →
                </button>
              </div>
            </div>

            {/* Right Column - Hero Visual (stretch so Spline can fill full row height) */}
            <div className="min-h-0 w-full lg:min-h-[min(85vh,880px)]">
              <LottieHero />
            </div>
          </div>

          {/* Try It Now - Right after Hero */}
          <div id="try-it-now" className="mt-16 bg-white rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Try It Now</h3>
                <p className="text-sm text-gray-600 mb-4">Click any question to see how AI specialists respond:</p>
                <div className="space-y-2 mb-6 max-h-[500px] overflow-y-auto">
                  {aiResponses.map((item, idx) => {
                    const isSelected = selectedQuery === item.query
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setHasUserInteracted(true)
                          // Prevent "flash" of the full response: move into thinking state immediately
                          // before the effect-driven typing animation starts.
                          setTypedResponse('')
                          setIsThinking(true)
                          setIsTyping(false)
                          setSelectedQuery(item.query)
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#53328A] to-[#6B42A3] text-white shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#53328A]'}`}></div>
                        <span className="text-sm font-medium flex-1">{item.query}</span>
                        {isSelected && <Sparkles className="h-4 w-4" />}
                      </div>
                    )
                  })}
                </div>
                <Link href={onboardingHref}>
                  <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white w-full md:w-auto">
                    Choose Industry & Start
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div id="ai-response-area" className="bg-gradient-to-br from-purple-100 to-yellow-100 rounded-xl p-6 border border-purple-200 min-h-[300px]">
                {(() => {
                  if (!selectedQuery) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">Click any question to see AI response</p>
                        </div>
                      </div>
                    )
                  }

                  const selectedItem = aiResponses.find(item => item.query === selectedQuery)
                  if (!selectedItem) return null

                  const IconComponent = selectedItem.icon

                  return (
                    <motion.div
                      key={selectedQuery}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#53328A] flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        {isThinking ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-sm">AI Specialist is thinking</span>
                            <div className="flex gap-1">
                              <motion.span
                                className="w-2 h-2 bg-[#53328A] rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                              />
                              <motion.span
                                className="w-2 h-2 bg-[#53328A] rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.span
                                className="w-2 h-2 bg-[#53328A] rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              className="text-gray-800 leading-relaxed"
                              // Never fall back to the full response while the typing animation is in progress
                              // (prevents a brief flash of the full HTML before we reset typedResponse).
                              dangerouslySetInnerHTML={{
                                __html:
                                  isTyping || hasUserInteracted ? typedResponse : selectedItem.response,
                              }}
                            />
                            {isTyping && (
                              <span className="inline-block w-2 h-4 bg-[#53328A] ml-1 animate-pulse"></span>
                            )}
                          </>
                        )}
                        {!isThinking && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#53328A]">{selectedItem.specialist}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">Just now</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Visual Module Grid */}
          <div className="mt-16">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {allModules.length} Modules, One Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose what you need, scale as you grow. Mix and match modules or choose an industry package.
              </p>
            </div>

            {/* Module Grid - Show 18 important modules for Indian businesses */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
              {importantModules.map((module) => {
                const IconComponent = moduleIconMap[module.icon] || FileText
                const colorClasses: Record<string, string> = {
                  core: 'bg-blue-100 text-blue-700',
                  productivity: 'bg-yellow-100 text-yellow-700',
                  ai: 'bg-purple-100 text-purple-700',
                }
                const colorClass = colorClasses[module.category] || 'bg-gray-100 text-gray-700'
                const modulePageHref = getModuleMarketingHref(module.id)
                const cardClass =
                  'group bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-[#53328A] hover:shadow-lg transition-all cursor-pointer text-center block no-underline'
                return (
                  <Link
                    key={module.id}
                    href={modulePageHref}
                    prefetch={false}
                    className={cardClass}
                  >
                    <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{module.name}</div>
                  </Link>
                )
              })}
            </div>

            {/* Expandable Section for Remaining Modules */}
            {showAllModules && remainingModules.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { opacity: 1, height: 'auto' },
                  hidden: { opacity: 0, height: 0 }
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-12"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {remainingModules.map((module) => {
                    const IconComponent = moduleIconMap[module.icon] || FileText
                    const colorClasses: Record<string, string> = {
                      core: 'bg-blue-100 text-blue-700',
                      productivity: 'bg-yellow-100 text-yellow-700',
                      ai: 'bg-purple-100 text-purple-700',
                    }
                    const colorClass = colorClasses[module.category] || 'bg-gray-100 text-gray-700'
                    const modulePageHref = getModuleMarketingHref(module.id)
                    const cardClass =
                      'group bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-[#53328A] hover:shadow-lg transition-all cursor-pointer text-center block no-underline'
                    return (
                      <Link
                        key={module.id}
                        href={modulePageHref}
                        prefetch={false}
                        className={cardClass}
                      >
                        <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{module.name}</div>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}

            <div className="text-center">
              {remainingModules.length > 0 && (
                <p className="text-gray-600 mb-6">
                  {showAllModules
                    ? `Showing all ${allModules.length} modules`
                    : `And ${remainingModules.length} more modules`}
                </p>
              )}
              {remainingModules.length > 0 && (
                <Button
                  onClick={() => setShowAllModules(!showAllModules)}
                  className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white"
                >
                  {showAllModules ? 'Show Less' : 'Explore All Modules'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAllModules ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Industry Selection - Right after Hero */}
          <div id="industry-selector" className="max-w-2xl mx-auto mt-16 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4 text-gray-900">
              What industry is your business in?
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Select your industry to get started with tailored features
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industry-select" className="text-base font-medium text-gray-700">
                  Select Your Industry
                </Label>
                <div className="relative w-full max-w-2xl mx-auto">
                  <CustomSelect
                    value={selectedIndustry}
                    onValueChange={handleIndustrySelect}
                    placeholder="Choose your industry..."
                    id="industry-select"
                    className="w-full"
                  >
                    <CustomSelectTrigger className="w-full h-12 text-base" />
                    <CustomSelectContent>
                      {industries.map((industry) => (
                        <CustomSelectItem key={industry.id} value={industry.id}>
                          {industry.icon} {industry.name}
                        </CustomSelectItem>
                      ))}
                      <CustomSelectItem value="others">➕ Others (Not Listed)</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band — sits immediately below the hero */}
      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
            transition={{ staggerChildren: 0.2 }}
          >
            <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
              <StatCounter value={10} suffix="x" />
              <div className="text-sm md:text-base text-gray-600 font-medium mt-2">Faster Execution</div>
            </motion.div>
            <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
              <StatCounter value={50} suffix="%" />
              <div className="text-sm md:text-base text-gray-600 font-medium mt-2">Cost Savings</div>
            </motion.div>
            <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
              <StatCounter value={100} suffix="%" />
              <div className="text-sm md:text-base text-gray-600 font-medium mt-2">Business Visibility</div>
            </motion.div>
            <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
              <StatCounter value={0} />
              <div className="text-sm md:text-base text-gray-600 font-medium mt-2">Tools to Switch</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Module Selection Section */}
      {showModuleSelection && selectedIndustry && (
        <section id="module-selection" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
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
              <Label className="text-base font-semibold mb-4 block text-gray-900">
                Choose Your Plan
              </Label>
              <div className="mb-4">
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Select Plan Type:
                </Label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedTier('starter')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedTier === 'starter'
                        ? 'border-[#53328A] bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-1 text-gray-900">Starter</div>
                    <div className="text-sm text-gray-600">Up to 5 users per module</div>
                    <div className="text-xs text-gray-500 mt-1">₹1,999/month per module</div>
                  </button>
                  <button
                    onClick={() => setSelectedTier('professional')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedTier === 'professional'
                        ? 'border-[#53328A] bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-1 text-gray-900">
                      Professional <span className="text-sm text-[#F5C700]">⭐</span>
                    </div>
                    <div className="text-sm text-gray-600">Unlimited users</div>
                    <div className="text-xs text-gray-500 mt-1">₹3,999/month per module</div>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Note:</strong> All plans are billed annually with 20% discount. Prices shown are monthly equivalent.
                </p>
              </div>
            </div>

            {/* Recommended Modules */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Recommended Modules for Your Industry
              </h3>
              <p className="text-gray-600 mb-2">
                Based on your industry selection, we recommend these modules. You can customize your selection.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                <strong>Starter Plan:</strong> ₹1,999/month per module (billed annually with 20% discount) - <strong>Up to 5 users per module</strong><br/>
                <strong>Professional Plan:</strong> ₹3,999/month per module (billed annually with 20% discount) - Unlimited users and advanced features
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAvailableModules
                  .filter(module => !deprecatedModules.includes(module.id))
                  .map((module) => {
                    const isSelected = selectedModules.includes(module.id)
                    const isAIStudio = module.id === 'ai-studio'
                    const modulePricing = MODULE_PRICING[module.id]
                    // Annual pricing: monthly price × 12 × 0.8 (20% discount)
                    const monthlyPrice = modulePricing 
                      ? selectedTier === 'starter' 
                        ? modulePricing.starter 
                        : modulePricing.professional
                      : 0
                    const annualPrice = modulePricing && monthlyPrice > 0
                      ? Math.round(monthlyPrice * 12 * 0.8) // 20% discount on annual
                      : 0
                    const IconComponent = module.icon // This is now a React component
                        
                    return (
                      <Card
                        key={module.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          isSelected 
                            ? 'border-2 border-[#53328A] bg-purple-50' 
                            : 'border border-gray-200'
                        } ${isAIStudio ? 'bg-gradient-to-br from-purple-50 to-yellow-50' : ''}`}
                        onClick={() => !isAIStudio && handleModuleToggle(module.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isAIStudio}
                                onCheckedChange={(checked) => {
                                  if (isAIStudio) return
                                  const shouldSelect = Boolean(checked)
                                  if (shouldSelect !== isSelected) {
                                    handleModuleToggle(module.id)
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                  {IconComponent && <IconComponent className="h-5 w-5 text-[#53328A]" />}
                                </div>
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {module.name}
                                  {isAIStudio && <span className="ml-2 text-sm text-[#53328A] font-bold">(Always FREE)</span>}
                                </h4>
                              </div>
                              <p className="text-sm mb-2 text-gray-600">
                                {module.description}
                              </p>
                              {modulePricing && (
                                <div className="text-sm">
                                  {monthlyPrice === 0 ? (
                                    <span className="text-[#53328A] font-bold">FREE</span>
                                  ) : (
                                    <div className="flex flex-col">
                                      <div className="font-semibold text-gray-900">
                                        ₹{monthlyPrice.toLocaleString()}/month
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Annual: ₹{annualPrice.toLocaleString()}/year
                                      </div>
                                      <div className="text-xs text-gray-400 line-through mt-0.5">
                                        ₹{Math.round(monthlyPrice * 12).toLocaleString()}/year
                                      </div>
                                      {selectedTier === 'starter' && (
                                        <div className="text-xs text-[#53328A] font-semibold mt-1">
                                          ⚠️ Up to 5 users per module
                                        </div>
                                      )}
                                    </div>
                                  )}
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
            {selectedModules.length > 0 && (() => {
              const activeModules = selectedModules.filter(
                moduleId => !deprecatedModules.includes(moduleId)
              )
              const pricing = activeModules.length > 0 
                ? getBestPricing(selectedIndustry, activeModules, selectedTier === 'starter' ? 'starter' : 'professional')
                : null

              return pricing ? (
                <div className="bg-white rounded-xl p-6 border-2 border-purple-200 mb-8">
                  <h4 className="text-xl font-bold mb-4 text-gray-900">Pricing Summary ({selectedTier === 'starter' ? 'Starter' : 'Professional'} Plan)</h4>
                  <div className="space-y-2">
                    {pricing.originalPrice && pricing.originalPrice !== pricing.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Individual Pricing (Annual):</span>
                        <span className="line-through text-gray-400">
                          ₹{Math.round(pricing.originalPrice * 12).toLocaleString()}/year
                        </span>
                      </div>
                    )}
                    {pricing.savings && pricing.savings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Package Savings:</span>
                        <span className="text-green-600 font-semibold">
                          ₹{Math.round(pricing.savings * 12).toLocaleString()}/year ({pricing.savingsPercentage}%)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Monthly Equivalent:</span>
                      <span className="text-xl font-bold text-gray-900">
                        ₹{pricing.price.toLocaleString()}/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Annual Total:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent">
                        ₹{Math.round(pricing.price * 12 * 0.8).toLocaleString()}/year
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 line-through mt-1">
                      ₹{Math.round(pricing.price * 12).toLocaleString()}/year (without discount)
                    </div>
                    {selectedTier === 'starter' && (
                      <p className="text-sm text-[#53328A] font-semibold mt-2">
                        ⚠️ Starter Plan: Up to 5 users per module
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      * After 1-month free trial • Billed annually with 20% discount
                    </p>
                  </div>
                </div>
              ) : null
            })()}

            {/* CTA */}
            <div className="text-center">
              <Button
                onClick={handleStartTrial}
                className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white px-8 py-6 text-lg font-bold"
                size="lg"
              >
                Start 1 Month Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                You can modify your module selection anytime during the trial
              </p>
            </div>
          </div>
        </section>
      )}

      {/* AI Co-founder Showcase */}
      <section className="py-20 bg-gradient-to-b from-purple-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#53328A] to-[#F5C700] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Free Forever</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet Your AI Co-founder
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
              9 Specialist AI Agents Ready to Help Your Business Grow
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Get strategic insights, automate tasks, and make data-driven decisions with your personal AI business advisor
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {[
              { name: 'Co-Founder', icon: Sparkles, color: 'from-purple-500 to-purple-600', desc: 'Strategic planning' },
              { name: 'CFO', icon: IndianRupee, color: 'from-green-500 to-green-600', desc: 'Finance & accounting' },
              { name: 'Sales', icon: Users, color: 'from-blue-500 to-blue-600', desc: 'Leads & pipeline' },
              { name: 'Marketing', icon: MessageSquare, color: 'from-pink-500 to-pink-600', desc: 'Campaigns & social' },
              { name: 'HR', icon: UserCircle, color: 'from-orange-500 to-orange-600', desc: 'Employees & payroll' },
            ].map((agent, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#53328A] transition-all hover:shadow-xl cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <agent.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-600 text-center">{agent.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { name: 'Website', icon: Globe, color: 'from-indigo-500 to-indigo-600', desc: 'Websites & SEO' },
              { name: 'Restaurant', icon: UtensilsCrossed, color: 'from-red-500 to-red-600', desc: 'Restaurant ops' },
              { name: 'Retail', icon: Store, color: 'from-teal-500 to-teal-600', desc: 'Retail management' },
              { name: 'Manufacturing', icon: Factory, color: 'from-gray-500 to-gray-600', desc: 'Production' },
            ].map((agent, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#53328A] transition-all hover:shadow-xl cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <agent.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-600 text-center">{agent.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Co-founder in Action</h3>
            <p className="text-gray-600">
              Ask finance, sales, marketing, and HR questions with context from your own business data.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <section id="dashboard-showcase" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                All Your Business, One Platform
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Manage your entire business with powerful, module-specific dashboards. Switch seamlessly between CRM, invoicing, inventory, payments, HR, accounting, analytics, and AI-powered insights. All modules work together seamlessly. No switching between tools. No learning curves.
              </p>
              <div className="flex flex-wrap gap-3">
                {(['crm', 'invoicing', 'inventory', 'analytics'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab)
                      setIsPaused(true)
                      setTimeout(() => setIsPaused(false), 5000)
                    }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-[#53328A] to-[#6B42A3] text-white shadow-lg'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#53328A] hover:text-[#53328A]'
                    }`}
                  >
                    {tab === 'crm' ? 'CRM' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/CRM-Dashboard.png"
                alt="CRM Dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'crm' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'crm'}
              />
              <Image
                src="/Invoicing.png"
                alt="Invoicing Dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'invoicing' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'invoicing'}
              />
              <Image
                src="/Inventory.png"
                alt="Inventory Dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'inventory' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'inventory'}
              />
              <Image
                src="/Analytics.png"
                alt="Analytics Dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-contain transition-opacity duration-500 ${
                  activeTab === 'analytics' ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                priority={activeTab === 'analytics'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PayAid Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose PayAid?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade features built for Indian business growth
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Transparent Pricing', desc: 'Pay only for what you need. Starting at ₹1,999/month per module (Starter) or ₹3,999/month per module (Professional). No hidden costs. Choose modules individually or save with industry packages.' },
              { title: 'India-First Design', desc: 'Built with GST compliance, FSSAI support, and ONDC integration. Hindi language support available for all users.' },
              { title: 'AI-Powered Intelligence', desc: 'Get automated business insights and smart recommendations. Your personal AI advisor included at no extra cost.' },
              { title: 'Lightning Fast Implementation', desc: 'Start using PayAid in minutes, not months. Simple onboarding, intuitive interface, and immediate productivity gains.' },
              { title: 'Enterprise-Grade Security', desc: 'Your data is encrypted, backed up, and protected. Bank-grade security with enterprise-level compliance standards.' },
              { title: 'Responsive Support', desc: 'Dedicated support team available Monday-Saturday, 09:30 AM - 06:30 PM IST. Quick response times and personalized assistance when you need it.' },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-[#53328A] mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Indian Businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Serving restaurants, retail, services, and more across India
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Restaurants', desc: 'Manage online and offline orders, payment processing, inventory tracking, and staff scheduling from one dashboard.' },
              { title: 'Retail Stores', desc: 'Multi-location inventory management, customer loyalty programs, point of sale systems, and centralized analytics.' },
              { title: 'Service Businesses', desc: 'Project management, client invoicing, team scheduling, expense tracking, and profitability analysis in real-time.' },
              { title: 'E-Commerce Platforms', desc: 'Multi-channel selling, inventory synchronization, order management, fulfillment tracking, and customer insights.' },
              { title: 'Manufacturing', desc: 'Production tracking, supplier management, quality control, logistics optimization, and compliance reporting.' },
              { title: 'Professional Services', desc: 'Client project management, team collaboration, resource planning, time tracking, and invoice automation.' },
            ].map((useCase, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-4">{useCase.desc}</p>
                <Link href={onboardingHref} className="text-[#53328A] font-semibold hover:underline">
                  Choose Industry & Start →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Badges */}
      <section className="py-20 bg-gray-50">
        <motion.div 
          className="max-w-7xl mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 20 }
          }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Trusted & Secure</h3>
            <p className="text-lg text-gray-600">Bank-grade security and compliance standards</p>
          </div>
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center"
            variants={{
              visible: { opacity: 1 },
              hidden: { opacity: 0 }
            }}
            transition={{ staggerChildren: 0.1 }}
          >
            {[
              { icon: '🔒', label: 'SSL Encrypted', desc: '256-bit encryption' },
              { icon: '💳', label: 'PCI DSS Level 1', desc: 'Payment security certified' },
              { icon: '✅', label: 'GST Ready', desc: 'GST compliance' },
              { icon: '🔐', label: 'Bank-Grade Security', desc: 'Enterprise security' },
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all"
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 20 }
                }}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{badge.label}</div>
                <div className="text-sm text-gray-600">{badge.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Indian Entrepreneurs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from businesses transforming with PayAid
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: '"PayAid has been transformative for our restaurant chain. We now manage orders, payments, and staff across all locations from a single dashboard. Saved us ₹18,000 per month."', author: 'Rajesh Kumar', role: 'Restaurant Owner, Mumbai' },
              { text: '"As a retail store owner, I needed an affordable yet powerful solution. PayAid delivered exactly that. The support team is incredibly responsive and helpful with implementations."', author: 'Priya Singh', role: 'Retail Store Manager, Delhi' },
              { text: '"The AI co-founder feature is remarkable. It provides business insights we didn\'t even know we needed. PayAid feels like having a business consultant on our team every day."', author: 'Amit Patel', role: 'Service Business Owner, Bangalore' },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-[#F5C700] text-xl mb-4">★★★★★</div>
                <p className="text-gray-600 italic mb-4">{testimonial.text}</p>
                <p className="font-bold text-gray-900">{testimonial.author}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-[#53328A] to-[#2D1B47] text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of Indian businesses already growing with PayAid. Start your free trial today. No credit card required.
          </p>
          <Link href={onboardingHref}>
            <Button size="lg" className="bg-[#F5C700] text-gray-900 hover:bg-[#E0B200] px-12 py-6 text-lg font-bold">
              Choose Industry & Start
            </Button>
          </Link>
        </div>
      </section>

      {isDemoModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 p-4 flex items-center justify-center"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">PayAid Explainer Demo</h3>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="inline-flex items-center justify-center rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close demo video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {demoVideoUrl ? (
                <iframe
                  title="PayAid explainer video"
                  src={demoVideoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-center px-6">
                  <p className="text-sm md:text-base">
                    Add `NEXT_PUBLIC_EXPLAINER_VIDEO_URL` to show your explainer video in this popup.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-[#F5C700] transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[#F5C700] transition-colors">Pricing</Link></li>
                <li><Link href="/app-store" className="hover:text-[#F5C700] transition-colors">Integrations</Link></li>
                <li><Link href="/security" className="hover:text-[#F5C700] transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/industries/restaurant" className="hover:text-[#F5C700] transition-colors">Restaurants</Link></li>
                <li><Link href="/industries/retail" className="hover:text-[#F5C700] transition-colors">Retail</Link></li>
                <li><Link href="/industries/services" className="hover:text-[#F5C700] transition-colors">Services</Link></li>
                <li><Link href="/industries/ecommerce" className="hover:text-[#F5C700] transition-colors">E-Commerce</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-[#F5C700] transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-[#F5C700] transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-[#F5C700] transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-[#F5C700] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-[#F5C700] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-[#F5C700] transition-colors">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-[#F5C700] transition-colors">Compliance</Link></li>
                <li><Link href="/security" className="hover:text-[#F5C700] transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 PayAid. Built for Indian Businesses. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
