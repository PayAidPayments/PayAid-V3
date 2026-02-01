// Client-side only - icons are loaded dynamically
// This prevents SSR evaluation issues with lucide-react

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from lucide-react
  url: string; // Module URL (will be configured when domain is available)
  status: "active" | "coming-soon" | "beta";
  category: "core" | "productivity" | "industry" | "ai";
  color: string; // HEX color for card background
}

export const modules: ModuleConfig[] = [
  // Core Business Modules
  {
    id: "crm",
    name: "CRM",
    description: "Manage customer relationships, deals, and contacts",
    icon: "Users",
    url: "/crm", // Will redirect to crm.localhost:3000/[tenantId]/crm/Home/ after login
    status: "active",
    category: "core",
    color: "#3B82F6"
  },
  {
    id: "sales",
    name: "Sales Pages",
    description: "Create landing pages and checkout pages for your business",
    icon: "ShoppingCart",
    url: "/sales", // Will redirect to /sales/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#10B981"
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Email campaigns, social media, and WhatsApp marketing",
    icon: "Megaphone",
    url: "/marketing", // Will redirect to /marketing/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#8B5CF6"
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    description: "Complete financial management - Invoicing, accounting, expenses, purchase orders, GST reports, and payments",
    icon: "IndianRupee",
    url: "/finance", // Will redirect to /finance/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#F59E0B"
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project management, tasks, time tracking, and Gantt charts",
    icon: "Briefcase",
    url: "/projects", // Will redirect to /projects/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#8B5CF6"
  },
  {
    id: "hr",
    name: "HR",
    description: "Employee management, payroll, leave, and attendance",
    icon: "Briefcase",
    url: "/hr", // Will redirect to /hr/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#EC4899"
  },
  {
    id: "communication",
    name: "Communication",
    description: "Email, chat, SMS, and WhatsApp integration",
    icon: "MessageSquare",
    url: "/communication", // Communication module
    status: "active",
    category: "core",
    color: "#06B6D4"
  },
  {
    id: "ai-cofounder",
    name: "AI Co-founder",
    description: "Business AI assistant with 9 specialist agents for finance, sales, marketing, HR, and more",
    icon: "Sparkles",
    url: "/ai-cofounder", // Decoupled architecture: /ai-cofounder/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#9333EA"
  },
  {
    id: "ai-chat",
    name: "AI Chat",
    description: "General-purpose conversational AI assistant for questions, explanations, and creative tasks",
    icon: "MessageSquare",
    url: "/ai-chat", // Decoupled architecture: /ai-chat/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#3B82F6"
  },
  {
    id: "ai-insights",
    name: "AI Insights",
    description: "AI-powered business analysis, revenue insights, risk warnings, and data-driven recommendations",
    icon: "Lightbulb",
    url: "/ai-insights", // Decoupled architecture: /ai-insights/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#F59E0B"
  },
  {
    id: "website-builder",
    name: "Website Builder",
    description: "AI-powered website builder with component generation, templates, and live preview",
    icon: "Globe",
    url: "/website-builder", // Decoupled architecture: /website-builder/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#10B981"
  },
  {
    id: "logo-generator",
    name: "Logo Generator",
    description: "AI-powered logo creation with multiple variations and customization options",
    icon: "Palette",
    url: "/logo-generator", // Decoupled architecture: /logo-generator/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#EC4899"
  },
  {
    id: "knowledge-rag",
    name: "Knowledge & RAG AI",
    description: "Document Q&A with RAG, source citations, audit trails, and multi-document search",
    icon: "BookOpen",
    url: "/knowledge-rag", // Decoupled architecture: /knowledge-rag/[tenantId]/Home
    status: "active",
    category: "ai",
    color: "#6366F1"
  },
  {
    id: "voice-agents",
    name: "Voice Agents",
    description: "AI-powered voice agents for automated calls in Hindi, English, and regional languages",
    icon: "Phone",
    url: "/voice-agents", // Decoupled module route
    status: "coming-soon", // Coming soon in production, available on localhost
    category: "ai",
    color: "#10B981"
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Business analytics, reports, and performance dashboards",
    icon: "BarChart3",
    url: "/dashboard/analytics",
    status: "active",
    category: "core",
    color: "#14B8A6"
  },
  {
    id: "industry-intelligence",
    name: "Industry Intelligence",
    description: "Industry news, trends, and business intelligence tailored to your business",
    icon: "Newspaper",
    url: "/dashboard/news",
    status: "active",
    category: "core",
    color: "#8B5CF6"
  },
  {
    id: "appointments",
    name: "Appointments",
    description: "Schedule appointments, manage calendars, send reminders, and track customer bookings",
    icon: "Calendar",
    url: "/dashboard/appointments",
    status: "active",
    category: "core",
    color: "#10B981"
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Product catalog, multi-location inventory, and stock management",
    icon: "Package",
    url: "/inventory", // Will redirect to /inventory/[tenantId]/Home/ after login
    status: "active",
    category: "core",
    color: "#22C55E"
  },
  {
    id: "workflow",
    name: "Workflow Automation",
    description: "Visual workflow builder, automation, and task orchestration",
    icon: "GitBranch",
    url: "/dashboard/workflows",
    status: "active",
    category: "core",
    color: "#8B5CF6"
  },
  {
    id: "help-center",
    name: "Help Center",
    description: "Knowledge base, articles, and self-service support",
    icon: "BookOpen",
    url: "/dashboard/help-center",
    status: "active",
    category: "core",
    color: "#06B6D4"
  },
  {
    id: "contracts",
    name: "Contract Management",
    description: "Contract templates, e-signatures, version control, and renewal tracking",
    icon: "FileText",
    url: "/dashboard/contracts",
    status: "active",
    category: "core",
    color: "#F59E0B"
  },
  
  // Productivity Suite
  {
    id: "spreadsheet",
    name: "Spreadsheet",
    description: "Excel alternative with formulas, charts, and collaboration",
    icon: "Table",
    url: "/dashboard/spreadsheets",
    status: "active",
    category: "productivity",
    color: "#059669"
  },
  {
    id: "docs",
    name: "Docs",
    description: "Word alternative with rich text editing and collaboration",
    icon: "FileEdit",
    url: "/docs",
    status: "active",
    category: "productivity",
    color: "#0284C7"
  },
  {
    id: "drive",
    name: "Drive",
    description: "Cloud storage with 50GB free storage",
    icon: "Folder",
    url: "/drive",
    status: "active",
    category: "productivity",
    color: "#DC2626"
  },
  {
    id: "slides",
    name: "Slides",
    description: "PowerPoint alternative with themes and collaboration",
    icon: "Presentation",
    url: "/slides",
    status: "active",
    category: "productivity",
    color: "#EA4335"
  },
  {
    id: "meet",
    name: "Meet",
    description: "Video conferencing with screen sharing and recording",
    icon: "Video",
    url: "/meet",
    status: "active",
    category: "productivity",
    color: "#4285F4"
  },
  {
    id: "pdf",
    name: "PDF Tools",
    description: "PDF reader, editor, merge, split, compress, and convert",
    icon: "FileText",
    url: "/pdf",
    status: "active",
    category: "productivity",
    color: "#DC2626"
  },
  
  // Industry Modules
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Order management, menu, kitchen display, and reservations",
    icon: "UtensilsCrossed",
    url: "/dashboard/industries/restaurant/orders",
    status: "active",
    category: "industry",
    color: "#EF4444"
  },
  {
    id: "retail",
    name: "Retail",
    description: "POS system, inventory, multi-location, and loyalty programs",
    icon: "Store",
    url: "/dashboard/industries/retail/products",
    status: "active",
    category: "industry",
    color: "#F97316"
  },
  {
    id: "service",
    name: "Service Businesses",
    description: "Project management, time tracking, and client invoicing",
    icon: "Wrench",
    url: "/dashboard/projects",
    status: "active",
    category: "industry",
    color: "#3B82F6"
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Multi-channel selling, fulfillment, and order management",
    icon: "ShoppingBag",
    url: "/dashboard/ecommerce/channels",
    status: "active",
    category: "industry",
    color: "#10B981"
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Production tracking, scheduling, and quality control",
    icon: "Factory",
    url: "/dashboard/industries/manufacturing/production-orders",
    status: "active",
    category: "industry",
    color: "#6366F1"
  },
  {
    id: "field-service",
    name: "Field Service",
    description: "Work order management, GPS tracking, scheduling, and service history",
    icon: "Wrench",
    url: "/dashboard/field-service/work-orders",
    status: "active",
    category: "industry",
    color: "#F59E0B"
  },
  {
    id: "asset-management",
    name: "Asset Management",
    description: "Asset tracking, depreciation, maintenance scheduling, and lifecycle management",
    icon: "Package",
    url: "/dashboard/asset-management/assets",
    status: "active",
    category: "industry",
    color: "#06B6D4"
  },
  {
    id: "compliance",
    name: "Compliance & Legal",
    description: "GDPR compliance, data privacy, legal document templates, and compliance tracking",
    icon: "ShieldCheck",
    url: "/dashboard/compliance/records",
    status: "active",
    category: "core",
    color: "#10B981"
  },
  {
    id: "lms",
    name: "Learning Management System",
    description: "Course management, employee training, certifications, and progress tracking",
    icon: "GraduationCap",
    url: "/dashboard/lms/courses",
    status: "active",
    category: "core",
    color: "#8B5CF6"
  },
  {
    id: "professional-services",
    name: "Professional Services",
    description: "Project management, resource planning, and time tracking",
    icon: "BriefcaseBusiness",
    url: "/dashboard/projects",
    status: "active",
    category: "industry",
    color: "#8B5CF6"
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    description: "Patient management, prescriptions, and lab test tracking",
    icon: "Heart",
    url: "/dashboard/industries/healthcare/prescriptions",
    status: "active",
    category: "industry",
    color: "#EC4899"
  },
  {
    id: "education",
    name: "Education & Training",
    description: "Student management, courses, enrollments, and attendance",
    icon: "GraduationCap",
    url: "/dashboard/industries/education/students",
    status: "active",
    category: "industry",
    color: "#14B8A6"
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Property management, leads, site visits, and documents",
    icon: "Home",
    url: "/dashboard/industries/real-estate/leads",
    status: "active",
    category: "industry",
    color: "#F59E0B"
  },
  {
    id: "logistics",
    name: "Logistics & Transportation",
    description: "Shipment tracking, route management, and vehicle fleet",
    icon: "Truck",
    url: "/dashboard/industries/logistics/shipments",
    status: "active",
    category: "industry",
    color: "#06B6D4"
  },
  {
    id: "agriculture",
    name: "Agriculture & Farming",
    description: "Crop management, inputs, mandi prices, and harvest tracking",
    icon: "Sprout",
    url: "/dashboard/industries/agriculture/crops",
    status: "active",
    category: "industry",
    color: "#84CC16"
  },
  {
    id: "construction",
    name: "Construction & Contracting",
    description: "Project management, materials, labor, and milestones",
    icon: "Hammer",
    url: "/dashboard/industries/construction/projects",
    status: "active",
    category: "industry",
    color: "#F97316"
  },
  {
    id: "beauty",
    name: "Beauty & Wellness",
    description: "Appointment scheduling, services, and membership management",
    icon: "Scissors",
    url: "/dashboard/industries/beauty/appointments",
    status: "active",
    category: "industry",
    color: "#EC4899"
  },
  {
    id: "automotive",
    name: "Automotive & Repair",
    description: "Vehicle management, job cards, and service history",
    icon: "Car",
    url: "/dashboard/industries/automotive/job-cards",
    status: "active",
    category: "industry",
    color: "#3B82F6"
  },
  {
    id: "hospitality",
    name: "Hospitality & Hotels",
    description: "Room management, bookings, check-in/out, and housekeeping",
    icon: "Building2",
    url: "/dashboard/industries/hospitality/bookings",
    status: "active",
    category: "industry",
    color: "#8B5CF6"
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Case management, court dates, documents, and billable hours",
    icon: "Scale",
    url: "/dashboard/industries/legal/cases",
    status: "active",
    category: "industry",
    color: "#6366F1"
  },
  {
    id: "financial-services",
    name: "Financial Services",
    description: "Tax filings, compliance tracking, and advisory services",
    icon: "TrendingUp",
    url: "/dashboard/industries/financial/tax-filings",
    status: "active",
    category: "industry",
    color: "#10B981"
  },
  {
    id: "events",
    name: "Event Management",
    description: "Event planning, vendor management, and guest management",
    icon: "Calendar",
    url: "/dashboard/industries/events/events",
    status: "active",
    category: "industry",
    color: "#F59E0B"
  },
  {
    id: "wholesale",
    name: "Wholesale & Distribution",
    description: "Customer management, tiered pricing, and credit limits",
    icon: "PackageSearch",
    url: "/dashboard/industries/wholesale/customers",
    status: "active",
    category: "industry",
    color: "#14B8A6"
  }
];

// Cache for loaded icons
let iconCache: Record<string, any> = {};

export const getModuleIcon = async (iconName: string): Promise<any> => {
  // If already cached, return it
  if (iconCache[iconName]) {
    return iconCache[iconName];
  }

  // Lazy load icons only on client side
  if (typeof window === 'undefined') {
    // Return a simple placeholder function during SSR
    // This will be replaced once the icon loads on client
    return function PlaceholderIcon() {
      return null;
    };
  }

  // Dynamically import lucide-react icons
  const iconMap: Record<string, string> = {
    Users: 'Users',
    DollarSign: 'DollarSign',
    IndianRupee: 'IndianRupee',
    ShoppingCart: 'ShoppingCart',
    Megaphone: 'Megaphone',
    Briefcase: 'Briefcase',
    MessageSquare: 'MessageSquare',
    Sparkles: 'Sparkles',
    Lightbulb: 'Lightbulb',
    Globe: 'Globe',
    Palette: 'Palette',
    BookOpen: 'BookOpen',
    BarChart3: 'BarChart3',
    FileText: 'FileText',
    Calculator: 'Calculator',
    Package: 'Package',
    Table: 'Table',
    FileEdit: 'FileEdit',
    Folder: 'Folder',
    Presentation: 'Presentation',
    Video: 'Video',
    UtensilsCrossed: 'UtensilsCrossed',
    Store: 'Store',
    Wrench: 'Wrench',
    ShoppingBag: 'ShoppingBag',
    Factory: 'Factory',
    BriefcaseBusiness: 'BriefcaseBusiness',
    Heart: 'Heart',
    GraduationCap: 'GraduationCap',
    Home: 'Home',
    Truck: 'Truck',
    Sprout: 'Sprout',
    Hammer: 'Hammer',
    Scissors: 'Scissors',
    Car: 'Car',
    Building2: 'Building2',
    Scale: 'Scale',
    TrendingUp: 'TrendingUp',
     Calendar: 'Calendar',
     PackageSearch: 'PackageSearch',
     GitBranch: 'GitBranch',
     Newspaper: 'Newspaper',
   };

  const iconKey = iconMap[iconName] || 'Users';
  
  try {
    const lucideReact = await import('lucide-react');
    const Icon = lucideReact[iconKey as keyof typeof lucideReact];
    if (Icon) {
      iconCache[iconName] = Icon;
      return Icon;
    }
  } catch (error) {
    console.error('Failed to load icon:', iconName, error);
  }
  
  // Fallback
  const lucideReact = await import('lucide-react');
  iconCache[iconName] = lucideReact.Users;
  return lucideReact.Users;
};

export const getModulesByCategory = (): {
  core: typeof modules;
  productivity: typeof modules;
  ai: typeof modules;
} => {
  return {
    core: modules.filter(m => m.category === "core"),
    productivity: modules.filter(m => m.category === "productivity"),
    // Note: Industries are NOT modules - they are industry configurations
    // Industry-specific features are enabled through industry packages, not separate modules
    ai: modules.filter(m => m.category === "ai")
  };
};

