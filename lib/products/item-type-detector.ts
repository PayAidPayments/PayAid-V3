/**
 * Item Type Detector
 * Determines if a product is "goods" or "services" based on product name and description
 */

// Keywords that indicate services
const SERVICE_KEYWORDS = [
  // Professional Services
  'consulting', 'consultant', 'advisory', 'advisory services',
  'legal', 'lawyer', 'attorney', 'advocate',
  'accounting', 'accountant', 'audit', 'auditing',
  'tax', 'taxation', 'financial planning',
  
  // IT Services
  'software development', 'web development', 'app development',
  'programming', 'coding', 'software service',
  'maintenance', 'support', 'hosting', 'cloud service',
  'digital marketing', 'seo', 'sem', 'social media',
  'design', 'graphic design', 'ui/ux', 'branding',
  
  // Business Services
  'service', 'services', 'solutions', 'solution',
  'management', 'managed service', 'outsourcing',
  'training', 'education', 'course', 'workshop',
  'coaching', 'mentoring', 'counseling',
  
  // Hospitality & Entertainment
  'hotel', 'accommodation', 'booking', 'reservation',
  'event', 'party', 'celebration', 'wedding',
  'entertainment', 'music', 'performance', 'show',
  'tour', 'travel', 'tourism', 'guide',
  
  // Health & Wellness
  'therapy', 'treatment', 'medical service', 'healthcare',
  'fitness', 'gym', 'yoga', 'massage', 'spa',
  'beauty', 'salon', 'makeup', 'haircut',
  
  // Repair & Maintenance
  'repair', 'fix', 'installation', 'install',
  'maintenance', 'servicing', 'cleaning', 'housekeeping',
  
  // Transportation
  'transport', 'shipping', 'delivery', 'logistics',
  'courier', 'freight', 'cargo',
  
  // Financial Services
  'insurance', 'banking', 'loan', 'credit',
  'investment', 'trading', 'brokerage',
  
  // Real Estate Services
  'rental', 'lease', 'property management',
  'real estate service', 'brokerage service',
  
  // Education
  'tuition', 'teaching', 'tutoring', 'classes',
  'certification', 'certificate program',
  
  // Other Services
  'subscription', 'membership', 'license',
  'commission', 'fee', 'charge',
]

// Keywords that indicate goods (physical products)
const GOODS_KEYWORDS = [
  // Electronics
  'laptop', 'computer', 'phone', 'mobile', 'smartphone',
  'tablet', 'monitor', 'keyboard', 'mouse', 'printer',
  'camera', 'headphone', 'speaker', 'tv', 'television',
  
  // Food & Beverages
  'food', 'beverage', 'drink', 'snack', 'chocolate',
  'coffee', 'tea', 'juice', 'milk', 'bread',
  'rice', 'wheat', 'flour', 'sugar', 'salt',
  
  // Clothing & Accessories
  'shirt', 'pant', 'dress', 'shoe', 'sandal',
  'watch', 'bag', 'wallet', 'belt', 'jewelry',
  
  // Furniture & Home
  'chair', 'table', 'sofa', 'bed', 'cabinet',
  'lamp', 'fan', 'ac', 'refrigerator', 'washing machine',
  
  // Books & Media
  'book', 'magazine', 'newspaper', 'cd', 'dvd',
  
  // Tools & Equipment
  'tool', 'equipment', 'machine', 'device', 'gadget',
  'appliance', 'hardware', 'component',
  
  // Raw Materials
  'material', 'raw material', 'fabric', 'metal',
  'plastic', 'wood', 'glass', 'paper',
  
  // Other Goods
  'product', 'item', 'goods', 'merchandise',
  'commodity', 'article', 'unit',
]

/**
 * Determine item type (goods or services) from product name and description
 * @param productName - Product name
 * @param description - Product description (optional)
 * @returns 'goods' or 'services'
 */
export function detectItemType(
  productName: string,
  description?: string
): 'goods' | 'services' {
  if (!productName || productName.trim().length === 0) {
    return 'goods' // Default to goods
  }

  const searchText = `${productName} ${description || ''}`
    .toLowerCase()
    .trim()

  // Count service keyword matches
  const serviceMatches = SERVICE_KEYWORDS.filter(keyword =>
    searchText.includes(keyword.toLowerCase())
  ).length

  // Count goods keyword matches
  const goodsMatches = GOODS_KEYWORDS.filter(keyword =>
    searchText.includes(keyword.toLowerCase())
  ).length

  // If service keywords found, likely a service
  if (serviceMatches > 0 && serviceMatches >= goodsMatches) {
    return 'services'
  }

  // If goods keywords found, likely goods
  if (goodsMatches > 0) {
    return 'goods'
  }

  // Check for common service patterns
  const servicePatterns = [
    /\bservice\b/i,
    /\bservices\b/i,
    /\bsolution\b/i,
    /\bsolutions\b/i,
    /\bconsulting\b/i,
    /\bdevelopment\b/i,
    /\bdesign\b/i,
    /\bmaintenance\b/i,
    /\bsupport\b/i,
    /\btraining\b/i,
    /\bcourse\b/i,
    /\bworkshop\b/i,
  ]

  const hasServicePattern = servicePatterns.some(pattern => pattern.test(searchText))

  if (hasServicePattern) {
    return 'services'
  }

  // Default to goods (most products are physical goods)
  return 'goods'
}

/**
 * Get confidence score for item type detection
 * @param productName - Product name
 * @param description - Product description (optional)
 * @returns Object with itemType and confidence (0-1)
 */
export function detectItemTypeWithConfidence(
  productName: string,
  description?: string
): { itemType: 'goods' | 'services'; confidence: number } {
  if (!productName || productName.trim().length === 0) {
    return { itemType: 'goods', confidence: 0.5 }
  }

  const searchText = `${productName} ${description || ''}`
    .toLowerCase()
    .trim()

  const serviceMatches = SERVICE_KEYWORDS.filter(keyword =>
    searchText.includes(keyword.toLowerCase())
  ).length

  const goodsMatches = GOODS_KEYWORDS.filter(keyword =>
    searchText.includes(keyword.toLowerCase())
  ).length

  const totalMatches = serviceMatches + goodsMatches

  if (totalMatches === 0) {
    return { itemType: 'goods', confidence: 0.5 }
  }

  if (serviceMatches > goodsMatches) {
    const confidence = Math.min(0.9, 0.5 + (serviceMatches / totalMatches) * 0.4)
    return { itemType: 'services', confidence }
  } else {
    const confidence = Math.min(0.9, 0.5 + (goodsMatches / totalMatches) * 0.4)
    return { itemType: 'goods', confidence }
  }
}
