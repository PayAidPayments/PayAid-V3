'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllIndustries } from '@/lib/industries/config'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { ChevronDown } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'crm' | 'invoicing' | 'inventory' | 'analytics'>('crm')
  const [isPaused, setIsPaused] = useState(false)
  const industries = getAllIndustries()

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId)
    if (industryId) {
      router.push(`/signup?industry=${industryId}`)
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
          <div className="flex items-center justify-between h-16">
            <Logo href="/" />
            <div className="hidden md:flex items-center gap-8">
              {/* Products Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-900 hover:text-[#53328A] font-medium transition-colors">
                  Products <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Core Modules</h4>
                      <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">CRM Management</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Invoicing & Billing</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Inventory Tracking</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Payment Processing</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">HR & Payroll</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Accounting & GST</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Advanced Features</h4>
                      <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Analytics & Reports</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">AI Co-founder</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Third-party Integrations</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Mobile Applications</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">API Access</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Enterprise Security</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solutions Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-900 hover:text-[#53328A] font-medium transition-colors">
                  Solutions <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">By Industry</h4>
                      <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Restaurants & Cafes</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Retail Stores</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Service Businesses</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Manufacturing</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#53328A] uppercase tracking-wide mb-3">Use Cases</h4>
                      <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Multi-Location Management</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">E-Commerce Integration</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">GST Compliance</Link></li>
                        <li><Link href="#" className="text-sm text-gray-600 hover:text-[#53328A] transition-colors">Business Scaling</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="#pricing" className="text-gray-900 hover:text-[#53328A] font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-900 hover:text-[#53328A] font-medium transition-colors">
                Company
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mt-16 min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50 px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text and CTA */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                One App For Your Business
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Everything your business needs in one powerful platform. Manage CRM, Invoicing, Inventory, HR, Payments, Accounting, and more. 
                Built specifically for Indian SMBs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white px-8 py-6 text-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#dashboard-showcase">
                  <Button size="lg" variant="outline" className="border-2 border-[#53328A] text-[#53328A] hover:bg-purple-50 px-8 py-6 text-lg">
                    Watch Demo →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px]">
              <Image
                src="/hero-digital-specialists.png"
                alt="Digital Specialists Ready to Transform Your Business"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Industry Selection - Right after Hero */}
          <div className="max-w-2xl mx-auto mt-16">
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
                <Select value={selectedIndustry} onValueChange={handleIndustrySelect}>
                  <SelectTrigger id="industry-select" className="w-full h-12 text-base">
                    <SelectValue placeholder="Choose your industry..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto z-50">
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id} className="cursor-pointer">
                        {industry.icon} {industry.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="others" className="cursor-pointer">➕ Others (Not Listed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <section id="dashboard-showcase" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                All Your Business, One Dashboard
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Manage your entire business from a single, intuitive dashboard. Access customer management, invoicing, inventory, payments, HR, accounting, analytics, and AI-powered insights all in one place. No switching between tools. No learning curves.
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
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
                30M+
              </div>
              <div className="text-sm md:text-base text-gray-600 font-medium">SMBs in India</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
                50%
              </div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Cost Savings</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
                8
              </div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Complete Modules</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
                ₹7,999
              </div>
              <div className="text-sm md:text-base text-gray-600 font-medium">All-in-One Price</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run and grow your business efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* All-in-One Platform */}
            <div className="bg-gradient-to-br from-purple-50 to-yellow-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all">
              <div className="w-20 h-20 mb-6 rounded-xl bg-white shadow-lg flex items-center justify-center">
                <Image
                  src="/All-in-One-Platform.png"
                  alt="All-in-One Platform"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">All-in-One Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Stop using multiple tools. Manage CRM, invoicing, inventory, HR, payments, and accounting all in one unified platform.
              </p>
            </div>

            {/* Agentic Workflow Automation */}
            <div className="bg-gradient-to-br from-purple-50 to-yellow-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all">
              <div className="w-20 h-20 mb-6 rounded-xl bg-white shadow-lg flex items-center justify-center">
                <Image
                  src="/Agentic-Workflow-Automation.jpg"
                  alt="Agentic Workflow Automation"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agentic Workflow Automation</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate your business processes with AI-powered workflows. Reduce manual work and increase efficiency across all operations.
              </p>
            </div>

            {/* AI Website Builder */}
            <div className="bg-gradient-to-br from-purple-50 to-yellow-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all">
              <div className="w-20 h-20 mb-6 rounded-xl bg-white shadow-lg flex items-center justify-center">
                <Image
                  src="/AI-Website-Builder.png"
                  alt="AI Website Builder"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Website Builder</h3>
              <p className="text-gray-600 leading-relaxed">
                Build professional websites and landing pages in minutes with AI assistance. No coding required, fully customizable.
              </p>
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
              { title: '50% More Affordable', desc: '₹7,999/month for complete features. No hidden costs. No feature paywalls. Everything is included in your plan.' },
              { title: 'India-First Design', desc: 'Built with GST compliance, FSSAI support, and ONDC integration. Hindi language support available for all users.' },
              { title: 'AI-Powered Intelligence', desc: 'Get automated business insights and smart recommendations. Your personal AI advisor included at no extra cost.' },
              { title: 'Lightning Fast Implementation', desc: 'Start using PayAid in minutes, not months. Simple onboarding, intuitive interface, and immediate productivity gains.' },
              { title: 'Enterprise-Grade Security', desc: 'Your data is encrypted, backed up, and protected. Bank-grade security with enterprise-level compliance standards.' },
              { title: '24/7 Support', desc: 'Dedicated support team available round the clock. Get help when you need it, how you need it.' },
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
                <Link href="#" className="text-[#53328A] font-semibold hover:underline">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-[#53328A] to-[#2D1B47] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">No hidden charges. No surprise fees. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '₹3,999', period: 'per month', features: ['CRM & Invoicing', 'Up to 5 Users', 'Basic Analytics', 'Email Support', 'Mobile App'] },
              { name: 'Professional', price: '₹7,999', period: 'per month', badge: 'Most Popular', features: ['All Modules Included', 'Unlimited Users', 'AI Co-founder', 'Advanced Analytics', 'Priority Support'] },
              { name: 'Enterprise', price: 'Custom', period: 'per month', features: ['Everything Included', 'Custom Integrations', 'Dedicated Account Manager', 'White-label Options', 'SLA Guarantee'] },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border ${
                  plan.badge ? 'border-[#F5C700] bg-gradient-to-br from-[#F5C700]/20 to-[#53328A]/20 scale-105' : 'border-white/20'
                } hover:shadow-2xl transition-all`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 right-6 bg-[#F5C700] text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">{plan.price}</div>
                <div className="text-white/70 mb-6">{plan.period}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[#F5C700]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.badge
                      ? 'bg-[#F5C700] text-gray-900 hover:bg-[#E0B200]'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  size="lg"
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Button>
              </div>
            ))}
          </div>
        </div>
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
          <Link href="/signup">
            <Button size="lg" className="bg-[#F5C700] text-gray-900 hover:bg-[#E0B200] px-12 py-6 text-lg font-bold">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

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
