/**
 * 50+ category templates for Product Studio.
 * Each template has a prompt suffix used to tailor main/lifestyle/infographic generation.
 */
export interface ProductStudioTemplate {
  id: string
  label: string
  category: string
  promptSuffix: string
}

export const PRODUCT_STUDIO_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Beauty',
  'Home & Kitchen',
  'Food & Beverage',
  'Health & Personal Care',
  'Sports & Outdoors',
  'Toys & Baby',
  'Automotive',
  'Office & Stationery',
  'Pet',
  'Books & Media',
  'Jewellery & Watches',
] as const

export const PRODUCT_STUDIO_TEMPLATES: ProductStudioTemplate[] = [
  // Electronics (5)
  { id: 'electronics-consumer', category: 'Electronics', label: 'Consumer electronics', promptSuffix: 'Tech product style: clean, modern, subtle reflections, premium feel.' },
  { id: 'electronics-mobile', category: 'Electronics', label: 'Mobile & accessories', promptSuffix: 'Mobile phone or accessory: sleek, lifestyle-compatible, clear details.' },
  { id: 'electronics-laptop', category: 'Electronics', label: 'Laptops & PCs', promptSuffix: 'Laptop/PC: professional, workspace or minimal setup, high clarity.' },
  { id: 'electronics-audio', category: 'Electronics', label: 'Audio devices', promptSuffix: 'Audio product: premium, lifestyle or studio context, clear product focus.' },
  { id: 'electronics-camera', category: 'Electronics', label: 'Cameras & photography', promptSuffix: 'Camera or photography gear: professional, sharp details, aspirational.' },
  // Fashion (8)
  { id: 'fashion-apparel', category: 'Fashion', label: 'Apparel', promptSuffix: 'Fashion apparel: clean lay, fabric texture visible, on-trend styling.' },
  { id: 'fashion-footwear', category: 'Fashion', label: 'Footwear', promptSuffix: 'Footwear: lifestyle or studio, angle that shows design, premium look.' },
  { id: 'fashion-bags', category: 'Fashion', label: 'Bags & luggage', promptSuffix: 'Bag or luggage: structure visible, lifestyle or flat lay, aspirational.' },
  { id: 'fashion-jewelry', category: 'Fashion', label: 'Jewelry', promptSuffix: 'Jewelry: elegant, subtle shine, minimal background, detail-focused.' },
  { id: 'fashion-watches', category: 'Fashion', label: 'Watches', promptSuffix: 'Watch: premium, wrist or case shot, clear dial and finish.' },
  { id: 'fashion-ethnic', category: 'Fashion', label: 'Ethnic wear', promptSuffix: 'Ethnic wear: traditional elegance, fabric and detail emphasis, cultural context.' },
  { id: 'fashion-western', category: 'Fashion', label: 'Western wear', promptSuffix: 'Western wear: contemporary, clean lines, lifestyle or mannequin-ready.' },
  { id: 'fashion-activewear', category: 'Fashion', label: 'Activewear', promptSuffix: 'Activewear: dynamic, fitness or sport context, fabric and fit visible.' },
  // Beauty (6)
  { id: 'beauty-skincare', category: 'Beauty', label: 'Skincare', promptSuffix: 'Skincare product: fresh, clean, bottle or tube clearly visible, premium feel.' },
  { id: 'beauty-makeup', category: 'Beauty', label: 'Makeup', promptSuffix: 'Makeup product: color-accurate, compact or palette clearly shown, beauty aesthetic.' },
  { id: 'beauty-hair', category: 'Beauty', label: 'Hair care', promptSuffix: 'Hair care: bottle/packaging clear, fresh and clean look, salon-quality feel.' },
  { id: 'beauty-fragrance', category: 'Beauty', label: 'Fragrance', promptSuffix: 'Fragrance: luxurious bottle, minimal background, aspirational and premium.' },
  { id: 'beauty-personal', category: 'Beauty', label: 'Personal care', promptSuffix: 'Personal care product: hygienic, clear packaging, trust-building.' },
  { id: 'beauty-organic', category: 'Beauty', label: 'Organic / natural', promptSuffix: 'Organic/natural beauty: earthy, clean, ingredient-forward, natural tones.' },
  // Home & Kitchen (6)
  { id: 'home-furniture', category: 'Home & Kitchen', label: 'Furniture', promptSuffix: 'Furniture: room or lifestyle context, material and build visible, inviting.' },
  { id: 'home-decor', category: 'Home & Kitchen', label: 'Home decor', promptSuffix: 'Home decor: styled setting, texture and color accurate, aspirational.' },
  { id: 'home-kitchen', category: 'Home & Kitchen', label: 'Kitchen', promptSuffix: 'Kitchen product: functional, clean, appliance or utensil clearly shown.' },
  { id: 'home-bedding', category: 'Home & Kitchen', label: 'Bedding', promptSuffix: 'Bedding: fabric and pattern clear, made-up or flat lay, cozy and premium.' },
  { id: 'home-lighting', category: 'Home & Kitchen', label: 'Lighting', promptSuffix: 'Lighting: fixture clearly shown, warm or modern, ambient context.' },
  { id: 'home-garden', category: 'Home & Kitchen', label: 'Garden', promptSuffix: 'Garden product: outdoor or plant context, natural, product clearly visible.' },
  // Food & Beverage (5)
  { id: 'food-packaged', category: 'Food & Beverage', label: 'Packaged food', promptSuffix: 'Packaged food: appetizing, packaging legible, fresh and hygienic.' },
  { id: 'food-beverages', category: 'Food & Beverage', label: 'Beverages', promptSuffix: 'Beverage: bottle or can clear, refreshing, lifestyle or chilled look.' },
  { id: 'food-snacks', category: 'Food & Beverage', label: 'Snacks', promptSuffix: 'Snack product: appetizing, pack or product clear, crave-worthy.' },
  { id: 'food-gourmet', category: 'Food & Beverage', label: 'Gourmet', promptSuffix: 'Gourmet food: premium, artisanal, ingredient or plating focus.' },
  { id: 'food-health', category: 'Food & Beverage', label: 'Health food', promptSuffix: 'Health food: clean, natural, nutrient-forward, trust-building.' },
  // Health & Personal Care (4)
  { id: 'health-supplements', category: 'Health & Personal Care', label: 'Supplements', promptSuffix: 'Supplement: bottle or pack clear, clinical-clean, trustworthy.' },
  { id: 'health-fitness', category: 'Health & Personal Care', label: 'Fitness equipment', promptSuffix: 'Fitness product: dynamic or in-use, build quality visible, motivating.' },
  { id: 'health-medical', category: 'Health & Personal Care', label: 'Medical devices', promptSuffix: 'Medical device: professional, clear labeling, safe and reliable look.' },
  { id: 'health-wellness', category: 'Health & Personal Care', label: 'Wellness', promptSuffix: 'Wellness product: calming, natural, self-care aesthetic.' },
  // Sports & Outdoors (4)
  { id: 'sports-equipment', category: 'Sports & Outdoors', label: 'Sports equipment', promptSuffix: 'Sports equipment: action or studio, durability and design visible.' },
  { id: 'sports-apparel', category: 'Sports & Outdoors', label: 'Sports apparel', promptSuffix: 'Sports apparel: performance fabric, dynamic or lifestyle context.' },
  { id: 'sports-outdoor', category: 'Sports & Outdoors', label: 'Outdoor gear', promptSuffix: 'Outdoor gear: rugged, adventure context, product clearly shown.' },
  { id: 'sports-cycling', category: 'Sports & Outdoors', label: 'Cycling', promptSuffix: 'Cycling product: bike or accessory, sporty, premium and functional.' },
  // Toys & Baby (4)
  { id: 'toys-toys', category: 'Toys & Baby', label: 'Toys', promptSuffix: 'Toy: playful, safe, color-accurate, child-friendly context.' },
  { id: 'toys-babycare', category: 'Toys & Baby', label: 'Baby care', promptSuffix: 'Baby care product: gentle, safe, clean and trustworthy.' },
  { id: 'toys-kids-apparel', category: 'Toys & Baby', label: 'Kids apparel', promptSuffix: 'Kids apparel: cute, comfortable, size and detail visible.' },
  { id: 'toys-educational', category: 'Toys & Baby', label: 'Educational', promptSuffix: 'Educational product: clear, engaging, learning-focused.' },
  // Automotive (3)
  { id: 'auto-parts', category: 'Automotive', label: 'Parts', promptSuffix: 'Auto part: technical, clear detail, durable and precise.' },
  { id: 'auto-accessories', category: 'Automotive', label: 'Accessories', promptSuffix: 'Auto accessory: in-car or product shot, premium and functional.' },
  { id: 'auto-care', category: 'Automotive', label: 'Care & cleaning', promptSuffix: 'Auto care product: bottle or kit clear, professional and effective.' },
  // Office & Stationery (3)
  { id: 'office-stationery', category: 'Office & Stationery', label: 'Stationery', promptSuffix: 'Stationery: clean, organized, desk or flat lay, professional.' },
  { id: 'office-tech', category: 'Office & Stationery', label: 'Tech accessories', promptSuffix: 'Office tech accessory: minimal, modern, productivity-focused.' },
  { id: 'office-organizers', category: 'Office & Stationery', label: 'Organizers', promptSuffix: 'Organizer: tidy, practical, storage or desk context.' },
  // Pet (2)
  { id: 'pet-food', category: 'Pet', label: 'Pet food', promptSuffix: 'Pet food: pack or product clear, fresh, pet-parent trust.' },
  { id: 'pet-accessories', category: 'Pet', label: 'Pet accessories', promptSuffix: 'Pet accessory: durable, pet or lifestyle context, clear product.' },
  // Books & Media (2)
  { id: 'media-books', category: 'Books & Media', label: 'Books', promptSuffix: 'Book: cover clearly visible, genre-appropriate, readable spine/title.' },
  { id: 'media-media', category: 'Books & Media', label: 'Media & entertainment', promptSuffix: 'Media product: packaging clear, entertainment or gift aesthetic.' },
  // Jewellery & Watches (extra 2 for 52 total)
  { id: 'jewelry-fashion', category: 'Jewellery & Watches', label: 'Fashion jewelry', promptSuffix: 'Fashion jewelry: trendy, wearable, detail and finish visible.' },
  { id: 'jewelry-precious', category: 'Jewellery & Watches', label: 'Precious & fine', promptSuffix: 'Fine jewelry: luxurious, stone and metal detail, premium presentation.' },
]

export function getProductStudioTemplate(id: string): ProductStudioTemplate | undefined {
  return PRODUCT_STUDIO_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(): Record<string, ProductStudioTemplate[]> {
  const map: Record<string, ProductStudioTemplate[]> = {}
  for (const t of PRODUCT_STUDIO_TEMPLATES) {
    if (!map[t.category]) map[t.category] = []
    map[t.category].push(t)
  }
  return map
}
