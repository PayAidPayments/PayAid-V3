/**
 * Pre-built Website Component Templates
 * Ready-to-use React components for common website sections
 */

export interface ComponentTemplate {
  id: string
  name: string
  description: string
  category: 'hero' | 'features' | 'pricing' | 'testimonials' | 'about' | 'contact' | 'footer'
  code: string
  preview?: string
  tags: string[]
  industry?: 'ecommerce' | 'saas' | 'restaurant' | 'healthcare' | 'education' | 'real-estate' | 'general'
  isCustom?: boolean
  createdBy?: string
  createdAt?: string
}

export const componentTemplates: ComponentTemplate[] = [
  {
    id: 'hero-modern',
    name: 'Modern Hero Section',
    description: 'Clean hero section with headline, subtitle, and CTA buttons',
    category: 'hero',
    code: `export const ModernHero = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Welcome to Our Platform
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">
          Build amazing things with our powerful tools and services
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Get Started
          </button>
          <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}`,
    tags: ['modern', 'gradient', 'cta'],
  },
  {
    id: 'features-grid',
    name: 'Features Grid',
    description: 'Three-column features grid with icons',
    category: 'features',
    code: `export const FeaturesGrid = () => {
  const features = [
    {
      title: 'Fast & Reliable',
      description: 'Lightning-fast performance with 99.9% uptime',
      icon: '⚡',
    },
    {
      title: 'Secure',
      description: 'Enterprise-grade security for your data',
      icon: '🔒',
    },
    {
      title: 'Scalable',
      description: 'Grows with your business needs',
      icon: '📈',
    },
  ]

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,
    tags: ['grid', 'icons', 'responsive'],
  },
  {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    description: 'Three-tier pricing cards with features',
    category: 'pricing',
    code: `export const PricingCards = () => {
  const plans = [
    {
      name: 'Starter',
      price: '₹999',
      period: '/month',
      features: ['10 Projects', '5GB Storage', 'Email Support'],
      popular: false,
    },
    {
      name: 'Professional',
      price: '₹2,999',
      period: '/month',
      features: ['Unlimited Projects', '50GB Storage', 'Priority Support', 'Advanced Features'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      period: '/month',
      features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee'],
      popular: false,
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={\`bg-white p-8 rounded-lg shadow-lg \${plan.popular ? 'border-2 border-blue-500 scale-105' : ''}\`}
            >
              {plan.popular && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mt-4 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={\`w-full py-3 rounded-lg font-semibold transition \${plan.popular ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}\`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,
    tags: ['pricing', 'cards', 'comparison'],
  },
  {
    id: 'testimonials',
    name: 'Testimonials Section',
    description: 'Customer testimonials with avatars',
    category: 'testimonials',
    code: `export const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'CEO, TechCorp',
      content: 'This platform has transformed how we work. Highly recommended!',
      avatar: '👤',
    },
    {
      name: 'Priya Sharma',
      role: 'Founder, StartupXYZ',
      content: 'The best investment we made for our business. Excellent support!',
      avatar: '👤',
    },
    {
      name: 'Amit Patel',
      role: 'CTO, InnovateLabs',
      content: 'Outstanding features and reliability. Our team loves it!',
      avatar: '👤',
    },
  ]

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
              <div className="flex items-center">
                <div className="text-3xl mr-4">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,
    tags: ['testimonials', 'reviews', 'social-proof'],
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Simple contact form with validation',
    category: 'contact',
    code: `export const ContactForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert('Form submitted!')
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-8">Get In Touch</h2>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  )
}`,
    tags: ['form', 'contact', 'validation'],
  },
  {
    id: 'footer-simple',
    name: 'Simple Footer',
    description: 'Clean footer with links and copyright',
    category: 'footer',
    code: `export const SimpleFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/about" className="hover:text-white">About</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
              <li><a href="/careers" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/features" className="hover:text-white">Features</a></li>
              <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="/docs" className="hover:text-white">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}`,
    tags: ['footer', 'links', 'social'],
  },
  // Additional Hero Templates
  {
    id: 'hero-minimal',
    name: 'Minimal Hero',
    description: 'Clean, minimal hero with centered content',
    category: 'hero',
    industry: 'saas',
    code: `export const MinimalHero = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">
          Simple. Powerful. Beautiful.
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Everything you need to build your next great product
        </p>
        <button className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition">
          Get Started Free
        </button>
      </div>
    </section>
  )
}`,
    tags: ['minimal', 'centered', 'saas'],
  },
  {
    id: 'hero-ecommerce',
    name: 'E-commerce Hero',
    description: 'Product-focused hero with image and CTA',
    category: 'hero',
    industry: 'ecommerce',
    code: `export const EcommerceHero = () => {
  return (
    <section className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            New Collection 2024
          </h1>
          <p className="text-xl mb-6 text-pink-100">
            Discover our latest fashion trends and exclusive designs
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition">
              Shop Now
            </button>
            <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
              View Collection
            </button>
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <p className="text-sm">Product Image Placeholder</p>
        </div>
      </div>
    </section>
  )
}`,
    tags: ['ecommerce', 'product', 'image'],
  },
  {
    id: 'hero-restaurant',
    name: 'Restaurant Hero',
    description: 'Appetizing hero section for restaurants',
    category: 'hero',
    industry: 'restaurant',
    code: `export const RestaurantHero = () => {
  return (
    <section className="relative bg-gradient-to-br from-amber-900 to-amber-700 text-white py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 font-serif">
          Authentic Indian Cuisine
        </h1>
        <p className="text-2xl mb-8 text-amber-100">
          Experience the finest flavors from across India
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition">
            View Menu
          </button>
          <button className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition">
            Reserve Table
          </button>
        </div>
      </div>
    </section>
  )
}`,
    tags: ['restaurant', 'food', 'menu'],
  },
  {
    id: 'hero-healthcare',
    name: 'Healthcare Hero',
    description: 'Trustworthy hero for healthcare services',
    category: 'hero',
    industry: 'healthcare',
    code: `export const HealthcareHero = () => {
  return (
    <section className="bg-blue-50 py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="text-5xl mb-4">🏥</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          Your Health, Our Priority
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Comprehensive healthcare services with compassionate care
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Book Appointment
          </button>
          <button className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Our Services
          </button>
        </div>
      </div>
    </section>
  )
}`,
    tags: ['healthcare', 'medical', 'trust'],
  },
  {
    id: 'features-icons',
    name: 'Features with Icons',
    description: 'Feature grid with custom icons and descriptions',
    category: 'features',
    code: `export const FeaturesWithIcons = () => {
  const features = [
    { icon: '🚀', title: 'Fast Setup', desc: 'Get started in minutes' },
    { icon: '🔒', title: 'Secure', desc: 'Bank-level security' },
    { icon: '📱', title: 'Mobile Ready', desc: 'Works on all devices' },
    { icon: '⚡', title: 'High Performance', desc: 'Lightning fast' },
    { icon: '🌍', title: 'Global', desc: 'Available worldwide' },
    { icon: '💬', title: '24/7 Support', desc: 'Always here to help' },
  ]

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg hover:bg-gray-50 transition">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,
    tags: ['features', 'icons', 'grid'],
  },
  {
    id: 'pricing-simple',
    name: 'Simple Pricing',
    description: 'Clean two-column pricing layout',
    category: 'pricing',
    code: `export const SimplePricing = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Basic</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Up to 5 projects
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                10GB storage
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Email support
              </li>
            </ul>
            <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              Get Started
            </button>
          </div>
          <div className="bg-blue-600 text-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹2,999</span>
              <span className="text-blue-200">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Unlimited projects
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                100GB storage
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Advanced features
              </li>
            </ul>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}`,
    tags: ['pricing', 'simple', 'two-column'],
  },
]

export function getTemplatesByCategory(category: ComponentTemplate['category']) {
  return componentTemplates.filter((t) => t.category === category)
}

export function getTemplateById(id: string) {
  return componentTemplates.find((t) => t.id === id)
}

export function searchTemplates(query: string) {
  const lowerQuery = query.toLowerCase()
  return componentTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      t.industry?.toLowerCase().includes(lowerQuery)
  )
}

export function getTemplatesByIndustry(industry: ComponentTemplate['industry']) {
  return componentTemplates.filter((t) => t.industry === industry)
}

export function getCustomTemplates(tenantId?: string) {
  return componentTemplates.filter((t) => t.isCustom && (!tenantId || t.createdBy === tenantId))
}

