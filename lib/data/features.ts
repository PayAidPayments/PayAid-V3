export interface CaseStudy {
  company: string
  industry: string
  challenge: string
  solution: string
  results: string[]
  quote?: string
}

export interface Feature {
  slug: string
  title: string
  category: 'ai-service' | 'module' | 'industry'
  description: string
  longDescription: string
  benefits: string[]
  keyFeatures: string[]
  useCases: string[]
  caseStudies: CaseStudy[]
  icon?: string
  image?: string
}

export const features: Feature[] = [
  // AI Services
  {
    slug: 'conversational-ai',
    title: 'Conversational AI',
    category: 'ai-service',
    description: 'Build multilingual, context-aware chatbots for web, WhatsApp, apps, or voice. Turn conversations into conversions with intelligent lead qualification and automated customer support.',
    longDescription: 'PayAid\'s Conversational AI transforms how you interact with customers. Our advanced AI chatbots understand context, speak multiple languages, and seamlessly integrate across web, WhatsApp, mobile apps, and voice channels. Whether it\'s qualifying leads, answering FAQs, or providing 24/7 customer support, our AI ensures every conversation drives value.',
    benefits: [
      '24/7 automated customer support',
      'Multilingual support for Indian languages',
      'Intelligent lead qualification',
      'Reduced response time from hours to seconds',
      'Seamless integration across all channels'
    ],
    keyFeatures: [
      'Natural language understanding',
      'Context-aware conversations',
      'Multi-channel deployment',
      'Lead scoring and qualification',
      'CRM integration',
      'Analytics and insights'
    ],
    useCases: [
      'Website chatbot for instant customer support',
      'WhatsApp business automation',
      'Lead qualification and nurturing',
      'FAQ automation',
      'Order tracking and updates',
      'Appointment scheduling'
    ],
    caseStudies: [
      {
        company: 'TechMart India',
        industry: 'E-Commerce',
        challenge: 'High volume of customer inquiries during peak hours, leading to delayed responses and lost sales.',
        solution: 'Implemented PayAid Conversational AI on their website and WhatsApp, handling 80% of inquiries automatically.',
        results: [
          '70% reduction in response time',
          '45% increase in lead conversion',
          '24/7 customer support without additional staff',
          '₹2.5L saved annually on customer support costs'
        ],
        quote: 'PayAid\'s chatbot handles 80% of our customer queries instantly. Our sales have increased by 45% since implementation.'
      },
      {
        company: 'Delhi Dental Care',
        industry: 'Healthcare',
        challenge: 'Patients calling for appointments during non-business hours, leading to missed bookings.',
        solution: 'Deployed WhatsApp chatbot for appointment scheduling and reminders.',
        results: [
          '90% appointment booking rate',
          '50% reduction in no-shows',
          'Automated reminders in Hindi and English',
          '30% increase in patient satisfaction'
        ]
      }
    ]
  },
  {
    slug: 'agentic-workflow-automation',
    title: 'Agentic Workflow Automation',
    category: 'ai-service',
    description: 'Deploy smart AI agents to automate email parsing, form-filling, document review, and tasks in real time. Reduce manual work and accelerate business processes.',
    longDescription: 'Our Agentic Workflow Automation uses intelligent AI agents that understand context and make decisions autonomously. These agents can parse emails, extract data, fill forms, review documents, and execute complex workflows—all without human intervention. Perfect for businesses looking to eliminate repetitive tasks and focus on strategic work.',
    benefits: [
      '80% reduction in manual data entry',
      'Real-time document processing',
      'Automated form filling and submission',
      'Intelligent email parsing and routing',
      'Error-free data extraction'
    ],
    keyFeatures: [
      'Intelligent document parsing',
      'Automated form filling',
      'Email processing and routing',
      'Data extraction and validation',
      'Workflow orchestration',
      'Integration with existing systems'
    ],
    useCases: [
      'Invoice processing automation',
      'Customer onboarding automation',
      'Document verification',
      'Email to CRM automation',
      'Form submission automation',
      'Data migration and entry'
    ],
    caseStudies: [
      {
        company: 'FinCorp Services',
        industry: 'Financial Services',
        challenge: 'Manual processing of 500+ invoices monthly, taking 40+ hours and prone to errors.',
        solution: 'Implemented agentic workflow automation for invoice processing and data entry.',
        results: [
          '95% time reduction in invoice processing',
          'Zero data entry errors',
          'Real-time invoice approval workflow',
          '₹5L saved annually on processing costs'
        ],
        quote: 'What used to take 40 hours now takes 2 hours. The AI agents handle everything perfectly.'
      }
    ]
  },
  {
    slug: 'knowledge-rag-ai',
    title: 'Knowledge & RAG AI',
    category: 'ai-service',
    description: 'Ask questions from your documents or SOPs and get instant, cited answers via intelligent retrieval. Transform your knowledge base into a searchable AI assistant with full audit trails.',
    longDescription: 'PayAid\'s Knowledge & RAG (Retrieval-Augmented Generation) AI transforms your documents, SOPs, and knowledge base into an intelligent assistant. Ask questions in natural language and get accurate, cited answers instantly. Perfect for training new employees, customer support, and ensuring consistent information access across your organization.',
    benefits: [
      'Instant answers from your documents',
      'Source citations for every answer',
      'Full audit trail of queries',
      'Multi-document search',
      'Secure knowledge management'
    ],
    keyFeatures: [
      'Document upload and processing',
      'Intelligent semantic search',
      'Citation and source tracking',
      'Query audit trails',
      'Multi-format support (PDF, DOCX, TXT)',
      'Secure cloud storage'
    ],
    useCases: [
      'Employee onboarding and training',
      'Customer support knowledge base',
      'SOP and policy queries',
      'Product documentation search',
      'Compliance and legal document search',
      'Technical documentation access'
    ],
    caseStudies: [
      {
        company: 'EduTech Solutions',
        industry: 'Education Technology',
        challenge: 'New employees taking weeks to learn company processes and policies from scattered documents.',
        solution: 'Created a centralized knowledge base with RAG AI for instant answers to employee questions.',
        results: [
          '60% reduction in onboarding time',
          '90% of questions answered instantly',
          'Consistent information across teams',
          'Reduced training costs by 40%'
        ]
      }
    ]
  },
  {
    slug: 'ai-cofounder',
    title: 'AI Co-founder',
    category: 'ai-service',
    description: 'Your strategic business partner with 22 specialist agents. Get business insights, recommendations, and execute actions automatically. From idea to IPO, guided by AI.',
    longDescription: 'The AI Co-founder is your strategic business partner powered by 22 specialist AI agents. Each agent is an expert in their domain—finance, sales, marketing, operations, legal, and more. Get strategic insights, actionable recommendations, and automated execution. Whether you\'re starting out or scaling up, your AI Co-founder guides you every step of the way.',
    benefits: [
      '22 specialist AI agents at your service',
      'Strategic business insights',
      'Automated action execution',
      'Data-driven recommendations',
      '24/7 business intelligence'
    ],
    keyFeatures: [
      'Finance specialist agent',
      'Sales and marketing agents',
      'Operations and logistics agents',
      'Legal and compliance agents',
      'HR and recruitment agents',
      'Analytics and insights agents'
    ],
    useCases: [
      'Business strategy planning',
      'Financial analysis and forecasting',
      'Sales pipeline optimization',
      'Marketing campaign planning',
      'Operational efficiency analysis',
      'Risk assessment and mitigation'
    ],
    caseStudies: [
      {
        company: 'StartupHub Ventures',
        industry: 'Startup Accelerator',
        challenge: 'Early-stage startups lacking expertise in finance, legal, and operations.',
        solution: 'Provided AI Co-founder access to all portfolio companies for strategic guidance.',
        results: [
          '90% of startups made better decisions',
          '40% faster time to market',
          'Reduced need for expensive consultants',
          'Improved investor confidence'
        ],
        quote: 'The AI Co-founder is like having a C-suite team available 24/7. It\'s transformed how our startups operate.'
      }
    ]
  },
  {
    slug: 'ai-website-builder',
    title: 'AI Website Builder',
    category: 'ai-service',
    description: 'Create stunning websites and landing pages with AI-powered component generation. Build, customize, and deploy professional sites in minutes, not weeks.',
    longDescription: 'Build professional websites and landing pages in minutes with PayAid\'s AI Website Builder. Simply describe what you want, and our AI generates beautiful, responsive components. Customize colors, layouts, and content with ease. Deploy instantly with no coding required. Perfect for businesses that need professional web presence without the cost and time of traditional development.',
    benefits: [
      'Build websites in minutes, not weeks',
      'No coding required',
      'AI-powered component generation',
      'Mobile-responsive by default',
      'Instant deployment'
    ],
    keyFeatures: [
      'AI component generation',
      'Drag-and-drop editor',
      'Template library',
      'Custom domain support',
      'SEO optimization',
      'Analytics integration'
    ],
    useCases: [
      'Business website creation',
      'Landing page development',
      'Product showcase pages',
      'Event pages',
      'Portfolio websites',
      'Marketing campaign pages'
    ],
    caseStudies: [
      {
        company: 'LocalMart',
        industry: 'Retail',
        challenge: 'Needed a professional website but couldn\'t afford ₹50k+ for development.',
        solution: 'Built their entire website using PayAid AI Website Builder in 2 hours.',
        results: [
          'Website live in 2 hours',
          '₹50k saved on development',
          '40% increase in online inquiries',
          'Professional brand presence'
        ],
        quote: 'We went from no website to a professional site in 2 hours. Our customers love it!'
      }
    ]
  },
  {
    slug: 'ai-powered-insights',
    title: 'AI-Powered Insights',
    category: 'ai-service',
    description: 'Get intelligent business analysis, revenue insights, and risk warnings. Make data-driven decisions with AI that understands your business context.',
    longDescription: 'Transform your business data into actionable insights with PayAid\'s AI-Powered Insights. Our AI analyzes your sales, revenue, expenses, and operations to provide intelligent recommendations. Get early warnings about risks, identify opportunities, and make data-driven decisions. The AI understands your business context and provides personalized insights.',
    benefits: [
      'Intelligent business analysis',
      'Revenue forecasting',
      'Risk early warnings',
      'Opportunity identification',
      'Personalized recommendations'
    ],
    keyFeatures: [
      'Revenue trend analysis',
      'Expense pattern recognition',
      'Sales pipeline insights',
      'Risk assessment',
      'Opportunity scoring',
      'Customizable dashboards'
    ],
    useCases: [
      'Revenue forecasting',
      'Expense optimization',
      'Sales performance analysis',
      'Risk management',
      'Market opportunity identification',
      'Business health monitoring'
    ],
    caseStudies: [
      {
        company: 'GrowthCorp',
        industry: 'Consulting',
        challenge: 'Making sense of complex business data to identify growth opportunities.',
        solution: 'Implemented AI-Powered Insights for automated business analysis and recommendations.',
        results: [
          '30% improvement in decision-making speed',
          'Identified ₹20L in new opportunities',
          'Early risk detection prevented losses',
          'Data-driven strategy increased revenue by 25%'
        ]
      }
    ]
  },
  // Business Modules
  {
    slug: 'all-in-one-platform',
    title: 'All-in-One Platform',
    category: 'module',
    description: 'Comprehensive Management: Manage your CRM, Invoicing, Inventory, HR, Payments, and Accounting seamlessly within a single platform.',
    longDescription: 'PayAid is the complete business operating system that brings all your business functions under one roof. No more switching between multiple tools, no data silos, no integration headaches. Everything you need—CRM, invoicing, inventory, HR, payments, accounting, and more—works seamlessly together.',
    benefits: [
      'Single source of truth for all business data',
      'No data silos or integration issues',
      'Unified dashboard for all operations',
      'Reduced software costs',
      'Improved team collaboration'
    ],
    keyFeatures: [
      'Integrated CRM and sales',
      'Complete invoicing system',
      'Inventory management',
      'HR and payroll',
      'Accounting and finance',
      'Payment processing'
    ],
    useCases: [
      'Small business management',
      'Multi-location operations',
      'Growing startups',
      'Service businesses',
      'E-commerce operations',
      'Retail management'
    ],
    caseStudies: [
      {
        company: 'Mumbai Retail Chain',
        industry: 'Retail',
        challenge: 'Using 8 different software tools, spending ₹25k/month and wasting 20 hours/week switching between tools.',
        solution: 'Migrated to PayAid all-in-one platform, consolidating all operations.',
        results: [
          '₹20k/month saved on software costs',
          '15 hours/week saved on tool switching',
          'Unified view of all operations',
          '50% improvement in team productivity'
        ],
        quote: 'PayAid replaced 8 tools with one. We save ₹20k/month and our team is 50% more productive.'
      }
    ]
  },
  {
    slug: 'made-for-indian-businesses',
    title: 'Made for Indian Businesses',
    category: 'module',
    description: 'Tailored Solutions: PayAid is specifically designed to address the unique challenges and requirements of Indian businesses.',
    longDescription: 'PayAid is built specifically for Indian businesses. We understand GST compliance, Indian payment methods, local business practices, and regional requirements. Our platform supports Hindi and regional languages, integrates with Indian payment gateways, and ensures GST compliance out of the box.',
    benefits: [
      'GST compliance built-in',
      'Indian payment gateway integration',
      'Multi-language support (Hindi, regional)',
      'Local business practices',
      'Indian customer support'
    ],
    keyFeatures: [
      'GST-compliant invoicing',
      'GSTR-1 and GSTR-3B reports',
      'Indian payment methods',
      'Hindi and regional language support',
      'Local business workflows',
      'Indian timezone support'
    ],
    useCases: [
      'GST-compliant businesses',
      'Multi-language operations',
      'Indian payment processing',
      'Regional business expansion',
      'Compliance management',
      'Local market operations'
    ],
    caseStudies: [
      {
        company: 'Delhi Trading Co.',
        industry: 'Trading',
        challenge: 'Struggling with GST compliance and filing, spending hours on manual calculations.',
        solution: 'Implemented PayAid with built-in GST compliance and automated filing.',
        results: [
          '100% GST compliance',
          'Automated GSTR filing',
          'Zero errors in GST returns',
          '10 hours/month saved on compliance'
        ]
      }
    ]
  },
  {
    slug: 'simple-easy-to-use',
    title: 'Simple & Easy to Use',
    category: 'module',
    description: 'User-Friendly Interface: Built for simplicity, PayAid ensures that anyone in your organization can use it effortlessly.',
    longDescription: 'PayAid is designed for simplicity. Our intuitive interface means anyone—from HR managers to sales teams—can use it without extensive training. Quick onboarding, minimal learning curve, and immediate productivity gains. Get your team up and running in days, not months.',
    benefits: [
      'Intuitive user interface',
      'Minimal training required',
      'Quick onboarding',
      'Accessible to all team members',
      'Immediate productivity'
    ],
    keyFeatures: [
      'Simple navigation',
      'Contextual help',
      'Mobile-friendly design',
      'Role-based access',
      'Customizable dashboards',
      'In-app tutorials'
    ],
    useCases: [
      'Team onboarding',
      'Multi-user environments',
      'Non-technical teams',
      'Quick deployment',
      'Training reduction',
      'User adoption'
    ],
    caseStudies: [
      {
        company: 'ServicePro',
        industry: 'Professional Services',
        challenge: 'Team struggling with complex software, taking weeks to train new employees.',
        solution: 'Switched to PayAid for its simplicity and ease of use.',
        results: [
          '90% reduction in training time',
          'All team members productive in 1 day',
          'Zero support tickets for usability',
          '100% user adoption'
        ]
      }
    ]
  },
  {
    slug: 'ai-powered-intelligence',
    title: 'AI-Powered Intelligence',
    category: 'module',
    description: 'Every module is enhanced with AI capabilities. From smart lead scoring to automated invoice processing, AI works behind the scenes.',
    longDescription: 'AI isn\'t just a feature—it\'s integrated into every module. Smart lead scoring, automated invoice processing, intelligent inventory management, predictive analytics, and more. AI works behind the scenes to make your business operations smarter, faster, and more efficient.',
    benefits: [
      'AI in every module',
      'Automated workflows',
      'Intelligent recommendations',
      'Predictive analytics',
      'Reduced manual work'
    ],
    keyFeatures: [
      'Smart lead scoring',
      'Automated invoice processing',
      'Intelligent inventory management',
      'Predictive analytics',
      'Automated workflows',
      'AI-powered insights'
    ],
    useCases: [
      'Sales automation',
      'Invoice processing',
      'Inventory optimization',
      'Predictive maintenance',
      'Customer insights',
      'Workflow automation'
    ],
    caseStudies: [
      {
        company: 'TechSales India',
        industry: 'Sales',
        challenge: 'Manual lead qualification taking too long, missing hot leads.',
        solution: 'Implemented AI-powered lead scoring and automated qualification.',
        results: [
          '60% faster lead qualification',
          '35% increase in conversion rate',
          'Automated follow-ups',
          'Better lead prioritization'
        ]
      }
    ]
  },
  {
    slug: 'improved-efficiency',
    title: 'Improved Efficiency',
    category: 'module',
    description: 'Streamline workflows and enhance team productivity by integrating all business functions under one roof.',
    longDescription: 'PayAid eliminates the inefficiencies of using multiple disconnected tools. Streamline workflows, reduce data entry, automate processes, and give your team more time to focus on what matters. Start seeing productivity gains from day one.',
    benefits: [
      'Streamlined workflows',
      'Reduced data entry',
      'Automated processes',
      'Time savings',
      'Increased productivity'
    ],
    keyFeatures: [
      'Workflow automation',
      'Data synchronization',
      'Automated reporting',
      'Process optimization',
      'Time tracking',
      'Productivity analytics'
    ],
    useCases: [
      'Workflow optimization',
      'Process automation',
      'Time management',
      'Productivity improvement',
      'Resource optimization',
      'Efficiency tracking'
    ],
    caseStudies: [
      {
        company: 'EfficientCorp',
        industry: 'Manufacturing',
        challenge: 'Manual processes causing delays and inefficiencies.',
        solution: 'Implemented PayAid for workflow automation and process optimization.',
        results: [
          '40% reduction in process time',
          '30% increase in productivity',
          'Automated reporting saved 8 hours/week',
          'Improved team satisfaction'
        ]
      }
    ]
  },
  {
    slug: 'strong-security',
    title: 'Strong Security',
    category: 'module',
    description: '128-bit SSL encryption—the same high-security standard trusted by leading banks.',
    longDescription: 'Your business data is protected with bank-grade security. 128-bit SSL encryption, secure data centers, regular security audits, and compliance with industry standards. From login to every action, your data stays safe and secure.',
    benefits: [
      'Bank-grade security',
      'Data encryption',
      'Secure data centers',
      'Regular security audits',
      'Compliance standards'
    ],
    keyFeatures: [
      '128-bit SSL encryption',
      'Secure authentication',
      'Data backup and recovery',
      'Access controls',
      'Audit logs',
      'GDPR compliance'
    ],
    useCases: [
      'Data protection',
      'Compliance requirements',
      'Secure transactions',
      'Access control',
      'Audit requirements',
      'Data privacy'
    ],
    caseStudies: [
      {
        company: 'SecureFinance',
        industry: 'Financial Services',
        challenge: 'Need for bank-grade security for handling sensitive financial data.',
        solution: 'Implemented PayAid with its enterprise-grade security features.',
        results: [
          '100% security compliance',
          'Zero security incidents',
          'Client trust increased',
          'Regulatory approval obtained'
        ]
      }
    ]
  },
  // Industries
  {
    slug: 'restaurants',
    title: 'Restaurants',
    category: 'industry',
    description: 'No more operational headaches! With PayAid, handle online and offline orders, payment processing, inventory tracking, and staff scheduling from one dashboard.',
    longDescription: 'PayAid is the complete solution for restaurants. Manage orders (online and offline), process payments, track inventory, schedule staff, handle reservations, and generate invoices—all from one dashboard. Perfect for restaurants, cafes, cloud kitchens, and food delivery businesses.',
    benefits: [
      'Unified order management',
      'Inventory tracking',
      'Staff scheduling',
      'Payment processing',
      'Reservation management'
    ],
    keyFeatures: [
      'Order management system',
      'Kitchen display system',
      'Table management',
      'Reservation system',
      'Menu management',
      'Inventory tracking'
    ],
    useCases: [
      'Restaurant operations',
      'Cafe management',
      'Cloud kitchen operations',
      'Food delivery',
      'Multi-location restaurants',
      'Event catering'
    ],
    caseStudies: [
      {
        company: 'Spice Garden Restaurant',
        industry: 'Restaurant',
        challenge: 'Managing orders from multiple channels (dine-in, online, delivery) causing confusion and delays.',
        solution: 'Implemented PayAid for unified order management and kitchen display system.',
        results: [
          '50% reduction in order processing time',
          'Zero order errors',
          '30% increase in table turnover',
          'Improved customer satisfaction'
        ],
        quote: 'PayAid transformed our operations. Orders flow seamlessly from all channels to the kitchen.'
      },
      {
        company: 'QuickBite Cloud Kitchen',
        industry: 'Food Delivery',
        challenge: 'Managing inventory and orders across 3 kitchen locations manually.',
        solution: 'Deployed PayAid for multi-location inventory and order management.',
        results: [
          'Real-time inventory across locations',
          'Automated order routing',
          '40% reduction in food waste',
          'Centralized reporting'
        ]
      }
    ]
  },
  {
    slug: 'retail-stores',
    title: 'Retail Stores',
    category: 'industry',
    description: 'Manage your leads, assign sales targets and close more deals. Multi-location inventory management, customer loyalty programs, point of sale systems, and centralized analytics.',
    longDescription: 'PayAid empowers retail stores with complete POS, inventory, CRM, and analytics. Manage multiple locations, track inventory in real-time, run loyalty programs, process payments, and get insights into sales performance—all from one platform.',
    benefits: [
      'Multi-location management',
      'Real-time inventory',
      'POS system',
      'Customer loyalty programs',
      'Centralized analytics'
    ],
    keyFeatures: [
      'Point of sale (POS)',
      'Inventory management',
      'Customer management',
      'Loyalty programs',
      'Multi-location support',
      'Sales analytics'
    ],
    useCases: [
      'Retail stores',
      'Multi-location retail',
      'Fashion stores',
      'Electronics retail',
      'Grocery stores',
      'Specialty retail'
    ],
    caseStudies: [
      {
        company: 'Fashion Forward',
        industry: 'Retail',
        challenge: 'Managing inventory across 5 store locations manually, leading to stockouts and overstocking.',
        solution: 'Implemented PayAid for multi-location inventory management and POS.',
        results: [
          'Real-time inventory visibility',
          '30% reduction in stockouts',
          '20% reduction in excess inventory',
          'Unified customer database'
        ],
        quote: 'We can see inventory across all stores in real-time. Stockouts are a thing of the past.'
      }
    ]
  },
  {
    slug: 'service-businesses',
    title: 'Service Businesses',
    category: 'industry',
    description: 'Keep a track of all the transactions happening in your business. Project management, client invoicing, team scheduling, expense tracking, and profitability analysis in real-time.',
    longDescription: 'PayAid is perfect for service businesses—consulting, agencies, freelancers, and professional services. Manage projects, track time, invoice clients, manage expenses, and analyze profitability—all in one place.',
    benefits: [
      'Project management',
      'Time tracking',
      'Client invoicing',
      'Expense tracking',
      'Profitability analysis'
    ],
    keyFeatures: [
      'Project tracking',
      'Time logging',
      'Client management',
      'Invoice generation',
      'Expense management',
      'Profitability reports'
    ],
    useCases: [
      'Consulting firms',
      'Marketing agencies',
      'IT services',
      'Freelancers',
      'Professional services',
      'Service providers'
    ],
    caseStudies: [
      {
        company: 'DesignStudio Agency',
        industry: 'Creative Agency',
        challenge: 'Tracking time and expenses across multiple client projects manually.',
        solution: 'Implemented PayAid for project management, time tracking, and invoicing.',
        results: [
          'Accurate time tracking',
          'Automated invoicing',
          'Real-time project profitability',
          '30% faster client billing'
        ]
      }
    ]
  },
  {
    slug: 'ecommerce-platforms',
    title: 'E-Commerce Platforms',
    category: 'industry',
    description: 'Manage projects, assign tasks and never miss a project timeline. Multi-channel selling, inventory synchronization, order management, fulfillment tracking, and customer insights.',
    longDescription: 'PayAid helps e-commerce businesses manage everything from inventory to customer relationships. Sync inventory across channels, manage orders, track fulfillment, analyze customer behavior, and grow your online business.',
    benefits: [
      'Multi-channel management',
      'Inventory synchronization',
      'Order management',
      'Fulfillment tracking',
      'Customer insights'
    ],
    keyFeatures: [
      'Multi-channel integration',
      'Inventory sync',
      'Order management',
      'Fulfillment tracking',
      'Customer analytics',
      'Marketing automation'
    ],
    useCases: [
      'Online stores',
      'Multi-channel sellers',
      'Dropshipping',
      'Marketplace sellers',
      'E-commerce brands',
      'Online retailers'
    ],
    caseStudies: [
      {
        company: 'ShopIndia Online',
        industry: 'E-Commerce',
        challenge: 'Managing inventory and orders across Amazon, Flipkart, and own website separately.',
        solution: 'Implemented PayAid for unified multi-channel management.',
        results: [
          'Unified inventory management',
          'Automated order processing',
          'Real-time stock updates',
          '50% reduction in overselling'
        ]
      }
    ]
  },
  {
    slug: 'manufacturing',
    title: 'Manufacturing',
    category: 'industry',
    description: 'Production tracking, supplier management, quality control, logistics optimization, and compliance reporting—all streamlined in one platform.',
    longDescription: 'PayAid streamlines manufacturing operations from production to delivery. Track production orders, manage suppliers, ensure quality control, optimize logistics, and maintain compliance—all from one integrated platform.',
    benefits: [
      'Production tracking',
      'Supplier management',
      'Quality control',
      'Logistics optimization',
      'Compliance reporting'
    ],
    keyFeatures: [
      'Production order management',
      'Bill of materials (BOM)',
      'Supplier management',
      'Quality control',
      'Inventory management',
      'Compliance tracking'
    ],
    useCases: [
      'Manufacturing units',
      'Production facilities',
      'Assembly operations',
      'Quality control',
      'Supply chain management',
      'Compliance management'
    ],
    caseStudies: [
      {
        company: 'Precision Manufacturing',
        industry: 'Manufacturing',
        challenge: 'Tracking production orders and materials across multiple production lines manually.',
        solution: 'Implemented PayAid for production tracking and material management.',
        results: [
          'Real-time production visibility',
          'Automated material tracking',
          '30% reduction in production delays',
          'Improved quality control'
        ]
      }
    ]
  },
  {
    slug: 'professional-services',
    title: 'Professional Services',
    category: 'industry',
    description: 'Client project management, team collaboration, resource planning, time tracking, and invoice automation—all in one place.',
    longDescription: 'PayAid is built for professional services firms. Manage client relationships, track projects, plan resources, log time, and automate invoicing. Perfect for law firms, accounting firms, consulting, and other professional services.',
    benefits: [
      'Client management',
      'Project tracking',
      'Resource planning',
      'Time tracking',
      'Automated invoicing'
    ],
    keyFeatures: [
      'Client relationship management',
      'Project management',
      'Time and expense tracking',
      'Resource allocation',
      'Invoice automation',
      'Profitability analysis'
    ],
    useCases: [
      'Law firms',
      'Accounting firms',
      'Consulting services',
      'Architecture firms',
      'Engineering services',
      'Professional services'
    ],
    caseStudies: [
      {
        company: 'LegalEdge Law Firm',
        industry: 'Legal Services',
        challenge: 'Tracking billable hours and generating invoices manually for 50+ clients.',
        solution: 'Implemented PayAid for time tracking and automated invoicing.',
        results: [
          'Accurate billable hour tracking',
          'Automated invoice generation',
          '40% faster billing cycle',
          'Improved cash flow'
        ]
      }
    ]
  }
]

export function getFeatureBySlug(slug: string): Feature | undefined {
  return features.find(f => f.slug === slug)
}

export function getFeaturesByCategory(category: 'ai-service' | 'module' | 'industry'): Feature[] {
  return features.filter(f => f.category === category)
}

