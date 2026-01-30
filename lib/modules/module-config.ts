/**
 * Universal Module Configuration
 * Defines gradient colors, icons, and settings for all 28 PayAid V3 modules
 */

import {
  Users, Briefcase, Scale, ShoppingCart, Building2, BarChart3,
  FileText, Calendar, Megaphone, Package, GraduationCap, Stethoscope,
  Factory, Wrench, Palette, Globe, BookOpen, Video, Music, Camera,
  Car, Plane, UtensilsCrossed, Shirt, Home, Zap, Bot, Target
} from 'lucide-react'

export interface ModuleConfig {
  id: string
  name: string
  gradientFrom: string // Tailwind class
  gradientTo: string // Tailwind class
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

/**
 * Module configurations for all 28 PayAid V3 modules
 * Each module has unique gradient colors while maintaining brand consistency
 */
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // Core Business Modules
  home: {
    id: 'home',
    name: 'Home',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-700',
    icon: Home,
    description: 'Central hub for all modules',
  },
  crm: {
    id: 'crm',
    name: 'CRM',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-700',
    icon: Users,
    description: 'Customer Relationship Management',
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    gradientFrom: 'from-gold-500',
    gradientTo: 'to-gold-700',
    icon: Scale,
    description: 'Financial management and accounting',
  },
  sales: {
    id: 'sales',
    name: 'Sales',
    gradientFrom: 'from-success',
    gradientTo: 'to-emerald-700',
    icon: Briefcase,
    description: 'Sales and e-commerce',
  },
  hr: {
    id: 'hr',
    name: 'HR',
    gradientFrom: 'from-info',
    gradientTo: 'to-blue-700',
    icon: Users,
    description: 'Human Resources management',
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-amber-800',
    icon: Package,
    description: 'Inventory and stock management',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-indigo-700',
    icon: BarChart3,
    description: 'Business analytics and insights',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    icon: Megaphone,
    description: 'Marketing campaigns and automation',
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-cyan-700',
    icon: FileText,
    description: 'Project management',
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-700',
    icon: Users,
    description: 'Team communication',
  },
  // Industry-Specific Modules
  education: {
    id: 'education',
    name: 'Education',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-indigo-700',
    icon: GraduationCap,
    description: 'Educational institution management',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-700',
    icon: Stethoscope,
    description: 'Healthcare management',
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    gradientFrom: 'from-gray-600',
    gradientTo: 'to-gray-800',
    icon: Factory,
    description: 'Manufacturing operations',
  },
  retail: {
    id: 'retail',
    name: 'Retail',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-orange-700',
    icon: ShoppingCart,
    description: 'Retail store management',
  },
  // Additional Modules
  'ai-studio': {
    id: 'ai-studio',
    name: 'AI Studio',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-800',
    icon: Bot,
    description: 'AI-powered tools and automation',
  },
  // Add more modules as needed...
}

/**
 * Get module configuration by ID
 */
export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return MODULE_CONFIGS[moduleId]
}

/**
 * Get default module configuration (CRM)
 */
export function getDefaultModuleConfig(): ModuleConfig {
  return MODULE_CONFIGS.crm
}
