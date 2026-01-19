'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllIndustries } from '@/lib/industries/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default function LandingPage() {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const industries = getAllIndustries()

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId)
    if (industryId) {
      // Navigate to signup with industry selected
      router.push(`/signup?industry=${industryId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
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
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
              Faster Execution
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              50%
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
              Cost Savings
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              100%
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
              Business Visibility
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent mb-2">
              0
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
              Tools to Switch
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Your Complete Business OS
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#53328A] to-[#F5C700] text-white rounded-full text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-powered CRM, automation, and intelligence to streamline operations, reduce costs, and elevate customer experiences. Everything your business needs—from conversational AI to workflow automation—all in one platform. Built for India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#6B42A3] hover:to-[#E0B200] text-white">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#ai-features">
              <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                Explore AI Features →
              </Button>
            </Link>
          </div>
        </div>

        {/* Industry Selection Section - Right after Hero */}
        <div className="mb-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
            What industry is your business in?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Select your industry to get started with tailored features
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry-select" className="text-base font-medium text-gray-700 dark:text-gray-300">
                Select Your Industry
              </Label>
              <Select
                value={selectedIndustry}
                onValueChange={handleIndustrySelect}
              >
                <SelectTrigger id="industry-select" className="w-full h-12 text-base dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Choose your industry..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {industries.map((industry) => (
                    <SelectItem 
                      key={industry.id} 
                      value={industry.id}
                      className="dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      {industry.icon} {industry.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="others" className="dark:text-gray-100 dark:hover:bg-gray-700">
                    ➕ Others (Not Listed)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Specialists Section */}
      <section id="ai-features" className="mb-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Digital Specialists Ready to Transform Your Business
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            PayAid Co-Founder with Finance, Sales, Logistics, Communication, Legal, Analytics, Chat Bot, Vendor Management, Design, Human Resource, and CRM specialists orbiting around the central Co-Founder figure
          </p>
        </div>
        <div className="relative bg-gradient-to-br from-purple-100 to-yellow-100 dark:from-purple-900/30 dark:to-yellow-900/30 rounded-2xl p-8 md:p-12 overflow-hidden">
          {/* Central Co-Founder */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-[#53328A] to-[#F5C700] flex items-center justify-center shadow-2xl">
              <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-white" />
            </div>
            <div className="text-center mt-4">
              <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">AI Co-Founder</div>
            </div>
          </div>
          
          {/* Orbiting Specialists */}
          <div className="relative h-96 md:h-[500px]">
            {[
              { name: 'Finance', icon: '💰', angle: 0 },
              { name: 'Sales', icon: '📊', angle: 30 },
              { name: 'Logistics', icon: '🚚', angle: 60 },
              { name: 'Communication', icon: '💬', angle: 90 },
              { name: 'Legal', icon: '⚖️', angle: 120 },
              { name: 'Analytics', icon: '📈', angle: 150 },
              { name: 'Chat Bot', icon: '🤖', angle: 180 },
              { name: 'Vendor Management', icon: '🏢', angle: 210 },
              { name: 'Design', icon: '🎨', angle: 240 },
              { name: 'Human Resource', icon: '👥', angle: 270 },
              { name: 'CRM', icon: '📋', angle: 300 },
              { name: 'Marketing', icon: '📢', angle: 330 },
            ].map((specialist, index) => {
              const radius = 180
              const angleRad = (specialist.angle * Math.PI) / 180
              const x = Math.cos(angleRad) * radius
              const y = Math.sin(angleRad) * radius
              return (
                <div
                  key={index}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-2 border-purple-200 dark:border-purple-700 hover:scale-110 transition-transform">
                    <span className="text-2xl md:text-3xl">{specialist.icon}</span>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {specialist.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Entire Business, One Dashboard Section */}
      <section className="mb-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Entire Business, One Dashboard
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Manage your entire business from a single, intuitive dashboard. Access customer management, invoicing, inventory, payments, HR, accounting, analytics, and AI-powered insights all in one place. No switching between tools. No learning curves.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { name: 'CRM', icon: '📋', color: 'from-blue-500 to-blue-600' },
            { name: 'Invoicing', icon: '🧾', color: 'from-green-500 to-green-600' },
            { name: 'Inventory', icon: '📦', color: 'from-purple-500 to-purple-600' },
            { name: 'Analytics', icon: '📊', color: 'from-yellow-500 to-yellow-600' },
          ].map((module, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center text-3xl`}>
                  {module.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{module.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; 2025 PayAid. Built for Indian Businesses. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
