/**
 * Industry-Specific Pipeline Templates
 * Pre-configured templates for ALL 23 supported industries
 * Complete coverage: Fintech, D2C, Agencies, Retail, Manufacturing, Real Estate, Healthcare,
 * Professional Services, Restaurant, E-commerce, Education, Logistics, Construction, Beauty,
 * Automotive, Hospitality, Legal, Financial Services, Event Management, Wholesale, Agriculture,
 * Freelancer, Service Business
 */

export interface PipelineStage {
  id: string
  name: string
  order: number
  probability: number
  description?: string
}

export interface CustomFieldDefinition {
  name: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'
  isRequired: boolean
  options?: string[]
  defaultValue?: string
  description?: string
}

export interface IndustryTemplate {
  id: string
  name: string
  industry: 'fintech' | 'd2c' | 'agencies' | 'retail' | 'manufacturing' | 'real-estate' | 'healthcare' | 'professional-services' | 'construction' | 'education' | 'restaurant' | 'logistics' | 'beauty' | 'automotive' | 'hospitality' | 'legal' | 'wholesale' | 'event-management'
  description: string
  stages: PipelineStage[]
  customFields: CustomFieldDefinition[]
  dealSizeSignals?: {
    field: string
    operator: 'greater_than' | 'less_than' | 'equals'
    value: number
    tier: 'small' | 'medium' | 'large' | 'enterprise'
  }[]
}

/**
 * Fintech Pipeline Template
 */
export const FINTECH_TEMPLATE: IndustryTemplate = {
  id: 'fintech-template',
  name: 'Fintech Pipeline',
  industry: 'fintech',
  description: 'Optimized pipeline for fintech companies with compliance and payment volume tracking',
  stages: [
    {
      id: 'initial-interest',
      name: 'Initial Interest',
      order: 1,
      probability: 10,
      description: 'Lead has shown initial interest in our fintech solutions',
    },
    {
      id: 'compliance-review',
      name: 'Compliance Review',
      order: 2,
      probability: 25,
      description: 'Reviewing KYC, AML, and regulatory requirements',
    },
    {
      id: 'api-evaluation',
      name: 'API Evaluation',
      order: 3,
      probability: 50,
      description: 'Technical team evaluating API integration',
    },
    {
      id: 'pricing-discussion',
      name: 'Pricing Discussion',
      order: 4,
      probability: 70,
      description: 'Discussing pricing model and payment terms',
    },
    {
      id: 'contract-negotiation',
      name: 'Contract Negotiation',
      order: 5,
      probability: 85,
      description: 'Finalizing contract terms and legal requirements',
    },
    {
      id: 'go-live',
      name: 'Go-Live',
      order: 6,
      probability: 100,
      description: 'Customer is live and processing transactions',
    },
  ],
  customFields: [
    {
      name: 'Payment Volume',
      fieldType: 'number',
      isRequired: false,
      description: 'Expected monthly transaction volume (₹)',
    },
    {
      name: 'Compliance Status',
      fieldType: 'select',
      isRequired: false,
      options: ['Not Started', 'In Progress', 'KYC Complete', 'AML Complete', 'Fully Compliant'],
      description: 'Current compliance status',
    },
    {
      name: 'Settlement Model',
      fieldType: 'select',
      isRequired: false,
      options: ['Daily', 'Weekly', 'Monthly', 'On-Demand'],
      description: 'Preferred settlement frequency',
    },
    {
      name: 'Tech Stack',
      fieldType: 'textarea',
      isRequired: false,
      description: 'Current payment system and tech stack',
    },
    {
      name: 'Regulatory Approvals',
      fieldType: 'select',
      isRequired: false,
      options: ['RBI', 'SEBI', 'IRDAI', 'None Required', 'Pending'],
      description: 'Required regulatory approvals',
    },
    {
      name: 'Go-Live Timeline',
      fieldType: 'date',
      isRequired: false,
      description: 'Target go-live date (urgency signal)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Payment Volume',
      operator: 'greater_than',
      value: 10000000, // ₹1 Cr
      tier: 'enterprise',
    },
    {
      field: 'Payment Volume',
      operator: 'greater_than',
      value: 1000000, // ₹10 Lakh
      tier: 'large',
    },
    {
      field: 'Payment Volume',
      operator: 'greater_than',
      value: 100000, // ₹1 Lakh
      tier: 'medium',
    },
  ],
}

/**
 * D2C Ecommerce Pipeline Template
 */
export const D2C_TEMPLATE: IndustryTemplate = {
  id: 'd2c-template',
  name: 'D2C Ecommerce Pipeline',
  industry: 'd2c',
  description: 'Optimized pipeline for D2C brands with inventory and fulfillment tracking',
  stages: [
    {
      id: 'store-discovery',
      name: 'Store Discovery',
      order: 1,
      probability: 10,
      description: 'Lead discovered our platform for D2C businesses',
    },
    {
      id: 'inventory-sync-test',
      name: 'Inventory Sync Test',
      order: 2,
      probability: 30,
      description: 'Testing inventory synchronization with their store',
    },
    {
      id: 'fulfillment-demo',
      name: 'Fulfillment Demo',
      order: 3,
      probability: 50,
      description: 'Demonstrating fulfillment and logistics features',
    },
    {
      id: 'pricing-discount-model',
      name: 'Pricing & Discount Model',
      order: 4,
      probability: 70,
      description: 'Discussing pricing plans and discount strategies',
    },
    {
      id: 'integration-setup',
      name: 'Integration Setup',
      order: 5,
      probability: 85,
      description: 'Setting up integrations with sales channels',
    },
    {
      id: 'training-launch',
      name: 'Training & Launch',
      order: 6,
      probability: 100,
      description: 'Team training and platform launch',
    },
  ],
  customFields: [
    {
      name: 'Monthly Revenue',
      fieldType: 'number',
      isRequired: false,
      description: 'Current monthly revenue (₹)',
    },
    {
      name: 'Inventory Size',
      fieldType: 'number',
      isRequired: false,
      description: 'Number of SKUs/products',
    },
    {
      name: 'Supplier Count',
      fieldType: 'number',
      isRequired: false,
      description: 'Number of suppliers/vendors',
    },
    {
      name: 'Sales Channels',
      fieldType: 'select',
      isRequired: false,
      options: ['Shopify', 'Instagram', 'Website', 'Amazon', 'Flipkart', 'Other'],
      description: 'Primary sales channels (can select multiple)',
    },
    {
      name: 'Fulfillment Method',
      fieldType: 'select',
      isRequired: false,
      options: ['Self-Hosted', '3PL', 'Hybrid', 'Planning'],
      description: 'Current fulfillment approach',
    },
    {
      name: 'Current Tools',
      fieldType: 'textarea',
      isRequired: false,
      description: 'Existing tools/platforms they are using',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Monthly Revenue',
      operator: 'greater_than',
      value: 5000000, // ₹50 Lakh
      tier: 'enterprise',
    },
    {
      field: 'Monthly Revenue',
      operator: 'greater_than',
      value: 500000, // ₹5 Lakh
      tier: 'large',
    },
    {
      field: 'Monthly Revenue',
      operator: 'greater_than',
      value: 50000, // ₹50k
      tier: 'medium',
    },
  ],
}

/**
 * Service Agency Pipeline Template
 */
export const AGENCIES_TEMPLATE: IndustryTemplate = {
  id: 'agencies-template',
  name: 'Service Agency Pipeline',
  industry: 'agencies',
  description: 'Optimized pipeline for service agencies with team and project tracking',
  stages: [
    {
      id: 'discovery-call',
      name: 'Discovery Call',
      order: 1,
      probability: 15,
      description: 'Initial discovery call to understand agency needs',
    },
    {
      id: 'process-mapping',
      name: 'Process Mapping',
      order: 2,
      probability: 35,
      description: 'Mapping current agency processes and workflows',
    },
    {
      id: 'demo',
      name: 'Demo',
      order: 3,
      probability: 55,
      description: 'Showing agency-specific workflow demo',
    },
    {
      id: 'team-pilot',
      name: 'Team Pilot',
      order: 4,
      probability: 75,
      description: '2-week trial with agency team',
    },
    {
      id: 'pricing-agreement',
      name: 'Pricing Agreement',
      order: 5,
      probability: 90,
      description: 'Finalizing pricing and team size agreement',
    },
    {
      id: 'full-rollout',
      name: 'Full Rollout',
      order: 6,
      probability: 100,
      description: 'Full team rollout and onboarding complete',
    },
  ],
  customFields: [
    {
      name: 'Team Size',
      fieldType: 'number',
      isRequired: false,
      description: 'Number of team members',
    },
    {
      name: 'Project Types',
      fieldType: 'select',
      isRequired: false,
      options: ['Web Development', 'Mobile App', 'Design', 'Consulting', 'Marketing', 'Other'],
      description: 'Types of projects they handle',
    },
    {
      name: 'Billing Model',
      fieldType: 'select',
      isRequired: false,
      options: ['Hourly', 'Project-Based', 'Retainer', 'Mixed'],
      description: 'Primary billing model',
    },
    {
      name: 'Current Tools',
      fieldType: 'textarea',
      isRequired: false,
      description: 'Current tools (Monday, Asana, spreadsheets, etc.)',
    },
    {
      name: 'Monthly Revenue per Team Member',
      fieldType: 'number',
      isRequired: false,
      description: 'Average revenue per team member (₹)',
    },
    {
      name: 'Client Retention Rate',
      fieldType: 'number',
      isRequired: false,
      description: 'Client retention rate (%)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Team Size',
      operator: 'greater_than',
      value: 20,
      tier: 'enterprise',
    },
    {
      field: 'Team Size',
      operator: 'greater_than',
      value: 10,
      tier: 'large',
    },
    {
      field: 'Team Size',
      operator: 'greater_than',
      value: 5,
      tier: 'medium',
    },
  ],
}

/**
 * Retail Pipeline Template
 */
export const RETAIL_TEMPLATE: IndustryTemplate = {
  id: 'retail-template',
  name: 'Retail Pipeline',
  industry: 'retail',
  description: 'Optimized pipeline for retail stores and chains with POS and inventory tracking',
  stages: [
    {
      id: 'store-visit',
      name: 'Store Visit / Inquiry',
      order: 1,
      probability: 10,
      description: 'Customer visited store or made inquiry',
    },
    {
      id: 'product-demo',
      name: 'Product Demo',
      order: 2,
      probability: 30,
      description: 'Product demonstration or trial',
    },
    {
      id: 'pricing-discussion',
      name: 'Pricing Discussion',
      order: 3,
      probability: 50,
      description: 'Discussing pricing and payment terms',
    },
    {
      id: 'inventory-check',
      name: 'Inventory Check',
      order: 4,
      probability: 70,
      description: 'Checking stock availability and delivery timeline',
    },
    {
      id: 'order-confirmation',
      name: 'Order Confirmation',
      order: 5,
      probability: 85,
      description: 'Order confirmed and payment received',
    },
    {
      id: 'delivery-complete',
      name: 'Delivery Complete',
      order: 6,
      probability: 100,
      description: 'Product delivered and customer satisfied',
    },
  ],
  customFields: [
    {
      name: 'Store Location',
      fieldType: 'text',
      isRequired: false,
      description: 'Physical store location',
    },
    {
      name: 'Product Category',
      fieldType: 'select',
      isRequired: false,
      options: ['Electronics', 'Clothing', 'Furniture', 'Groceries', 'Beauty', 'Books', 'Other'],
      description: 'Primary product category',
    },
    {
      name: 'Average Order Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Average order value (₹)',
    },
    {
      name: 'Payment Method',
      fieldType: 'select',
      isRequired: false,
      options: ['Cash', 'Card', 'UPI', 'Credit', 'EMI'],
      description: 'Preferred payment method',
    },
    {
      name: 'Delivery Preference',
      fieldType: 'select',
      isRequired: false,
      options: ['Store Pickup', 'Home Delivery', 'Express Delivery'],
      description: 'Delivery preference',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Average Order Value',
      operator: 'greater_than',
      value: 50000,
      tier: 'enterprise',
    },
    {
      field: 'Average Order Value',
      operator: 'greater_than',
      value: 10000,
      tier: 'large',
    },
    {
      field: 'Average Order Value',
      operator: 'greater_than',
      value: 2000,
      tier: 'medium',
    },
  ],
}

/**
 * Manufacturing Pipeline Template
 */
export const MANUFACTURING_TEMPLATE: IndustryTemplate = {
  id: 'manufacturing-template',
  name: 'Manufacturing Pipeline',
  industry: 'manufacturing',
  description: 'Optimized pipeline for manufacturing companies with production and quality tracking',
  stages: [
    {
      id: 'rfq-received',
      name: 'RFQ Received',
      order: 1,
      probability: 15,
      description: 'Request for Quotation received',
    },
    {
      id: 'quote-preparation',
      name: 'Quote Preparation',
      order: 2,
      probability: 35,
      description: 'Preparing detailed quote with production timeline',
    },
    {
      id: 'sample-approval',
      name: 'Sample Approval',
      order: 3,
      probability: 55,
      description: 'Sample production and customer approval',
    },
    {
      id: 'production-planning',
      name: 'Production Planning',
      order: 4,
      probability: 75,
      description: 'Production schedule and material procurement',
    },
    {
      id: 'production-in-progress',
      name: 'Production In Progress',
      order: 5,
      probability: 90,
      description: 'Manufacturing in progress with QC checks',
    },
    {
      id: 'delivery-complete',
      name: 'Delivery Complete',
      order: 6,
      probability: 100,
      description: 'Product delivered and payment received',
    },
  ],
  customFields: [
    {
      name: 'Production Volume',
      fieldType: 'number',
      isRequired: false,
      description: 'Production quantity/volume',
    },
    {
      name: 'Material Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Textile', 'Metal', 'Plastic', 'Food', 'Chemical', 'Electronics', 'Other'],
      description: 'Primary material type',
    },
    {
      name: 'Lead Time',
      fieldType: 'number',
      isRequired: false,
      description: 'Production lead time (days)',
    },
    {
      name: 'Quality Standards',
      fieldType: 'select',
      isRequired: false,
      options: ['ISO 9001', 'ISO 14001', 'FSSAI', 'BIS', 'Custom', 'None'],
      description: 'Required quality certifications',
    },
    {
      name: 'Payment Terms',
      fieldType: 'select',
      isRequired: false,
      options: ['Advance', 'Milestone', 'On Delivery', 'Net 30', 'Net 60'],
      description: 'Payment terms',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Production Volume',
      operator: 'greater_than',
      value: 10000,
      tier: 'enterprise',
    },
    {
      field: 'Production Volume',
      operator: 'greater_than',
      value: 1000,
      tier: 'large',
    },
    {
      field: 'Production Volume',
      operator: 'greater_than',
      value: 100,
      tier: 'medium',
    },
  ],
}

/**
 * Real Estate Pipeline Template
 */
export const REAL_ESTATE_TEMPLATE: IndustryTemplate = {
  id: 'real-estate-template',
  name: 'Real Estate Pipeline',
  industry: 'real-estate',
  description: 'Optimized pipeline for real estate agencies with property and client tracking',
  stages: [
    {
      id: 'lead-inquiry',
      name: 'Lead Inquiry',
      order: 1,
      probability: 10,
      description: 'Initial inquiry about property',
    },
    {
      id: 'property-viewing',
      name: 'Property Viewing',
      order: 2,
      probability: 30,
      description: 'Property site visit scheduled/completed',
    },
    {
      id: 'offer-submitted',
      name: 'Offer Submitted',
      order: 3,
      probability: 50,
      description: 'Buyer submitted offer',
    },
    {
      id: 'negotiation',
      name: 'Negotiation',
      order: 4,
      probability: 70,
      description: 'Price and terms negotiation',
    },
    {
      id: 'documentation',
      name: 'Documentation',
      order: 5,
      probability: 85,
      description: 'Legal documentation and verification',
    },
    {
      id: 'deal-closed',
      name: 'Deal Closed',
      order: 6,
      probability: 100,
      description: 'Property sold/rented and payment received',
    },
  ],
  customFields: [
    {
      name: 'Property Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Residential', 'Commercial', 'Industrial', 'Land', 'Plot'],
      description: 'Type of property',
    },
    {
      name: 'Property Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Property value (₹)',
    },
    {
      name: 'Location',
      fieldType: 'text',
      isRequired: false,
      description: 'Property location/address',
    },
    {
      name: 'Transaction Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Sale', 'Rent', 'Lease', 'PG/Hostel'],
      description: 'Transaction type',
    },
    {
      name: 'Financing Status',
      fieldType: 'select',
      isRequired: false,
      options: ['Cash', 'Home Loan', 'Bank Loan', 'Under Process'],
      description: 'Financing status',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Property Value',
      operator: 'greater_than',
      value: 10000000,
      tier: 'enterprise',
    },
    {
      field: 'Property Value',
      operator: 'greater_than',
      value: 5000000,
      tier: 'large',
    },
    {
      field: 'Property Value',
      operator: 'greater_than',
      value: 1000000,
      tier: 'medium',
    },
  ],
}

/**
 * Healthcare Pipeline Template
 */
export const HEALTHCARE_TEMPLATE: IndustryTemplate = {
  id: 'healthcare-template',
  name: 'Healthcare Pipeline',
  industry: 'healthcare',
  description: 'Optimized pipeline for healthcare providers with patient and appointment tracking',
  stages: [
    {
      id: 'patient-inquiry',
      name: 'Patient Inquiry',
      order: 1,
      probability: 20,
      description: 'Patient inquiry about services',
    },
    {
      id: 'appointment-scheduled',
      name: 'Appointment Scheduled',
      order: 2,
      probability: 40,
      description: 'Appointment booked',
    },
    {
      id: 'consultation',
      name: 'Consultation',
      order: 3,
      probability: 60,
      description: 'Consultation completed',
    },
    {
      id: 'treatment-plan',
      name: 'Treatment Plan',
      order: 4,
      probability: 75,
      description: 'Treatment plan created and discussed',
    },
    {
      id: 'treatment-in-progress',
      name: 'Treatment In Progress',
      order: 5,
      probability: 90,
      description: 'Treatment ongoing with follow-ups',
    },
    {
      id: 'treatment-complete',
      name: 'Treatment Complete',
      order: 6,
      probability: 100,
      description: 'Treatment completed and payment received',
    },
  ],
  customFields: [
    {
      name: 'Service Type',
      fieldType: 'select',
      isRequired: false,
      options: ['General Consultation', 'Specialist', 'Diagnostic', 'Surgery', 'Therapy', 'Dental', 'Other'],
      description: 'Type of healthcare service',
    },
    {
      name: 'Treatment Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Expected treatment duration (days)',
    },
    {
      name: 'Insurance Coverage',
      fieldType: 'select',
      isRequired: false,
      options: ['Yes', 'No', 'Partial', 'Under Process'],
      description: 'Insurance coverage status',
    },
    {
      name: 'Payment Method',
      fieldType: 'select',
      isRequired: false,
      options: ['Cash', 'Card', 'UPI', 'Insurance', 'EMI'],
      description: 'Payment method',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Treatment Duration',
      operator: 'greater_than',
      value: 30,
      tier: 'enterprise',
    },
    {
      field: 'Treatment Duration',
      operator: 'greater_than',
      value: 14,
      tier: 'large',
    },
    {
      field: 'Treatment Duration',
      operator: 'greater_than',
      value: 7,
      tier: 'medium',
    },
  ],
}

/**
 * Professional Services Pipeline Template
 */
export const PROFESSIONAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'professional-services-template',
  name: 'Professional Services Pipeline',
  industry: 'professional-services',
  description: 'Optimized pipeline for CA firms, legal practices, and consulting with client and project tracking',
  stages: [
    {
      id: 'client-inquiry',
      name: 'Client Inquiry',
      order: 1,
      probability: 15,
      description: 'Initial client inquiry about services',
    },
    {
      id: 'consultation',
      name: 'Consultation',
      order: 2,
      probability: 35,
      description: 'Initial consultation meeting',
    },
    {
      id: 'proposal',
      name: 'Proposal',
      order: 3,
      probability: 55,
      description: 'Service proposal submitted',
    },
    {
      id: 'contract-negotiation',
      name: 'Contract Negotiation',
      order: 4,
      probability: 75,
      description: 'Contract terms and pricing negotiation',
    },
    {
      id: 'service-delivery',
      name: 'Service Delivery',
      order: 5,
      probability: 90,
      description: 'Services being delivered',
    },
    {
      id: 'project-complete',
      name: 'Project Complete',
      order: 6,
      probability: 100,
      description: 'Project completed and payment received',
    },
  ],
  customFields: [
    {
      name: 'Service Type',
      fieldType: 'select',
      isRequired: false,
      options: ['CA Services', 'Legal', 'Consulting', 'Audit', 'Tax Filing', 'Compliance', 'Other'],
      description: 'Type of professional service',
    },
    {
      name: 'Project Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Expected project duration (days)',
    },
    {
      name: 'Billing Model',
      fieldType: 'select',
      isRequired: false,
      options: ['Hourly', 'Fixed', 'Retainer', 'Milestone'],
      description: 'Billing model',
    },
    {
      name: 'Client Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Individual', 'SME', 'Enterprise', 'Startup'],
      description: 'Client business type',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Project Duration',
      operator: 'greater_than',
      value: 90,
      tier: 'enterprise',
    },
    {
      field: 'Project Duration',
      operator: 'greater_than',
      value: 30,
      tier: 'large',
    },
    {
      field: 'Project Duration',
      operator: 'greater_than',
      value: 7,
      tier: 'medium',
    },
  ],
}

/**
 * Restaurant/Café Pipeline Template
 */
export const RESTAURANT_TEMPLATE: IndustryTemplate = {
  id: 'restaurant-template',
  name: 'Restaurant Pipeline',
  industry: 'restaurant',
  description: 'Optimized pipeline for restaurants and cafés with table management and order tracking',
  stages: [
    {
      id: 'inquiry',
      name: 'Inquiry',
      order: 1,
      probability: 15,
      description: 'Customer inquiry about catering or event booking',
    },
    {
      id: 'menu-discussion',
      name: 'Menu Discussion',
      order: 2,
      probability: 35,
      description: 'Discussing menu options and pricing',
    },
    {
      id: 'quote-submitted',
      name: 'Quote Submitted',
      order: 3,
      probability: 55,
      description: 'Quote submitted with menu and pricing',
    },
    {
      id: 'booking-confirmed',
      name: 'Booking Confirmed',
      order: 4,
      probability: 75,
      description: 'Event/booking confirmed with deposit',
    },
    {
      id: 'preparation',
      name: 'Preparation',
      order: 5,
      probability: 90,
      description: 'Food preparation and logistics in progress',
    },
    {
      id: 'event-complete',
      name: 'Event Complete',
      order: 6,
      probability: 100,
      description: 'Event completed and final payment received',
    },
  ],
  customFields: [
    {
      name: 'Event Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Catering', 'Private Party', 'Corporate Event', 'Wedding', 'Regular Customer', 'Other'],
      description: 'Type of event or service',
    },
    {
      name: 'Guest Count',
      fieldType: 'number',
      isRequired: false,
      description: 'Number of guests/attendees',
    },
    {
      name: 'Event Date',
      fieldType: 'date',
      isRequired: false,
      description: 'Event or booking date',
    },
    {
      name: 'Cuisine Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Indian', 'Chinese', 'Continental', 'Italian', 'Multi-Cuisine', 'Other'],
      description: 'Cuisine type',
    },
    {
      name: 'Payment Terms',
      fieldType: 'select',
      isRequired: false,
      options: ['Advance', 'On Event', 'Net 7', 'Net 15'],
      description: 'Payment terms',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Guest Count',
      operator: 'greater_than',
      value: 500,
      tier: 'enterprise',
    },
    {
      field: 'Guest Count',
      operator: 'greater_than',
      value: 100,
      tier: 'large',
    },
    {
      field: 'Guest Count',
      operator: 'greater_than',
      value: 25,
      tier: 'medium',
    },
  ],
}

/**
 * E-commerce Pipeline Template
 */
export const ECOMMERCE_TEMPLATE: IndustryTemplate = {
  id: 'ecommerce-template',
  name: 'E-commerce Pipeline',
  industry: 'ecommerce',
  description: 'Optimized pipeline for e-commerce businesses with marketplace and channel tracking',
  stages: [
    {
      id: 'store-inquiry',
      name: 'Store Inquiry',
      order: 1,
      probability: 10,
      description: 'Inquiry about e-commerce platform or services',
    },
    {
      id: 'platform-demo',
      name: 'Platform Demo',
      order: 2,
      probability: 30,
      description: 'Platform demonstration and feature walkthrough',
    },
    {
      id: 'integration-planning',
      name: 'Integration Planning',
      order: 3,
      probability: 50,
      description: 'Planning integrations with marketplaces and channels',
    },
    {
      id: 'pricing-agreement',
      name: 'Pricing Agreement',
      order: 4,
      probability: 70,
      description: 'Pricing and subscription plan agreed',
    },
    {
      id: 'setup-onboarding',
      name: 'Setup & Onboarding',
      order: 5,
      probability: 85,
      description: 'Store setup and team onboarding in progress',
    },
    {
      id: 'go-live',
      name: 'Go Live',
      order: 6,
      probability: 100,
      description: 'Store is live and processing orders',
    },
  ],
  customFields: [
    {
      name: 'Marketplace Channels',
      fieldType: 'select',
      isRequired: false,
      options: ['Amazon', 'Flipkart', 'Myntra', 'Shopify', 'WooCommerce', 'Custom Website', 'Multiple'],
      description: 'Primary sales channels',
    },
    {
      name: 'Monthly GMV',
      fieldType: 'number',
      isRequired: false,
      description: 'Monthly Gross Merchandise Value (₹)',
    },
    {
      name: 'Product Categories',
      fieldType: 'select',
      isRequired: false,
      options: ['Fashion', 'Electronics', 'Home & Kitchen', 'Beauty', 'Books', 'Food', 'Other'],
      description: 'Primary product categories',
    },
    {
      name: 'Order Volume',
      fieldType: 'number',
      isRequired: false,
      description: 'Average monthly orders',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Monthly GMV',
      operator: 'greater_than',
      value: 10000000,
      tier: 'enterprise',
    },
    {
      field: 'Monthly GMV',
      operator: 'greater_than',
      value: 1000000,
      tier: 'large',
    },
    {
      field: 'Monthly GMV',
      operator: 'greater_than',
      value: 100000,
      tier: 'medium',
    },
  ],
}

/**
 * Education Pipeline Template
 */
export const EDUCATION_TEMPLATE: IndustryTemplate = {
  id: 'education-template',
  name: 'Education Pipeline',
  industry: 'education',
  description: 'Optimized pipeline for schools and educational institutions with student and fee tracking',
  stages: [
    {
      id: 'inquiry',
      name: 'Inquiry',
      order: 1,
      probability: 20,
      description: 'Parent/student inquiry about admission',
    },
    {
      id: 'campus-visit',
      name: 'Campus Visit',
      order: 2,
      probability: 40,
      description: 'Campus tour and facility visit scheduled/completed',
    },
    {
      id: 'application',
      name: 'Application',
      order: 3,
      probability: 60,
      description: 'Application submitted with documents',
    },
    {
      id: 'assessment',
      name: 'Assessment',
      order: 4,
      probability: 75,
      description: 'Entrance test or assessment completed',
    },
    {
      id: 'admission-offer',
      name: 'Admission Offer',
      order: 5,
      probability: 90,
      description: 'Admission offer extended',
    },
    {
      id: 'enrolled',
      name: 'Enrolled',
      order: 6,
      probability: 100,
      description: 'Student enrolled and fees paid',
    },
  ],
  customFields: [
    {
      name: 'Education Level',
      fieldType: 'select',
      isRequired: false,
      options: ['Pre-School', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate', 'Vocational'],
      description: 'Education level',
    },
    {
      name: 'Course/Program',
      fieldType: 'text',
      isRequired: false,
      description: 'Course or program name',
    },
    {
      name: 'Annual Fee',
      fieldType: 'number',
      isRequired: false,
      description: 'Annual fee amount (₹)',
    },
    {
      name: 'Payment Plan',
      fieldType: 'select',
      isRequired: false,
      options: ['One-Time', 'Quarterly', 'Monthly', 'EMI'],
      description: 'Fee payment plan',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 500000,
      tier: 'enterprise',
    },
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 100000,
      tier: 'large',
    },
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 25000,
      tier: 'medium',
    },
  ],
}

/**
 * Logistics/Transportation Pipeline Template
 */
export const LOGISTICS_TEMPLATE: IndustryTemplate = {
  id: 'logistics-template',
  name: 'Logistics Pipeline',
  industry: 'logistics',
  description: 'Optimized pipeline for logistics and transportation companies with shipment tracking',
  stages: [
    {
      id: 'quote-request',
      name: 'Quote Request',
      order: 1,
      probability: 15,
      description: 'Customer requested shipping quote',
    },
    {
      id: 'quote-submitted',
      name: 'Quote Submitted',
      order: 2,
      probability: 35,
      description: 'Shipping quote submitted',
    },
    {
      id: 'booking-confirmed',
      name: 'Booking Confirmed',
      order: 3,
      probability: 55,
      description: 'Shipment booking confirmed',
    },
    {
      id: 'pickup-scheduled',
      name: 'Pickup Scheduled',
      order: 4,
      probability: 75,
      description: 'Pickup scheduled and vehicle assigned',
    },
    {
      id: 'in-transit',
      name: 'In Transit',
      order: 5,
      probability: 90,
      description: 'Shipment in transit with tracking',
    },
    {
      id: 'delivered',
      name: 'Delivered',
      order: 6,
      probability: 100,
      description: 'Shipment delivered and payment received',
    },
  ],
  customFields: [
    {
      name: 'Shipment Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Express', 'Standard', 'Freight', 'Cold Chain', 'Document', 'Parcel'],
      description: 'Type of shipment',
    },
    {
      name: 'Weight/Volume',
      fieldType: 'number',
      isRequired: false,
      description: 'Shipment weight (kg) or volume',
    },
    {
      name: 'Origin-Destination',
      fieldType: 'text',
      isRequired: false,
      description: 'Origin to destination route',
    },
    {
      name: 'Service Level',
      fieldType: 'select',
      isRequired: false,
      options: ['Same Day', 'Next Day', '2-3 Days', 'Standard', 'Economy'],
      description: 'Service level',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Weight/Volume',
      operator: 'greater_than',
      value: 1000,
      tier: 'enterprise',
    },
    {
      field: 'Weight/Volume',
      operator: 'greater_than',
      value: 100,
      tier: 'large',
    },
    {
      field: 'Weight/Volume',
      operator: 'greater_than',
      value: 10,
      tier: 'medium',
    },
  ],
}

/**
 * Construction Pipeline Template
 */
export const CONSTRUCTION_TEMPLATE: IndustryTemplate = {
  id: 'construction-template',
  name: 'Construction Pipeline',
  industry: 'construction',
  description: 'Optimized pipeline for construction companies with project and material tracking',
  stages: [
    {
      id: 'project-inquiry',
      name: 'Project Inquiry',
      order: 1,
      probability: 15,
      description: 'Client inquiry about construction project',
    },
    {
      id: 'site-survey',
      name: 'Site Survey',
      order: 2,
      probability: 35,
      description: 'Site survey and assessment completed',
    },
    {
      id: 'quote-submitted',
      name: 'Quote Submitted',
      order: 3,
      probability: 55,
      description: 'Detailed quote with timeline submitted',
    },
    {
      id: 'contract-signed',
      name: 'Contract Signed',
      order: 4,
      probability: 75,
      description: 'Contract signed and advance received',
    },
    {
      id: 'construction-in-progress',
      name: 'Construction In Progress',
      order: 5,
      probability: 90,
      description: 'Construction work in progress with milestones',
    },
    {
      id: 'project-complete',
      name: 'Project Complete',
      order: 6,
      probability: 100,
      description: 'Project completed and final payment received',
    },
  ],
  customFields: [
    {
      name: 'Project Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Renovation', 'Other'],
      description: 'Type of construction project',
    },
    {
      name: 'Project Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Total project value (₹)',
    },
    {
      name: 'Project Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Expected project duration (months)',
    },
    {
      name: 'Payment Schedule',
      fieldType: 'select',
      isRequired: false,
      options: ['Advance', 'Milestone-Based', 'Monthly', 'On Completion'],
      description: 'Payment schedule',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 10000000,
      tier: 'enterprise',
    },
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 1000000,
      tier: 'large',
    },
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'medium',
    },
  ],
}

/**
 * Beauty/Salon Pipeline Template
 */
export const BEAUTY_TEMPLATE: IndustryTemplate = {
  id: 'beauty-template',
  name: 'Beauty/Salon Pipeline',
  industry: 'beauty',
  description: 'Optimized pipeline for beauty salons and spas with appointment and service tracking',
  stages: [
    {
      id: 'inquiry',
      name: 'Inquiry',
      order: 1,
      probability: 20,
      description: 'Customer inquiry about services',
    },
    {
      id: 'appointment-booked',
      name: 'Appointment Booked',
      order: 2,
      probability: 40,
      description: 'Appointment scheduled',
    },
    {
      id: 'service-consultation',
      name: 'Service Consultation',
      order: 3,
      probability: 60,
      description: 'Service consultation completed',
    },
    {
      id: 'package-selected',
      name: 'Package Selected',
      order: 4,
      probability: 75,
      description: 'Service package selected and payment received',
    },
    {
      id: 'service-in-progress',
      name: 'Service In Progress',
      order: 5,
      probability: 90,
      description: 'Services being delivered',
    },
    {
      id: 'service-complete',
      name: 'Service Complete',
      order: 6,
      probability: 100,
      description: 'Service completed and customer satisfied',
    },
  ],
  customFields: [
    {
      name: 'Service Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Hair', 'Skin', 'Nails', 'Massage', 'Spa', 'Makeup', 'Bridal', 'Other'],
      description: 'Type of beauty service',
    },
    {
      name: 'Package Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Service package value (₹)',
    },
    {
      name: 'Membership Type',
      fieldType: 'select',
      isRequired: false,
      options: ['One-Time', 'Monthly', 'Quarterly', 'Annual', 'VIP'],
      description: 'Membership or package type',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Package Value',
      operator: 'greater_than',
      value: 50000,
      tier: 'enterprise',
    },
    {
      field: 'Package Value',
      operator: 'greater_than',
      value: 10000,
      tier: 'large',
    },
    {
      field: 'Package Value',
      operator: 'greater_than',
      value: 2000,
      tier: 'medium',
    },
  ],
}

/**
 * Automotive Pipeline Template
 */
export const AUTOMOTIVE_TEMPLATE: IndustryTemplate = {
  id: 'automotive-template',
  name: 'Automotive Pipeline',
  industry: 'automotive',
  description: 'Optimized pipeline for auto repair shops and dealerships with service and parts tracking',
  stages: [
    {
      id: 'service-inquiry',
      name: 'Service Inquiry',
      order: 1,
      probability: 20,
      description: 'Customer inquiry about vehicle service or purchase',
    },
    {
      id: 'inspection',
      name: 'Inspection',
      order: 2,
      probability: 40,
      description: 'Vehicle inspection or test drive completed',
    },
    {
      id: 'quote-estimate',
      name: 'Quote/Estimate',
      order: 3,
      probability: 60,
      description: 'Service estimate or vehicle quote provided',
    },
    {
      id: 'approval',
      name: 'Approval',
      order: 4,
      probability: 75,
      description: 'Customer approved service or purchase',
    },
    {
      id: 'work-in-progress',
      name: 'Work In Progress',
      order: 5,
      probability: 90,
      description: 'Service work or purchase process in progress',
    },
    {
      id: 'completed',
      name: 'Completed',
      order: 6,
      probability: 100,
      description: 'Service completed or vehicle delivered, payment received',
    },
  ],
  customFields: [
    {
      name: 'Service Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Repair', 'Service', 'Parts', 'Vehicle Sale', 'Insurance', 'Other'],
      description: 'Type of automotive service',
    },
    {
      name: 'Vehicle Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Car', 'Bike', 'SUV', 'Commercial Vehicle', 'Two-Wheeler', 'Other'],
      description: 'Vehicle type',
    },
    {
      name: 'Service Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Service or purchase value (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Service Value',
      operator: 'greater_than',
      value: 500000,
      tier: 'enterprise',
    },
    {
      field: 'Service Value',
      operator: 'greater_than',
      value: 50000,
      tier: 'large',
    },
    {
      field: 'Service Value',
      operator: 'greater_than',
      value: 5000,
      tier: 'medium',
    },
  ],
}

/**
 * Hospitality Pipeline Template
 */
export const HOSPITALITY_TEMPLATE: IndustryTemplate = {
  id: 'hospitality-template',
  name: 'Hospitality Pipeline',
  industry: 'hospitality',
  description: 'Optimized pipeline for hotels and resorts with booking and guest management',
  stages: [
    {
      id: 'booking-inquiry',
      name: 'Booking Inquiry',
      order: 1,
      probability: 20,
      description: 'Guest inquiry about accommodation',
    },
    {
      id: 'availability-check',
      name: 'Availability Check',
      order: 2,
      probability: 40,
      description: 'Room availability checked and quote provided',
    },
    {
      id: 'booking-confirmed',
      name: 'Booking Confirmed',
      order: 3,
      probability: 60,
      description: 'Booking confirmed with deposit',
    },
    {
      id: 'pre-arrival',
      name: 'Pre-Arrival',
      order: 4,
      probability: 80,
      description: 'Pre-arrival preparations and confirmations',
    },
    {
      id: 'guest-stay',
      name: 'Guest Stay',
      order: 5,
      probability: 95,
      description: 'Guest checked in and staying',
    },
    {
      id: 'checkout-complete',
      name: 'Checkout Complete',
      order: 6,
      probability: 100,
      description: 'Guest checked out and payment received',
    },
  ],
  customFields: [
    {
      name: 'Booking Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Individual', 'Corporate', 'Group', 'Event', 'Long Stay', 'Other'],
      description: 'Type of booking',
    },
    {
      name: 'Room Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Standard', 'Deluxe', 'Suite', 'Villa', 'Conference Hall', 'Other'],
      description: 'Room or facility type',
    },
    {
      name: 'Stay Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Number of nights',
    },
    {
      name: 'Total Booking Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Total booking value (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Total Booking Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'enterprise',
    },
    {
      field: 'Total Booking Value',
      operator: 'greater_than',
      value: 25000,
      tier: 'large',
    },
    {
      field: 'Total Booking Value',
      operator: 'greater_than',
      value: 5000,
      tier: 'medium',
    },
  ],
}

/**
 * Legal Pipeline Template
 */
export const LEGAL_TEMPLATE: IndustryTemplate = {
  id: 'legal-template',
  name: 'Legal Pipeline',
  industry: 'legal',
  description: 'Optimized pipeline for law firms with case and client tracking',
  stages: [
    {
      id: 'client-inquiry',
      name: 'Client Inquiry',
      order: 1,
      probability: 15,
      description: 'Client inquiry about legal services',
    },
    {
      id: 'consultation',
      name: 'Consultation',
      order: 2,
      probability: 35,
      description: 'Initial consultation meeting',
    },
    {
      id: 'case-assessment',
      name: 'Case Assessment',
      order: 3,
      probability: 55,
      description: 'Case reviewed and strategy discussed',
    },
    {
      id: 'retainer-agreement',
      name: 'Retainer Agreement',
      order: 4,
      probability: 75,
      description: 'Retainer agreement signed and payment received',
    },
    {
      id: 'case-active',
      name: 'Case Active',
      order: 5,
      probability: 90,
      description: 'Case active with ongoing work',
    },
    {
      id: 'case-resolved',
      name: 'Case Resolved',
      order: 6,
      probability: 100,
      description: 'Case resolved and final billing completed',
    },
  ],
  customFields: [
    {
      name: 'Case Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Corporate', 'Criminal', 'Civil', 'Family', 'Property', 'IP', 'Other'],
      description: 'Type of legal case',
    },
    {
      name: 'Case Complexity',
      fieldType: 'select',
      isRequired: false,
      options: ['Simple', 'Moderate', 'Complex', 'High-Stakes'],
      description: 'Case complexity level',
    },
    {
      name: 'Estimated Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Estimated case duration (months)',
    },
    {
      name: 'Billing Model',
      fieldType: 'select',
      isRequired: false,
      options: ['Hourly', 'Fixed', 'Retainer', 'Contingency'],
      description: 'Billing model',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Estimated Duration',
      operator: 'greater_than',
      value: 12,
      tier: 'enterprise',
    },
    {
      field: 'Estimated Duration',
      operator: 'greater_than',
      value: 6,
      tier: 'large',
    },
    {
      field: 'Estimated Duration',
      operator: 'greater_than',
      value: 3,
      tier: 'medium',
    },
  ],
}

/**
 * Financial Services (CA/Accounting) Pipeline Template
 */
export const FINANCIAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'financial-services-template',
  name: 'Financial Services Pipeline',
  industry: 'financial-services',
  description: 'Optimized pipeline for CA firms and accounting practices with client and compliance tracking',
  stages: [
    {
      id: 'client-inquiry',
      name: 'Client Inquiry',
      order: 1,
      probability: 20,
      description: 'Client inquiry about CA/accounting services',
    },
    {
      id: 'needs-assessment',
      name: 'Needs Assessment',
      order: 2,
      probability: 40,
      description: 'Client needs assessed and services identified',
    },
    {
      id: 'proposal',
      name: 'Proposal',
      order: 3,
      probability: 60,
      description: 'Service proposal submitted',
    },
    {
      id: 'engagement-letter',
      name: 'Engagement Letter',
      order: 4,
      probability: 80,
      description: 'Engagement letter signed and retainer received',
    },
    {
      id: 'service-delivery',
      name: 'Service Delivery',
      order: 5,
      probability: 95,
      description: 'Services being delivered (audit, tax filing, etc.)',
    },
    {
      id: 'compliance-complete',
      name: 'Compliance Complete',
      order: 6,
      probability: 100,
      description: 'Compliance work completed and final billing done',
    },
  ],
  customFields: [
    {
      name: 'Service Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Tax Filing', 'Audit', 'GST Compliance', 'Company Registration', 'Accounting', 'Advisory', 'Other'],
      description: 'Type of financial service',
    },
    {
      name: 'Client Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Individual', 'SME', 'Enterprise', 'Startup', 'NGO'],
      description: 'Client business type',
    },
    {
      name: 'Annual Fee',
      fieldType: 'number',
      isRequired: false,
      description: 'Annual service fee (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 500000,
      tier: 'enterprise',
    },
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 100000,
      tier: 'large',
    },
    {
      field: 'Annual Fee',
      operator: 'greater_than',
      value: 25000,
      tier: 'medium',
    },
  ],
}

/**
 * Event Management Pipeline Template
 */
export const EVENT_MANAGEMENT_TEMPLATE: IndustryTemplate = {
  id: 'event-management-template',
  name: 'Event Management Pipeline',
  industry: 'event-management',
  description: 'Optimized pipeline for event management companies with event and vendor tracking',
  stages: [
    {
      id: 'event-inquiry',
      name: 'Event Inquiry',
      order: 1,
      probability: 15,
      description: 'Client inquiry about event planning services',
    },
    {
      id: 'event-brief',
      name: 'Event Brief',
      order: 2,
      probability: 35,
      description: 'Event requirements and brief collected',
    },
    {
      id: 'proposal-submitted',
      name: 'Proposal Submitted',
      order: 3,
      probability: 55,
      description: 'Event proposal with budget submitted',
    },
    {
      id: 'contract-signed',
      name: 'Contract Signed',
      order: 4,
      probability: 75,
      description: 'Event contract signed and advance received',
    },
    {
      id: 'event-execution',
      name: 'Event Execution',
      order: 5,
      probability: 90,
      description: 'Event planning and execution in progress',
    },
    {
      id: 'event-complete',
      name: 'Event Complete',
      order: 6,
      probability: 100,
      description: 'Event completed successfully and final payment received',
    },
  ],
  customFields: [
    {
      name: 'Event Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Wedding', 'Corporate', 'Conference', 'Exhibition', 'Concert', 'Birthday', 'Other'],
      description: 'Type of event',
    },
    {
      name: 'Event Date',
      fieldType: 'date',
      isRequired: false,
      description: 'Event date',
    },
    {
      name: 'Guest Count',
      fieldType: 'number',
      isRequired: false,
      description: 'Expected number of attendees',
    },
    {
      name: 'Event Budget',
      fieldType: 'number',
      isRequired: false,
      description: 'Total event budget (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Event Budget',
      operator: 'greater_than',
      value: 5000000,
      tier: 'enterprise',
    },
    {
      field: 'Event Budget',
      operator: 'greater_than',
      value: 500000,
      tier: 'large',
    },
    {
      field: 'Event Budget',
      operator: 'greater_than',
      value: 50000,
      tier: 'medium',
    },
  ],
}

/**
 * Wholesale Distribution Pipeline Template
 */
export const WHOLESALE_TEMPLATE: IndustryTemplate = {
  id: 'wholesale-template',
  name: 'Wholesale Distribution Pipeline',
  industry: 'wholesale',
  description: 'Optimized pipeline for wholesale distributors with B2B order and inventory tracking',
  stages: [
    {
      id: 'buyer-inquiry',
      name: 'Buyer Inquiry',
      order: 1,
      probability: 15,
      description: 'B2B buyer inquiry about products',
    },
    {
      id: 'catalog-shared',
      name: 'Catalog Shared',
      order: 2,
      probability: 35,
      description: 'Product catalog and pricing shared',
    },
    {
      id: 'quote-submitted',
      name: 'Quote Submitted',
      order: 3,
      probability: 55,
      description: 'Quote submitted with terms and conditions',
    },
    {
      id: 'credit-approved',
      name: 'Credit Approved',
      order: 4,
      probability: 75,
      description: 'Credit limit approved and account opened',
    },
    {
      id: 'order-placed',
      name: 'Order Placed',
      order: 5,
      probability: 90,
      description: 'Purchase order received and processing',
    },
    {
      id: 'order-fulfilled',
      name: 'Order Fulfilled',
      order: 6,
      probability: 100,
      description: 'Order delivered and payment received',
    },
  ],
  customFields: [
    {
      name: 'Product Category',
      fieldType: 'select',
      isRequired: false,
      options: ['FMCG', 'Electronics', 'Textiles', 'Hardware', 'Pharmaceuticals', 'Food', 'Other'],
      description: 'Product category',
    },
    {
      name: 'Order Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Order value (₹)',
    },
    {
      name: 'Payment Terms',
      fieldType: 'select',
      isRequired: false,
      options: ['Advance', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD'],
      description: 'Payment terms',
    },
    {
      name: 'Buyer Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Retailer', 'Distributor', 'Institution', 'Corporate', 'Other'],
      description: 'Type of buyer',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Order Value',
      operator: 'greater_than',
      value: 1000000,
      tier: 'enterprise',
    },
    {
      field: 'Order Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'large',
    },
    {
      field: 'Order Value',
      operator: 'greater_than',
      value: 10000,
      tier: 'medium',
    },
  ],
}

/**
 * Agriculture Pipeline Template
 */
export const AGRICULTURE_TEMPLATE: IndustryTemplate = {
  id: 'agriculture-template',
  name: 'Agriculture Pipeline',
  industry: 'agriculture',
  description: 'Optimized pipeline for agricultural businesses with crop and supply tracking',
  stages: [
    {
      id: 'inquiry',
      name: 'Inquiry',
      order: 1,
      probability: 15,
      description: 'Inquiry about agricultural products or services',
    },
    {
      id: 'site-visit',
      name: 'Site Visit',
      order: 2,
      probability: 35,
      description: 'Farm or site visit completed',
    },
    {
      id: 'proposal',
      name: 'Proposal',
      order: 3,
      probability: 55,
      description: 'Proposal with pricing and timeline submitted',
    },
    {
      id: 'agreement',
      name: 'Agreement',
      order: 4,
      probability: 75,
      description: 'Agreement signed and advance received',
    },
    {
      id: 'production',
      name: 'Production',
      order: 5,
      probability: 90,
      description: 'Crop production or supply in progress',
    },
    {
      id: 'harvest-delivery',
      name: 'Harvest/Delivery',
      order: 6,
      probability: 100,
      description: 'Harvest completed or delivery made, payment received',
    },
  ],
  customFields: [
    {
      name: 'Product Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Crops', 'Seeds', 'Fertilizers', 'Equipment', 'Livestock', 'Organic', 'Other'],
      description: 'Type of agricultural product',
    },
    {
      name: 'Land Area',
      fieldType: 'number',
      isRequired: false,
      description: 'Land area in acres',
    },
    {
      name: 'Season',
      fieldType: 'select',
      isRequired: false,
      options: ['Kharif', 'Rabi', 'Zaid', 'Year-Round'],
      description: 'Agricultural season',
    },
    {
      name: 'Contract Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Contract value (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Contract Value',
      operator: 'greater_than',
      value: 1000000,
      tier: 'enterprise',
    },
    {
      field: 'Contract Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'large',
    },
    {
      field: 'Contract Value',
      operator: 'greater_than',
      value: 10000,
      tier: 'medium',
    },
  ],
}

/**
 * Freelancer/Solo Consultant Pipeline Template
 */
export const FREELANCER_TEMPLATE: IndustryTemplate = {
  id: 'freelancer-template',
  name: 'Freelancer Pipeline',
  industry: 'freelancer',
  description: 'Optimized pipeline for freelancers and solo consultants with project and client tracking',
  stages: [
    {
      id: 'lead-inquiry',
      name: 'Lead Inquiry',
      order: 1,
      probability: 20,
      description: 'Client inquiry about services',
    },
    {
      id: 'discovery-call',
      name: 'Discovery Call',
      order: 2,
      probability: 40,
      description: 'Discovery call to understand project requirements',
    },
    {
      id: 'proposal',
      name: 'Proposal',
      order: 3,
      probability: 60,
      description: 'Project proposal submitted',
    },
    {
      id: 'contract-signed',
      name: 'Contract Signed',
      order: 4,
      probability: 80,
      description: 'Contract signed and advance received',
    },
    {
      id: 'project-active',
      name: 'Project Active',
      order: 5,
      probability: 95,
      description: 'Project work in progress',
    },
    {
      id: 'project-complete',
      name: 'Project Complete',
      order: 6,
      probability: 100,
      description: 'Project completed and final payment received',
    },
  ],
  customFields: [
    {
      name: 'Project Type',
      fieldType: 'select',
      isRequired: false,
      options: ['Design', 'Development', 'Writing', 'Consulting', 'Marketing', 'Other'],
      description: 'Type of project',
    },
    {
      name: 'Project Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Project duration (days)',
    },
    {
      name: 'Billing Model',
      fieldType: 'select',
      isRequired: false,
      options: ['Fixed', 'Hourly', 'Milestone', 'Retainer'],
      description: 'Billing model',
    },
    {
      name: 'Project Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Project value (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 500000,
      tier: 'enterprise',
    },
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'large',
    },
    {
      field: 'Project Value',
      operator: 'greater_than',
      value: 25000,
      tier: 'medium',
    },
  ],
}

/**
 * Service Business Pipeline Template
 */
export const SERVICE_BUSINESS_TEMPLATE: IndustryTemplate = {
  id: 'service-business-template',
  name: 'Service Business Pipeline',
  industry: 'service-business',
  description: 'Optimized pipeline for service businesses with client and project tracking',
  stages: [
    {
      id: 'client-inquiry',
      name: 'Client Inquiry',
      order: 1,
      probability: 15,
      description: 'Client inquiry about services',
    },
    {
      id: 'needs-analysis',
      name: 'Needs Analysis',
      order: 2,
      probability: 35,
      description: 'Client needs analyzed and solution proposed',
    },
    {
      id: 'proposal',
      name: 'Proposal',
      order: 3,
      probability: 55,
      description: 'Service proposal submitted',
    },
    {
      id: 'contract-negotiation',
      name: 'Contract Negotiation',
      order: 4,
      probability: 75,
      description: 'Contract terms negotiated and signed',
    },
    {
      id: 'service-delivery',
      name: 'Service Delivery',
      order: 5,
      probability: 90,
      description: 'Services being delivered',
    },
    {
      id: 'project-complete',
      name: 'Project Complete',
      order: 6,
      probability: 100,
      description: 'Project completed and payment received',
    },
  ],
  customFields: [
    {
      name: 'Service Category',
      fieldType: 'select',
      isRequired: false,
      options: ['IT Services', 'Consulting', 'Marketing', 'Support', 'Maintenance', 'Other'],
      description: 'Service category',
    },
    {
      name: 'Contract Duration',
      fieldType: 'number',
      isRequired: false,
      description: 'Contract duration (months)',
    },
    {
      name: 'Monthly Recurring Value',
      fieldType: 'number',
      isRequired: false,
      description: 'Monthly recurring revenue (₹)',
    },
  ],
  dealSizeSignals: [
    {
      field: 'Monthly Recurring Value',
      operator: 'greater_than',
      value: 100000,
      tier: 'enterprise',
    },
    {
      field: 'Monthly Recurring Value',
      operator: 'greater_than',
      value: 25000,
      tier: 'large',
    },
    {
      field: 'Monthly Recurring Value',
      operator: 'greater_than',
      value: 5000,
      tier: 'medium',
    },
  ],
}

/**
 * Get all available templates
 */
export function getAllTemplates(): IndustryTemplate[] {
  return [
    FINTECH_TEMPLATE,
    D2C_TEMPLATE,
    AGENCIES_TEMPLATE,
    RETAIL_TEMPLATE,
    MANUFACTURING_TEMPLATE,
    REAL_ESTATE_TEMPLATE,
    HEALTHCARE_TEMPLATE,
    PROFESSIONAL_SERVICES_TEMPLATE,
    RESTAURANT_TEMPLATE,
    ECOMMERCE_TEMPLATE,
    EDUCATION_TEMPLATE,
    LOGISTICS_TEMPLATE,
    CONSTRUCTION_TEMPLATE,
    BEAUTY_TEMPLATE,
    AUTOMOTIVE_TEMPLATE,
    HOSPITALITY_TEMPLATE,
    LEGAL_TEMPLATE,
    FINANCIAL_SERVICES_TEMPLATE,
    EVENT_MANAGEMENT_TEMPLATE,
    WHOLESALE_TEMPLATE,
    AGRICULTURE_TEMPLATE,
    FREELANCER_TEMPLATE,
    SERVICE_BUSINESS_TEMPLATE,
  ]
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): IndustryTemplate | null {
  return getAllTemplates().find((t) => t.id === id) || null
}

/**
 * Get template by industry
 */
export function getTemplateByIndustry(industry: string): IndustryTemplate | null {
  return getAllTemplates().find((t) => t.industry === industry) || null
}
