'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // Mark as mounted after first render to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only check auth after component is mounted and not loading
    if (!mounted || isLoading) return

    // Only redirect if user is actually authenticated (not just has a token)
    if (isAuthenticated && token) {
      // Redirect to dashboard with tenant ID
      const { tenant } = useAuthStore.getState()
      if (tenant?.id) {
        router.push(`/dashboard/${tenant.id}`)
      } else {
        router.push('/dashboard')
      }
    } else if (token && !isAuthenticated) {
      // Try to fetch user if we have a token but aren't authenticated yet
      // Don't block rendering - fetch in background
      fetchUser().catch(() => {
        // If fetch fails, user will stay on landing page
      })
    }
  }, [mounted, isAuthenticated, isLoading, token, router, fetchUser])

  // Show loading only very briefly during mount, then show landing page immediately
  // Don't wait for auth check - show page and check auth in background
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-payaid-purple"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            <span className="text-payaid-purple">Pay</span>
            <span className="text-payaid-gold">Aid</span>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex gap-6 lg:gap-8 items-center">
            <Link href="#features" className="text-payaid-charcoal hover:text-payaid-purple font-medium transition-colors">Features</Link>
            <Link href="#modules" className="text-payaid-charcoal hover:text-payaid-purple font-medium transition-colors">Modules</Link>
            <Link href="#pricing" className="text-payaid-charcoal hover:text-payaid-purple font-medium transition-colors">Pricing</Link>
            <Link href="/login" className="text-payaid-charcoal hover:text-payaid-purple font-medium transition-colors">Sign In</Link>
            <Link href="/register">
              <Button className="bg-payaid-gold hover:bg-payaid-gold-hover text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md">
                Start Free Trial
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-payaid-purple"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-3">
              <Link href="#features" className="block text-payaid-charcoal hover:text-payaid-purple font-medium">Features</Link>
              <Link href="#modules" className="block text-payaid-charcoal hover:text-payaid-purple font-medium">Modules</Link>
              <Link href="#pricing" className="block text-payaid-charcoal hover:text-payaid-purple font-medium">Pricing</Link>
              <Link href="/login" className="block text-payaid-charcoal hover:text-payaid-purple font-medium">Sign In</Link>
              <Link href="/register" className="block">
                <Button className="w-full bg-payaid-gold hover:bg-payaid-gold-hover text-white">Start Free Trial</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* HERO SECTION - Enhanced with floating graphics */}
      <section className="relative bg-gradient-to-br from-[#53328A] via-[#4A2A7A] to-[#3F1F62] text-white py-20 md:py-40 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating orbs */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-payaid-gold/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20"
            >
              🚀 All-in-One Business Platform
            </motion.span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="block">Run Your Entire</span>
            <span className="block bg-gradient-to-r from-payaid-gold to-yellow-300 bg-clip-text text-transparent">
              Business on PayAid
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto"
          >
            One platform. Eight powerful modules. Built for India.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/register">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-payaid-gold hover:bg-payaid-gold-hover text-payaid-purple px-10 py-5 rounded-xl font-bold text-lg transition-all shadow-2xl hover:shadow-payaid-gold/50"
              >
                Start Free Trial →
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white/30 backdrop-blur-sm text-white hover:bg-white/10 px-10 py-5 rounded-xl font-bold text-lg transition-all"
            >
              Watch Demo
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap justify-center gap-6 text-white/80 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-payaid-gold text-xl">✓</span>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-payaid-gold text-xl">✓</span>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-payaid-gold text-xl">✓</span>
              <span>Setup in minutes</span>
            </div>
          </motion.div>
        </div>

          {/* Floating Module Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { icon: '🎯', x: '10%', y: '30%', delay: 0 },
            { icon: '🛒', x: '85%', y: '25%', delay: 0.15 },
            { icon: '📢', x: '5%', y: '20%', delay: 0.3 },
            { icon: '💰', x: '90%', y: '50%', delay: 0.45 },
            { icon: '👔', x: '15%', y: '70%', delay: 0.6 },
            { icon: '💬', x: '88%', y: '75%', delay: 0.75 },
            { icon: '✨', x: '8%', y: '50%', delay: 0.9 },
            { icon: '📈', x: '92%', y: '40%', delay: 1.05 },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl md:text-5xl"
              style={{ left: item.x, top: item.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 4,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {item.icon}
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <SectionWrapper>
        <section className="py-16 bg-gradient-to-r from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {[
                { number: '10K+', label: 'Businesses', icon: '🏢' },
                { number: '50K+', label: 'Users', icon: '👥' },
                { number: '₹2.5Cr+', label: 'Processed', icon: '💰' },
                { number: '99.9%', label: 'Uptime', icon: '⚡' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold text-payaid-purple mb-2">{stat.number}</div>
                  <div className="text-payaid-charcoal font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </SectionWrapper>

      {/* MODULES SHOWCASE - Visual Cards */}
      <SectionWrapper>
        <section id="modules" className="py-20 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-payaid-purple mb-4">
                Everything You Need
              </h2>
              <p className="text-xl text-payaid-charcoal">
                Eight powerful modules, working seamlessly together
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { 
                  name: 'CRM', 
                  icon: '🎯', 
                  desc: 'Customer relationship management',
                  gradient: 'from-blue-500 to-purple-600',
                  features: ['Contacts', 'Deals', 'Pipeline', 'Tasks']
                },
                { 
                  name: 'Sales', 
                  icon: '🛒', 
                  desc: 'Sales pages & order management',
                  gradient: 'from-yellow-500 to-orange-600',
                  features: ['Landing Pages', 'Checkout', 'Orders']
                },
                { 
                  name: 'Marketing', 
                  icon: '📢', 
                  desc: 'Campaigns & customer engagement',
                  gradient: 'from-purple-500 to-pink-600',
                  features: ['Campaigns', 'WhatsApp', 'Email', 'Social']
                },
                { 
                  name: 'Finance', 
                  icon: '💰', 
                  desc: 'Invoices, accounting & GST',
                  gradient: 'from-green-500 to-emerald-600',
                  features: ['Invoicing', 'Accounting', 'GST Reports', 'Expenses']
                },
                { 
                  name: 'HR & Payroll', 
                  icon: '👔', 
                  desc: 'Employee management & payroll',
                  gradient: 'from-pink-500 to-rose-600',
                  features: ['Payroll', 'Attendance', 'Leave', 'Hiring']
                },
                { 
                  name: 'Communication', 
                  icon: '💬', 
                  desc: 'Email & team collaboration',
                  gradient: 'from-indigo-500 to-blue-600',
                  features: ['Email Accounts', 'Webmail', 'Team Chat']
                },
                { 
                  name: 'AI Studio', 
                  icon: '✨', 
                  desc: 'AI-powered business tools',
                  gradient: 'from-cyan-500 to-blue-600',
                  features: ['AI Chat', 'Website Builder', 'Logo Generator', 'AI Calling']
                },
                { 
                  name: 'Analytics & Reporting', 
                  icon: '📈', 
                  desc: 'Business intelligence & insights',
                  gradient: 'from-orange-500 to-red-600',
                  features: ['Dashboards', 'Custom Reports', 'Insights']
                },
              ].map((module, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-100"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative p-8">
                    <motion.div 
                      className="text-6xl mb-4"
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {module.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-payaid-purple mb-2">{module.name}</h3>
                    <p className="text-payaid-charcoal mb-4">{module.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature, j) => (
                        <span key={j} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-payaid-charcoal">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Hover effect border */}
                  <div className={`absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-br ${module.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity`} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </SectionWrapper>

      {/* WHY PAYAID - Visual Features */}
      <SectionWrapper>
        <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-payaid-purple mb-4">
                Why Choose PayAid?
              </h2>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: '⚡',
                  title: '2x Faster',
                  desc: 'Pages load in <1 second',
                  color: 'text-yellow-500'
                },
                {
                  icon: '💰',
                  title: 'Affordable',
                  desc: 'Starting ₹2,499/month',
                  color: 'text-green-500'
                },
                {
                  icon: '💬',
                  title: 'WhatsApp Native',
                  desc: 'Send invoices instantly',
                  color: 'text-green-400'
                },
                {
                  icon: '🇮🇳',
                  title: 'India-First',
                  desc: 'Built for Indian SMBs',
                  color: 'text-orange-500'
                },
                {
                  icon: '🤖',
                  title: 'AI-Powered',
                  desc: 'Smart automation',
                  color: 'text-purple-500'
                },
                {
                  icon: '✅',
                  title: 'Easy Setup',
                  desc: '30 minutes to live',
                  color: 'text-blue-500'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -8, rotateY: 5 }}
                  className="relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 group"
                >
                  <div className={`text-5xl mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-payaid-purple mb-2">{item.title}</h3>
                  <p className="text-payaid-charcoal">{item.desc}</p>
                  
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-payaid-purple/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </SectionWrapper>

      {/* PRICING SECTION */}
      <SectionWrapper>
        <section id="pricing" className="py-20 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-payaid-purple mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-payaid-charcoal">
                Choose the plan that fits your business
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
            >
              {[
                {
                  name: 'Starter',
                  price: '₹2,499',
                  features: ['CRM', 'Finance', 'Basic Support'],
                  cta: 'Start Free',
                  popular: false,
                  icon: '🚀'
                },
                {
                  name: 'Professional',
                  price: '₹7,999',
                  features: ['All Modules', 'Priority Support', 'Advanced Reports'],
                  cta: 'Most Popular',
                  popular: true,
                  icon: '⭐'
                },
                {
                  name: 'Enterprise',
                  price: '₹14,999',
                  features: ['Everything', 'Premium Support', 'API Access', 'Custom Features'],
                  cta: 'Contact Sales',
                  popular: false,
                  icon: '🏆'
                },
              ].map((plan, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: plan.popular ? 1.05 : 1.02 }}
                  className={`rounded-2xl p-8 relative overflow-hidden ${
                    plan.popular
                      ? 'bg-gradient-to-br from-payaid-purple to-payaid-purple-dark text-white border-2 border-payaid-gold shadow-2xl'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 bg-payaid-gold text-payaid-purple px-4 py-2 rounded-full text-sm font-bold"
                    >
                      🏆 Popular
                    </motion.div>
                  )}
                  
                  <div className="text-5xl mb-4">{plan.icon}</div>
                  <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-5xl font-bold mb-2">
                    {plan.price}
                    <span className="text-xl">/month</span>
                  </div>
                  
                  <ul className="mb-8 space-y-3 mt-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="text-payaid-gold">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        plan.popular
                          ? 'bg-payaid-gold text-payaid-purple hover:bg-payaid-gold-hover shadow-lg'
                          : 'bg-payaid-purple text-white hover:bg-payaid-purple-dark'
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.p 
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center text-payaid-charcoal text-lg"
            >
              💰 Save up to ₹1,50,000/year compared to traditional solutions
            </motion.p>
          </div>
        </section>
      </SectionWrapper>

      {/* TESTIMONIALS - Visual */}
      <SectionWrapper>
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-payaid-purple mb-4">
                Loved by Thousands
              </h2>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  quote: "PayAid saved us 20 hours per week. The speed alone is worth it.",
                  author: "Rajesh Kumar",
                  title: "Founder, TechStart India",
                  rating: 5,
                  avatar: '👨‍💼'
                },
                {
                  quote: "Finally, a CRM built for India. WhatsApp integration is a game-changer.",
                  author: "Priya Sharma",
                  title: "Director, E-Commerce Venture",
                  rating: 5,
                  avatar: '👩‍💼'
                },
                {
                  quote: "PayAid is intuitive, affordable, and just works. Setup was effortless.",
                  author: "Amit Patel",
                  title: "CEO, Manufacturing SMB",
                  rating: 5,
                  avatar: '👨‍💻'
                },
              ].map((testimonial, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <span key={j} className="text-payaid-gold text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-payaid-charcoal mb-6 text-lg italic">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-bold text-payaid-purple">{testimonial.author}</p>
                      <p className="text-gray-600 text-sm">{testimonial.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </SectionWrapper>

      {/* FINAL CTA SECTION */}
      <SectionWrapper>
        <section className="relative bg-gradient-to-r from-payaid-purple via-purple-700 to-payaid-purple-dark text-white py-20 md:py-32 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(245,199,0,0.1),transparent_50%)]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h2 
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to Transform Your Business?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-xl md:text-2xl mb-10 text-white/90"
            >
              Join 10,000+ businesses already using PayAid
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-payaid-gold hover:bg-payaid-gold-hover text-payaid-purple px-12 py-6 rounded-xl font-bold text-xl transition-all shadow-2xl hover:shadow-payaid-gold/50"
                >
                  Start Your Free Trial Now →
                </motion.button>
              </Link>
            </motion.div>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-6 text-white/80"
            >
              No credit card required • Setup in minutes • Cancel anytime
            </motion.p>
          </div>
        </section>
      </SectionWrapper>

      {/* FOOTER */}
      <footer className="bg-payaid-charcoal text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4 text-lg">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="#modules" className="hover:text-payaid-gold transition-colors">Modules</Link></li>
                <li><Link href="#features" className="hover:text-payaid-gold transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-payaid-gold transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">Docs</Link></li>
                <li><Link href="#" className="hover:text-payaid-gold transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Connect</h4>
              <div className="flex gap-4 text-gray-300">
                <Link href="#" className="hover:text-payaid-gold text-2xl transition-colors">📘</Link>
                <Link href="#" className="hover:text-payaid-gold text-2xl transition-colors">🐦</Link>
                <Link href="#" className="hover:text-payaid-gold text-2xl transition-colors">💼</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-8 text-gray-400 text-sm text-center">
            <p>© 2025 PayAid Payments. All rights reserved.</p>
            <p className="mt-2">
              <Link href="#" className="hover:text-payaid-gold transition-colors">Privacy Policy</Link> | 
              <Link href="#" className="hover:text-payaid-gold transition-colors"> Terms of Service</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper component for scroll animations
function SectionWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref}>
      {children}
    </div>
  )
}
