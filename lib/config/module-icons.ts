/**
 * App Store–style module icons: one symbol per module, consistent rounded badge + brand color.
 * Used by AppIcon and module cards on the home launcher.
 */

import {
  Users,
  ShoppingBag,
  Megaphone,
  Banknote,
  Briefcase,
  MessageSquare,
  Store,
  Sparkles,
  Lightbulb,
  Globe,
  Palette,
  BookOpen,
  Phone,
  BarChart3,
  Newspaper,
  Calendar,
  Package,
  GitBranch,
  FileText,
  LayoutGrid,
  Table,
  FileEdit,
  Folder,
  Presentation,
  Video,
  UtensilsCrossed,
  Wrench,
  Factory,
  BriefcaseBusiness,
  Heart,
  GraduationCap,
  Home,
  Truck,
  Sprout,
  Hammer,
  Scissors,
  Car,
  Building2,
  Scale,
  TrendingUp,
  PackageSearch,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type ModuleIconConfig = {
  Icon: LucideIcon
  bgFrom: string
  bgTo: string
}

const fallback = { Icon: Users, bgFrom: 'from-slate-500', bgTo: 'to-slate-600' }

export const MODULE_ICON_MAP: Record<string, ModuleIconConfig> = {
  // Core
  crm: { Icon: Users, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  sales: { Icon: ShoppingBag, bgFrom: 'from-orange-500', bgTo: 'to-orange-600' },
  marketing: { Icon: Megaphone, bgFrom: 'from-pink-500', bgTo: 'to-pink-600' },
  finance: { Icon: Banknote, bgFrom: 'from-emerald-500', bgTo: 'to-emerald-600' },
  projects: { Icon: Briefcase, bgFrom: 'from-violet-500', bgTo: 'to-violet-600' },
  hr: { Icon: Users, bgFrom: 'from-rose-500', bgTo: 'to-rose-600' },
  communication: { Icon: MessageSquare, bgFrom: 'from-teal-500', bgTo: 'to-teal-600' },
  marketplace: { Icon: Store, bgFrom: 'from-cyan-500', bgTo: 'to-cyan-600' },
  analytics: { Icon: BarChart3, bgFrom: 'from-sky-500', bgTo: 'to-sky-600' },
  'industry-intelligence': { Icon: Newspaper, bgFrom: 'from-indigo-500', bgTo: 'to-indigo-600' },
  appointments: { Icon: Calendar, bgFrom: 'from-green-500', bgTo: 'to-green-600' },
  inventory: { Icon: Package, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  workflow: { Icon: GitBranch, bgFrom: 'from-purple-500', bgTo: 'to-purple-600' },
  'help-center': { Icon: BookOpen, bgFrom: 'from-cyan-500', bgTo: 'to-cyan-600' },
  contracts: { Icon: FileText, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  compliance: { Icon: ShieldCheck, bgFrom: 'from-emerald-500', bgTo: 'to-emerald-600' },
  lms: { Icon: GraduationCap, bgFrom: 'from-violet-500', bgTo: 'to-violet-600' },
  // AI
  'ai-studio': { Icon: Sparkles, bgFrom: 'from-indigo-500', bgTo: 'to-indigo-600' },
  'ai-cofounder': { Icon: Sparkles, bgFrom: 'from-violet-500', bgTo: 'to-violet-600' },
  'ai-chat': { Icon: MessageSquare, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  'ai-insights': { Icon: Lightbulb, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  'website-builder': { Icon: Globe, bgFrom: 'from-green-500', bgTo: 'to-green-600' },
  'logo-generator': { Icon: Palette, bgFrom: 'from-pink-500', bgTo: 'to-pink-600' },
  'knowledge-rag': { Icon: BookOpen, bgFrom: 'from-indigo-500', bgTo: 'to-indigo-600' },
  'voice-agents': { Icon: Phone, bgFrom: 'from-green-500', bgTo: 'to-green-600' },
  // Productivity
  productivity: { Icon: LayoutGrid, bgFrom: 'from-emerald-500', bgTo: 'to-emerald-600' },
  spreadsheet: { Icon: Table, bgFrom: 'from-green-600', bgTo: 'to-green-700' },
  docs: { Icon: FileEdit, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  drive: { Icon: Folder, bgFrom: 'from-red-500', bgTo: 'to-red-600' },
  slides: { Icon: Presentation, bgFrom: 'from-red-500', bgTo: 'to-orange-500' },
  meet: { Icon: Video, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  pdf: { Icon: FileText, bgFrom: 'from-red-500', bgTo: 'to-red-600' },
  // Industry
  restaurant: { Icon: UtensilsCrossed, bgFrom: 'from-red-500', bgTo: 'to-red-600' },
  retail: { Icon: Store, bgFrom: 'from-orange-500', bgTo: 'to-orange-600' },
  service: { Icon: Wrench, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  ecommerce: { Icon: ShoppingBag, bgFrom: 'from-emerald-500', bgTo: 'to-emerald-600' },
  manufacturing: { Icon: Factory, bgFrom: 'from-indigo-500', bgTo: 'to-indigo-600' },
  'field-service': { Icon: Wrench, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  'asset-management': { Icon: Package, bgFrom: 'from-cyan-500', bgTo: 'to-cyan-600' },
  'professional-services': { Icon: BriefcaseBusiness, bgFrom: 'from-violet-500', bgTo: 'to-violet-600' },
  healthcare: { Icon: Heart, bgFrom: 'from-rose-500', bgTo: 'to-rose-600' },
  education: { Icon: GraduationCap, bgFrom: 'from-teal-500', bgTo: 'to-teal-600' },
  'real-estate': { Icon: Home, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  logistics: { Icon: Truck, bgFrom: 'from-cyan-500', bgTo: 'to-cyan-600' },
  agriculture: { Icon: Sprout, bgFrom: 'from-lime-500', bgTo: 'to-lime-600' },
  construction: { Icon: Hammer, bgFrom: 'from-orange-500', bgTo: 'to-orange-600' },
  beauty: { Icon: Scissors, bgFrom: 'from-pink-500', bgTo: 'to-pink-600' },
  automotive: { Icon: Car, bgFrom: 'from-blue-500', bgTo: 'to-blue-600' },
  hospitality: { Icon: Building2, bgFrom: 'from-violet-500', bgTo: 'to-violet-600' },
  legal: { Icon: Scale, bgFrom: 'from-indigo-500', bgTo: 'to-indigo-600' },
  'financial-services': { Icon: TrendingUp, bgFrom: 'from-emerald-500', bgTo: 'to-emerald-600' },
  events: { Icon: Calendar, bgFrom: 'from-amber-500', bgTo: 'to-amber-600' },
  wholesale: { Icon: PackageSearch, bgFrom: 'from-teal-500', bgTo: 'to-teal-600' },
}

export function getModuleIconConfig(moduleId: string): ModuleIconConfig {
  return MODULE_ICON_MAP[moduleId] ?? fallback
}
