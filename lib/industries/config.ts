/**
 * Industry Configuration System
 * Defines core modules, features, and settings per industry
 */

export interface IndustryConfig {
  id: string
  name: string
  icon: string
  description: string
  coreModules: string[] // Which core modules to auto-enable
  industryFeatures: string[] // Industry-specific features
  industryPacks: string[] // Industry pack IDs
  aiPrompts: string[] // Pre-configured AI prompts
  templates: string[] // Pre-loaded templates
  defaultSettings: Record<string, any>
  subTypes?: Array<{
    id: string
    name: string
    description: string
  }>
}

export const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Restaurant management, menu, orders, and kitchen display',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'analytics', 'productivity'],
    industryFeatures: [
      'restaurant_menu',
      'restaurant_kitchen_display',
      'restaurant_table_management',
      'restaurant_reservations',
      'restaurant_qr_menu',
    ],
    industryPacks: ['restaurant'],
    aiPrompts: [
      'Generate restaurant menu descriptions',
      'Create kitchen display orders',
      'Suggest menu items based on inventory',
      'Optimize table seating',
    ],
    templates: [
      'restaurant_menu_template',
      'restaurant_staff_roles',
      'restaurant_ingredient_categories',
    ],
    defaultSettings: {
      currency: 'INR',
      taxEnabled: true,
      gstEnabled: true,
      tableManagement: true,
      kitchenDisplay: true,
    },
    subTypes: [
      { id: 'fine-dining', name: 'Fine Dining', description: 'Upscale restaurants with table service' },
      { id: 'casual-dining', name: 'Casual Dining', description: 'Family-friendly restaurants' },
      { id: 'fast-food', name: 'Fast Food', description: 'Quick service restaurants' },
      { id: 'cafe', name: 'Cafe', description: 'Coffee shops and cafes' },
      { id: 'cloud-kitchen', name: 'Cloud Kitchen', description: 'Delivery-only kitchens' },
      { id: 'food-truck', name: 'Food Truck', description: 'Mobile food vendors' },
    ],
  },
  retail: {
    id: 'retail',
    name: 'Retail',
    icon: '🛍️',
    description: 'Retail POS, inventory, and customer loyalty',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'analytics', 'productivity'],
    industryFeatures: [
      'retail_pos',
      'retail_barcode',
      'retail_loyalty',
      'retail_store_management',
      'retail_stock_alerts',
    ],
    industryPacks: ['retail'],
    aiPrompts: [
      'Generate product descriptions',
      'Suggest pricing strategies',
      'Create loyalty program campaigns',
      'Optimize inventory levels',
    ],
    templates: [
      'retail_product_categories',
      'retail_pos_workflow',
      'retail_stock_reconciliation',
    ],
    defaultSettings: {
      currency: 'INR',
      barcodeEnabled: true,
      loyaltyEnabled: true,
      multiStore: false,
      posEnabled: true,
    },
    subTypes: [
      { id: 'single-store', name: 'Single Store', description: 'One retail location' },
      { id: 'chain', name: 'Chain', description: 'Multiple store locations' },
      { id: 'ecommerce', name: 'E-commerce', description: 'Online retail store' },
      { id: 'hybrid', name: 'Hybrid', description: 'Both online and offline' },
    ],
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    description: 'Production planning, BOM, and quality control',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'projects', 'analytics', 'productivity'],
    industryFeatures: [
      'manufacturing_bom',
      'manufacturing_production_orders',
      'manufacturing_quality_control',
      'manufacturing_machine_tracking',
      'manufacturing_material_planning',
    ],
    industryPacks: ['manufacturing'],
    aiPrompts: [
      'Optimize production schedules',
      'Suggest material alternatives',
      'Generate quality control checklists',
      'Analyze production efficiency',
    ],
    templates: [
      'manufacturing_bom_template',
      'manufacturing_production_workflow',
      'manufacturing_qc_checklist',
    ],
    defaultSettings: {
      currency: 'INR',
      bomEnabled: true,
      qcEnabled: true,
      machineTracking: true,
      productionPlanning: true,
    },
    subTypes: [
      { id: 'production', name: 'Production', description: 'Full production facility' },
      { id: 'assembly', name: 'Assembly', description: 'Assembly and packaging' },
      { id: 'custom', name: 'Custom Manufacturing', description: 'Made-to-order products' },
    ],
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Patient management and appointments',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'healthcare_patient_management',
      'healthcare_appointments',
      'healthcare_prescriptions',
      'healthcare_billing',
    ],
    industryPacks: ['healthcare'],
    aiPrompts: [
      'Generate patient summaries',
      'Schedule appointments efficiently',
      'Suggest treatment plans',
    ],
    templates: [
      'healthcare_patient_template',
      'healthcare_appointment_workflow',
    ],
    defaultSettings: {
      currency: 'INR',
      appointmentManagement: true,
      patientRecords: true,
    },
  },
  education: {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Student management and attendance',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'education_student_management',
      'education_attendance',
      'education_fees',
      'education_courses',
    ],
    industryPacks: ['education'],
    aiPrompts: [
      'Generate student reports',
      'Optimize class schedules',
      'Analyze attendance patterns',
    ],
    templates: [
      'education_student_template',
      'education_course_template',
    ],
    defaultSettings: {
      currency: 'INR',
      attendanceTracking: true,
      feeManagement: true,
    },
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏠',
    description: 'Property and tenant management',
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'real_estate_property_management',
      'real_estate_tenant_management',
      'real_estate_maintenance',
      'real_estate_listings',
    ],
    industryPacks: ['real-estate'],
    aiPrompts: [
      'Generate property descriptions',
      'Optimize rental pricing',
      'Schedule maintenance tasks',
    ],
    templates: [
      'real_estate_property_template',
      'real_estate_lease_template',
    ],
    defaultSettings: {
      currency: 'INR',
      propertyManagement: true,
      tenantManagement: true,
    },
  },
  freelancer: {
    id: 'freelancer',
    name: 'Freelancer / Solo Consultant',
    icon: '👤',
    description: 'Individual consultant or freelancer managing clients and projects',
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity', 'time-tracking'],
    industryFeatures: [
      'service_project_management',
      'service_time_tracking',
      'service_client_invoicing',
      'service_proposal_templates',
    ],
    industryPacks: ['service-businesses'],
    aiPrompts: [
      'Generate project proposals',
      'Track billable hours',
      'Create client invoices',
    ],
    templates: [
      'freelancer_proposal_template',
      'freelancer_contract_template',
    ],
    defaultSettings: {
      currency: 'INR',
      timeTracking: true,
      projectManagement: true,
    },
  },
  'service-business': {
    id: 'service-business',
    name: 'Service Business',
    icon: '💼',
    description: 'Agency, consultancy, or service provider',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
    name: 'Service Businesses',
    icon: '💼',
    description: 'Agency, consultancy, or service provider',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
    industryFeatures: [
      'service_project_management',
      'service_time_tracking',
      'service_client_invoicing',
      'service_team_collaboration',
    ],
    industryPacks: ['service-businesses'],
    aiPrompts: [
      'Manage client projects',
      'Track team productivity',
      'Generate service reports',
    ],
    templates: [
      'service_proposal_template',
      'service_contract_template',
    ],
    defaultSettings: {
      currency: 'INR',
      projectManagement: true,
      timeTracking: true,
    },
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce',
    icon: '🛒',
    description: 'Online store or marketplace seller',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'analytics', 'productivity'],
    industryFeatures: [
      'ecommerce_multi_channel',
      'ecommerce_order_fulfillment',
      'ecommerce_marketplace_integration',
      'ecommerce_product_catalog',
    ],
    industryPacks: ['ecommerce'],
    aiPrompts: [
      'Optimize product listings',
      'Manage multi-channel orders',
      'Track inventory across channels',
    ],
    templates: [
      'ecommerce_product_template',
      'ecommerce_order_workflow',
    ],
    defaultSettings: {
      currency: 'INR',
      multiChannel: true,
      marketplaceIntegration: true,
    },
  },
  'professional-services': {
    id: 'professional-services',
    name: 'Professional Services',
    icon: '⚖️',
    description: 'CA firm, law firm, consulting, or professional practice',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
    industryFeatures: [
      'professional_time_tracking',
      'professional_billing',
      'professional_case_management',
      'professional_document_management',
    ],
    industryPacks: ['professional-services'],
    aiPrompts: [
      'Track billable hours',
      'Generate client invoices',
      'Manage cases and documents',
    ],
    templates: [
      'professional_engagement_letter',
      'professional_billing_template',
    ],
    defaultSettings: {
      currency: 'INR',
      timeTracking: true,
      billing: true,
    },
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics & Transportation',
    icon: '🚚',
    description: 'Shipment tracking, route management, and vehicle fleet',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'projects', 'analytics', 'productivity'],
    industryFeatures: [
      'logistics_shipment_tracking',
      'logistics_route_optimization',
      'logistics_fleet_management',
      'logistics_delivery_scheduling',
    ],
    industryPacks: ['logistics'],
    aiPrompts: [
      'Optimize delivery routes',
      'Track shipments in real-time',
      'Manage vehicle fleet',
    ],
    templates: [
      'logistics_shipment_template',
      'logistics_route_template',
    ],
    defaultSettings: {
      currency: 'INR',
      shipmentTracking: true,
      fleetManagement: true,
    },
  },
  agriculture: {
    id: 'agriculture',
    name: 'Agriculture & Farming',
    icon: '🌾',
    description: 'Crop management, inputs, mandi prices, and harvest tracking',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'projects', 'analytics', 'productivity'],
    industryFeatures: [
      'agriculture_crop_management',
      'agriculture_input_tracking',
      'agriculture_mandi_prices',
      'agriculture_harvest_tracking',
    ],
    industryPacks: ['agriculture'],
    aiPrompts: [
      'Track crop cycles',
      'Manage farm inputs',
      'Monitor market prices',
    ],
    templates: [
      'agriculture_crop_template',
      'agriculture_input_template',
    ],
    defaultSettings: {
      currency: 'INR',
      cropManagement: true,
      inputTracking: true,
    },
  },
  construction: {
    id: 'construction',
    name: 'Construction & Contracting',
    icon: '🔨',
    description: 'Project management, materials, labor, and milestones',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'projects', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'construction_project_management',
      'construction_material_tracking',
      'construction_labor_management',
      'construction_milestone_tracking',
    ],
    industryPacks: ['construction'],
    aiPrompts: [
      'Manage construction projects',
      'Track materials and labor',
      'Schedule milestones',
    ],
    templates: [
      'construction_project_template',
      'construction_material_template',
    ],
    defaultSettings: {
      currency: 'INR',
      projectManagement: true,
      materialTracking: true,
    },
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty & Wellness',
    icon: '💅',
    description: 'Appointment scheduling, services, and membership management',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'beauty_appointment_scheduling',
      'beauty_service_management',
      'beauty_membership_management',
      'beauty_staff_scheduling',
    ],
    industryPacks: ['beauty'],
    aiPrompts: [
      'Schedule appointments',
      'Manage service packages',
      'Track memberships',
    ],
    templates: [
      'beauty_appointment_template',
      'beauty_service_template',
    ],
    defaultSettings: {
      currency: 'INR',
      appointmentScheduling: true,
      membershipManagement: true,
    },
  },
  automotive: {
    id: 'automotive',
    name: 'Automotive & Repair',
    icon: '🚗',
    description: 'Vehicle management, job cards, and service history',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'projects', 'analytics', 'productivity'],
    industryFeatures: [
      'automotive_vehicle_management',
      'automotive_job_cards',
      'automotive_service_history',
      'automotive_parts_inventory',
    ],
    industryPacks: ['automotive'],
    aiPrompts: [
      'Create job cards',
      'Track vehicle service history',
      'Manage parts inventory',
    ],
    templates: [
      'automotive_job_card_template',
      'automotive_service_template',
    ],
    defaultSettings: {
      currency: 'INR',
      jobCardManagement: true,
      serviceHistory: true,
    },
  },
  hospitality: {
    id: 'hospitality',
    name: 'Hospitality & Hotels',
    icon: '🏨',
    description: 'Room management, bookings, check-in/out, and housekeeping',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'hospitality_room_management',
      'hospitality_booking_management',
      'hospitality_check_in_out',
      'hospitality_housekeeping',
    ],
    industryPacks: ['hospitality'],
    aiPrompts: [
      'Manage room bookings',
      'Track check-ins and check-outs',
      'Schedule housekeeping',
    ],
    templates: [
      'hospitality_booking_template',
      'hospitality_room_template',
    ],
    defaultSettings: {
      currency: 'INR',
      bookingManagement: true,
      roomManagement: true,
    },
  },
  legal: {
    id: 'legal',
    name: 'Legal Services',
    icon: '⚖️',
    description: 'Case management, court dates, documents, and billable hours',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
    industryFeatures: [
      'legal_case_management',
      'legal_court_date_tracking',
      'legal_document_management',
      'legal_billable_hours',
    ],
    industryPacks: ['legal'],
    aiPrompts: [
      'Manage legal cases',
      'Track court dates',
      'Bill clients by hours',
    ],
    templates: [
      'legal_case_template',
      'legal_billing_template',
    ],
    defaultSettings: {
      currency: 'INR',
      caseManagement: true,
      billableHours: true,
    },
  },
  'financial-services': {
    id: 'financial-services',
    name: 'Financial Services',
    icon: '💹',
    description: 'Tax filings, compliance tracking, and advisory services',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
    industryFeatures: [
      'financial_tax_filings',
      'financial_compliance_tracking',
      'financial_advisory_services',
      'financial_client_portal',
    ],
    industryPacks: ['financial'],
    aiPrompts: [
      'File tax returns',
      'Track compliance deadlines',
      'Manage client portfolios',
    ],
    templates: [
      'financial_tax_template',
      'financial_compliance_template',
    ],
    defaultSettings: {
      currency: 'INR',
      taxFiling: true,
      complianceTracking: true,
    },
  },
  events: {
    id: 'events',
    name: 'Event Management',
    icon: '🎉',
    description: 'Event planning, vendor management, and guest management',
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity'],
    industryFeatures: [
      'events_event_planning',
      'events_vendor_management',
      'events_guest_management',
      'events_budget_tracking',
    ],
    industryPacks: ['event'],
    aiPrompts: [
      'Plan events',
      'Manage vendors',
      'Track guest RSVPs',
    ],
    templates: [
      'events_event_template',
      'events_vendor_template',
    ],
    defaultSettings: {
      currency: 'INR',
      eventPlanning: true,
      vendorManagement: true,
    },
  },
  wholesale: {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    icon: '📦',
    description: 'Customer management, tiered pricing, and credit limits',
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'analytics', 'productivity'],
    industryFeatures: [
      'wholesale_customer_management',
      'wholesale_tiered_pricing',
      'wholesale_credit_limits',
      'wholesale_bulk_orders',
    ],
    industryPacks: ['wholesale'],
    aiPrompts: [
      'Manage wholesale customers',
      'Set tiered pricing',
      'Track credit limits',
    ],
    templates: [
      'wholesale_customer_template',
      'wholesale_pricing_template',
    ],
    defaultSettings: {
      currency: 'INR',
      tieredPricing: true,
      creditLimits: true,
    },
  },
}

/**
 * Get industry configuration
 */
export function getIndustryConfig(industryId: string): IndustryConfig | null {
  return INDUSTRY_CONFIGS[industryId] || null
}

/**
 * Get all available industries
 */
export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRY_CONFIGS)
}

/**
 * Get recommended modules for an industry
 */
export function getRecommendedModules(industryId: string): {
  coreModules: string[]
  industryPacks: string[]
} {
  const config = getIndustryConfig(industryId)
  if (!config) {
    return { coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity'], industryPacks: [] }
  }

  // Marketing is now base module, ensure it's included
  const coreModules = config.coreModules.includes('marketing')
    ? config.coreModules
    : [...config.coreModules, 'marketing']

  return {
    coreModules,
    industryPacks: config.industryPacks,
  }
}

