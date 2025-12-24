/**
 * Industry Feature Definitions
 * Maps industries to their available features and default settings
 */

export interface IndustryFeature {
  name: string
  displayName: string
  description: string
  category: string
  defaultEnabled: boolean
  settings?: Record<string, any>
}

export interface IndustryDefinition {
  id: string
  name: string
  description: string
  features: IndustryFeature[]
  defaultSettings?: Record<string, any>
}

export const INDUSTRIES: Record<string, IndustryDefinition> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Food Service',
    description: 'QR menu, kitchen display, order management, recipe costing',
    features: [
      {
        name: 'qr_menu',
        displayName: 'QR Menu',
        description: 'Touchless menu ordering for customers',
        category: 'ordering',
        defaultEnabled: true,
        settings: { maxTables: 20, languages: ['en', 'hi'] },
      },
      {
        name: 'kitchen_display',
        displayName: 'Kitchen Display System',
        description: 'Real-time order display for kitchen staff',
        category: 'operations',
        defaultEnabled: true,
        settings: { stations: 3, autoRefresh: true },
      },
      {
        name: 'restaurant_orders',
        displayName: 'Order Management',
        description: 'Track and manage restaurant orders',
        category: 'operations',
        defaultEnabled: true,
      },
      {
        name: 'recipe_costing',
        displayName: 'Recipe Costing',
        description: 'Calculate cost per dish and profit margins',
        category: 'inventory',
        defaultEnabled: true,
      },
      {
        name: 'table_management',
        displayName: 'Table Management',
        description: 'Manage table assignments and reservations',
        category: 'operations',
        defaultEnabled: false,
      },
    ],
    defaultSettings: { cookingTime: 15, terminals: 1 },
  },
  retail: {
    id: 'retail',
    name: 'Retail & E-commerce',
    description: 'POS system, inventory management, barcode scanning, loyalty programs',
    features: [
      {
        name: 'pos_system',
        displayName: 'POS System',
        description: 'Point-of-sale terminal for physical stores',
        category: 'sales',
        defaultEnabled: true,
        settings: { paymentMethods: ['cash', 'card', 'upi'], receiptPrint: true },
      },
      {
        name: 'retail_inventory',
        displayName: 'Inventory Management',
        description: 'Real-time stock tracking and alerts',
        category: 'inventory',
        defaultEnabled: true,
        settings: { lowStockAlert: true, autoReorder: false },
      },
      {
        name: 'barcode_scanning',
        displayName: 'Barcode Scanning',
        description: 'Scan and manage product barcodes',
        category: 'inventory',
        defaultEnabled: true,
      },
      {
        name: 'customer_loyalty',
        displayName: 'Customer Loyalty',
        description: 'Rewards and points system for customers',
        category: 'marketing',
        defaultEnabled: false,
      },
      {
        name: 'stock_alerts',
        displayName: 'Stock Alerts',
        description: 'Automatic notifications for low stock',
        category: 'inventory',
        defaultEnabled: true,
      },
    ],
    defaultSettings: { multiTill: false, offlineMode: true },
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing & Production',
    description: 'Production planning, BOM management, vendor network, quality control',
    features: [
      {
        name: 'production_planning',
        displayName: 'Production Planning',
        description: 'Schedule and track production runs',
        category: 'operations',
        defaultEnabled: true,
        settings: { calendarView: true, resourceAllocation: true },
      },
      {
        name: 'bom_management',
        displayName: 'Bill of Materials',
        description: 'Manage product recipes and material requirements',
        category: 'inventory',
        defaultEnabled: true,
      },
      {
        name: 'vendor_management',
        displayName: 'Vendor Management',
        description: 'Track suppliers and manage purchase orders',
        category: 'procurement',
        defaultEnabled: true,
      },
      {
        name: 'material_inventory',
        displayName: 'Material Inventory',
        description: 'Track raw materials and components',
        category: 'inventory',
        defaultEnabled: true,
        settings: { batchTracking: true, expiryManagement: true },
      },
      {
        name: 'quality_control',
        displayName: 'Quality Control',
        description: 'Track quality metrics and inspections',
        category: 'operations',
        defaultEnabled: false,
      },
    ],
    defaultSettings: { batchTracking: true, qcRequired: false },
  },
  real_estate: {
    id: 'real_estate',
    name: 'Real Estate & Property',
    description: 'Property showcase, advance collection, project management, document vault',
    features: [
      {
        name: 'property_showcase',
        displayName: 'Property Showcase',
        description: 'Display properties with photos and virtual tours',
        category: 'marketing',
        defaultEnabled: true,
        settings: { virtualTours: true, floorPlans: true },
      },
      {
        name: 'advance_collection',
        displayName: 'Advance Collection',
        description: 'Collect booking amounts and track payments',
        category: 'sales',
        defaultEnabled: true,
        settings: { installmentPlans: true, autoReminders: true },
      },
      {
        name: 'project_management',
        displayName: 'Project Management',
        description: 'Track construction and renovation projects',
        category: 'operations',
        defaultEnabled: false,
      },
      {
        name: 'document_management',
        displayName: 'Document Management',
        description: 'Store and organize legal documents',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        name: 'virtual_tours',
        displayName: 'Virtual Tours',
        description: '360° virtual property tours',
        category: 'marketing',
        defaultEnabled: false,
      },
    ],
    defaultSettings: { paymentTerms: '30/60/90', documentEncryption: true },
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    description: 'Patient management, appointments, prescriptions, lab management',
    features: [
      {
        name: 'patient_management',
        displayName: 'Patient Management',
        description: 'Manage patient records and medical history',
        category: 'operations',
        defaultEnabled: true,
        settings: { hipaaCompliant: true, dataEncryption: true },
      },
      {
        name: 'appointment_scheduling',
        displayName: 'Appointment Scheduling',
        description: 'Book and manage doctor appointments',
        category: 'operations',
        defaultEnabled: true,
        settings: { autoReminders: true, bufferTime: 15 },
      },
      {
        name: 'prescription_management',
        displayName: 'Prescription Management',
        description: 'Create and manage patient prescriptions',
        category: 'operations',
        defaultEnabled: true,
      },
      {
        name: 'lab_management',
        displayName: 'Lab Management',
        description: 'Track lab tests and results',
        category: 'operations',
        defaultEnabled: false,
      },
      {
        name: 'billing_insurance',
        displayName: 'Billing & Insurance',
        description: 'Handle patient billing and insurance claims',
        category: 'billing',
        defaultEnabled: true,
      },
    ],
    defaultSettings: { appointmentDuration: 30, reminderTime: 24 },
  },
}

/**
 * Get all features for an industry
 */
export function getIndustryFeatures(industryId: string): IndustryFeature[] {
  const industry = INDUSTRIES[industryId]
  return industry?.features || []
}

/**
 * Get default enabled features for an industry
 */
export function getDefaultEnabledFeatures(industryId: string): string[] {
  const features = getIndustryFeatures(industryId)
  return features.filter((f) => f.defaultEnabled).map((f) => f.name)
}

/**
 * Check if a feature is available for an industry
 */
export function isFeatureAvailableForIndustry(
  industryId: string,
  featureName: string
): boolean {
  const features = getIndustryFeatures(industryId)
  return features.some((f) => f.name === featureName)
}

/**
 * Get all available industries
 */
export function getAllIndustries(): IndustryDefinition[] {
  return Object.values(INDUSTRIES)
}
