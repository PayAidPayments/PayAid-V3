/**
 * GST Rates Data - Based on CBIC GST Goods and Services Rates
 * Source: https://cbic-gst.gov.in/gst-goods-services-rates.html
 * 
 * This file contains HSN codes for goods and SAC codes for services
 * with their corresponding GST rates.
 */

export interface GSTRateItem {
  code: string // HSN or SAC code
  description: string
  cgstRate: number // CGST rate (%)
  sgstRate: number // SGST rate (%)
  igstRate: number // IGST rate (%)
  schedule: string // Schedule I, II, III, IV, V, VI, VII, or Nil
  type: 'goods' | 'services' // HSN for goods, SAC for services
}

/**
 * Common HSN Codes for Goods (Schedule-wise)
 * Schedule I: 5% GST (2.5% CGST + 2.5% SGST)
 * Schedule II: 12% GST (6% CGST + 6% SGST)
 * Schedule III: 18% GST (9% CGST + 9% SGST)
 * Schedule IV: 28% GST (14% CGST + 14% SGST)
 * Schedule V: 3% GST (1.5% CGST + 1.5% SGST)
 * Schedule VI: 0.25% GST (0.125% CGST + 0.125% SGST)
 * Schedule VII: 1.5% GST (0.75% CGST + 0.75% SGST)
 * Nil Rate: 0% GST
 */

// Common Goods (HSN Codes) - Schedule I (5% GST)
export const scheduleIGoods: GSTRateItem[] = [
  { code: '0202-0210', description: 'Meat and meat products (pre-packaged and labelled)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0303-0309', description: 'Fish and fish products (pre-packaged and labelled)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0401', description: 'Ultra High Temperature (UHT) milk', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0402', description: 'Milk and cream, concentrated', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0403', description: 'Yoghurt, curd, lassi, buttermilk (pre-packaged)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0406', description: 'Chena or paneer (pre-packaged and labelled)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0409', description: 'Natural honey (pre-packaged and labelled)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0713', description: 'Dried leguminous vegetables (pre-packaged)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0801', description: 'Cashew nuts, desiccated coconuts', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0806', description: 'Grapes, dried, and raisins', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0901', description: 'Coffee roasted', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0902', description: 'Tea, whether or not flavoured', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '0904', description: 'Pepper, dried or crushed fruits of Capsicum', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1001-1008', description: 'Cereals (pre-packaged and labelled)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1101-1106', description: 'Cereal flours and meals (pre-packaged)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1507-1518', description: 'Vegetable oils and fats', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1701', description: 'Beet sugar, cane sugar', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1902', description: 'Seviyan (vermicelli)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '1903', description: 'Tapioca and substitutes (sabudana)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '3001-3006', description: 'Pharmaceutical products (medicines, vaccines, insulin)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '3101-3105', description: 'Fertilizers', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '4011', description: 'New pneumatic tyres (bicycles, cycle-rickshaws)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '5201-5212', description: 'Woven fabrics of cotton', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '6101-6117', description: 'Articles of apparel, knitted (sale value ≤ ₹1000)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '6201-6217', description: 'Articles of apparel, not knitted (sale value ≤ ₹1000)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '6401-6405', description: 'Footwear (sale value ≤ ₹1000 per pair)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '8504', description: 'Charger or charging station for electric vehicles', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
  { code: '8703', description: 'Electrically operated vehicles', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'goods' },
]

// Common Goods (HSN Codes) - Schedule II (12% GST)
export const scheduleIIGoods: GSTRateItem[] = [
  { code: '0402', description: 'Condensed milk', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '0405', description: 'Butter and other fats derived from milk', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '0406', description: 'Cheese', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '1601-1605', description: 'Prepared or preserved meat, fish, crustaceans', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '2001-2009', description: 'Prepared or preserved vegetables and fruits', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '2101-2106', description: 'Food preparations', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '2202', description: 'Non-alcoholic beverages', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '3003-3006', description: 'Medicaments (medicines)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '3304-3307', description: 'Beauty or make-up preparations, perfumes', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '3401', description: 'Soap', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '4015', description: 'Surgical rubber gloves', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '4801-4823', description: 'Paper and paperboard articles', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '6101-6117', description: 'Articles of apparel, knitted (sale value > ₹1000)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '6201-6217', description: 'Articles of apparel, not knitted (sale value > ₹1000)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '6401-6405', description: 'Footwear (sale value > ₹1000 per pair)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '6901-6914', description: 'Ceramic articles', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '7001-7020', description: 'Glass and glassware', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '7310-7326', description: 'Articles of iron or steel', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '7418-7419', description: 'Table, kitchen or household articles of copper', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '7615-7616', description: 'Table, kitchen or household articles of aluminium', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '8401-8487', description: 'Machinery and mechanical appliances', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '8501-8548', description: 'Electrical machinery and equipment', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '8701-8716', description: 'Vehicles other than motor vehicles', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '9001-9033', description: 'Optical, photographic, measuring instruments', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
  { code: '9401-9406', description: 'Furniture and parts thereof', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'goods' },
]

// Common Goods (HSN Codes) - Schedule III (18% GST)
export const scheduleIIIGoods: GSTRateItem[] = [
  { code: '1107', description: 'Malt, whether or not roasted', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '1702-1704', description: 'Other sugars and sugar confectionery', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '1804-1806', description: 'Cocoa and cocoa preparations', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '1901-1905', description: 'Preparations of cereals, flour, starch or milk', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2101-2106', description: 'Food preparations not elsewhere specified', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2201-2209', description: 'Beverages, spirits and vinegar', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2401-2403', description: 'Tobacco and manufactured tobacco substitutes', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2523', description: 'Portland cement, aluminous cement', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2601-2621', description: 'Ores, slag and ash', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2701-2715', description: 'Mineral fuels, mineral oils', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2801-2853', description: 'Inorganic chemicals', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '2901-2942', description: 'Organic chemicals', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3201-3215', description: 'Tanning or dyeing extracts, paints, varnishes', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3301-3307', description: 'Essential oils and perfumery, cosmetic or toilet preparations', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3401-3407', description: 'Soap, organic surface-active agents, waxes', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3501-3507', description: 'Albuminoidal substances, glues, enzymes', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3601-3606', description: 'Explosives, pyrotechnic products', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3701-3707', description: 'Photographic or cinematographic goods', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3801-3825', description: 'Miscellaneous chemical products', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '3901-3926', description: 'Plastics and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4001-4017', description: 'Rubber and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4201-4206', description: 'Articles of leather, saddlery and harness', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4301-4304', description: 'Furskins and artificial fur', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4401-4421', description: 'Wood and articles of wood', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4501-4504', description: 'Cork and articles of cork', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4601-4602', description: 'Manufactures of straw, esparto or other plaiting materials', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4701-4707', description: 'Pulp of wood or other fibrous cellulosic material', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4801-4823', description: 'Paper and paperboard, articles of paper pulp', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '4901-4911', description: 'Printed books, newspapers, pictures', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5001-5007', description: 'Silk', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5101-5113', description: 'Wool, fine or coarse animal hair', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5201-5212', description: 'Cotton', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5301-5311', description: 'Other vegetable textile fibres', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5401-5408', description: 'Man-made filaments', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5501-5516', description: 'Man-made staple fibres', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5601-5609', description: 'Wadding, felt and nonwovens, special yarns', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5701-5705', description: 'Carpets and other textile floor coverings', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5801-5811', description: 'Special woven fabrics, tufted textile fabrics', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '5901-5911', description: 'Impregnated, coated, covered or laminated textile fabrics', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6001-6006', description: 'Knitted or crocheted fabrics', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6101-6117', description: 'Articles of apparel and clothing accessories, knitted', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6201-6217', description: 'Articles of apparel and clothing accessories, not knitted', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6301-6310', description: 'Other made up textile articles', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6401-6406', description: 'Footwear, gaiters and the like', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6501-6507', description: 'Headgear and parts thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6601-6603', description: 'Umbrellas, sun umbrellas, walking-sticks', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6701-6704', description: 'Prepared feathers and down and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6801-6815', description: 'Articles of stone, plaster, cement, asbestos', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '6901-6914', description: 'Ceramic products', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7001-7020', description: 'Glass and glassware', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7101-7118', description: 'Natural or cultured pearls, precious or semi-precious stones', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7201-7229', description: 'Iron and steel', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7301-7326', description: 'Articles of iron or steel', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7401-7419', description: 'Copper and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7501-7508', description: 'Nickel and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7601-7616', description: 'Aluminium and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7801-7806', description: 'Lead and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '7901-7907', description: 'Zinc and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8001-8007', description: 'Tin and articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8101-8113', description: 'Other base metals, cermets, articles thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8201-8215', description: 'Tools, implements, cutlery, spoons and forks', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8301-8311', description: 'Miscellaneous articles of base metal', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8401-8487', description: 'Nuclear reactors, boilers, machinery and mechanical appliances', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8501-8548', description: 'Electrical machinery and equipment', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8601-8609', description: 'Railway or tramway locomotives, rolling-stock', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8701-8716', description: 'Vehicles other than railway or tramway rolling-stock', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8801-8807', description: 'Aircraft, spacecraft, and parts thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '8901-8908', description: 'Ships, boats and floating structures', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9001-9033', description: 'Optical, photographic, cinematographic, measuring, checking instruments', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9101-9114', description: 'Clocks and watches and parts thereof', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9201-9209', description: 'Musical instruments, parts and accessories', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9301-9307', description: 'Arms and ammunition, parts and accessories', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9401-9406', description: 'Furniture, bedding, mattresses, lamps and lighting fittings', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9501-9508', description: 'Toys, games and sports requisites', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9601-9619', description: 'Miscellaneous manufactured articles', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
  { code: '9701-9706', description: 'Works of art, collectors pieces and antiques', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'goods' },
]

// Common Goods (HSN Codes) - Schedule IV (28% GST)
export const scheduleIVGoods: GSTRateItem[] = [
  { code: '1703', description: 'Molasses', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '2106', description: 'Pan masala', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '2202', description: 'Aerated waters, carbonated beverages', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '2401-2404', description: 'Tobacco and manufactured tobacco substitutes', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '2523', description: 'Portland cement, aluminous cement', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '4011', description: 'New pneumatic tyres (other than specified)', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8407-8409', description: 'Engines and parts thereof', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8415', description: 'Air-conditioning machines', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8422', description: 'Dish washing machines', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8507', description: 'Electric accumulators (batteries)', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8511', description: 'Electrical ignition or starting equipment', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8528', description: 'Monitors and projectors, television sets', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8701-8708', description: 'Motor vehicles and parts thereof', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8711-8714', description: 'Motorcycles and parts thereof', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8802-8806', description: 'Aircraft for personal use', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '8903', description: 'Yachts and other vessels for pleasure or sports', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '9302', description: 'Revolvers and pistols', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
  { code: '9614', description: 'Smoking pipes and cigar or cigarette holders', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'goods' },
]

// Common Services (SAC Codes) - Based on GST Service Rate Schedule
export const services: GSTRateItem[] = [
  // 5% GST Services
  { code: '995411', description: 'Services by way of house-keeping (plumbing, carpentering, etc.)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996311', description: 'Restaurant service (other than at specified premises)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996312', description: 'Supply of goods by Indian Railways (food, beverages)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996313', description: 'Outdoor catering (at premises other than specified premises)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996411', description: 'Transport of passengers by rail (first class or air conditioned)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996412', description: 'Transport of passengers by air conditioned contract/stage carriage, radio taxi', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996413', description: 'Transport of passengers by air (economy class)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996511', description: 'Transport of goods by rail', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '996512', description: 'Transport of goods in a vessel', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '998311', description: 'Selling of space for advertisement in print media', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '998411', description: 'Supply consisting only of e-book', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '998511', description: 'Supply of tour operators services', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '998811', description: 'Job work in relation to printing of newspapers, textiles, etc.', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },
  { code: '998812', description: 'Tailoring services', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, schedule: 'I', type: 'services' },

  // 12% GST Services
  { code: '996311', description: 'Hotel accommodation (value ≤ ₹7500 per unit per day)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '996412', description: 'Transport of passengers by air (other than economy class)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '996512', description: 'Services of Goods Transport Agency (GTA)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '996512', description: 'Multimodal transportation of goods', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '998312', description: 'Other professional, technical and business services (exploration, mining, drilling)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '998611', description: 'Support services to exploration, mining or drilling of petroleum', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '998711', description: 'Maintenance, repair or overhaul services (aircraft, ships)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '998812', description: 'Job work in relation to printing (12% GST items)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '998813', description: 'Job work (other than specified)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '999411', description: 'Services by way of treatment of effluents by Common Effluent Treatment Plant', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '999412', description: 'Services by way of treatment or disposal of biomedical waste', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },
  { code: '999611', description: 'Services by way of admission to exhibition of cinematograph films (ticket ≤ ₹100)', cgstRate: 6, sgstRate: 6, igstRate: 12, schedule: 'II', type: 'services' },

  // 18% GST Services (Default rate for most services)
  { code: '995411', description: 'Construction services (other than specified)', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996111', description: 'Services in wholesale trade', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996211', description: 'Services in retail trade', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996311', description: 'Hotel accommodation (value > ₹7500 per unit per day)', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996312', description: 'Restaurant service at specified premises', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996411', description: 'Passenger transport services (other than specified)', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996511', description: 'Goods transport services (other than specified)', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996611', description: 'Rental services of transport vehicles', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996711', description: 'Supporting services in transport', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996811', description: 'Postal and courier services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '996911', description: 'Electricity, gas, water and other distribution services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '997111', description: 'Financial and related services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '997211', description: 'Real estate services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '997311', description: 'Leasing or rental services without operator', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998111', description: 'Research and development services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998211', description: 'Legal and accounting services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998311', description: 'Other professional, technical and business services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998411', description: 'Telecommunications, broadcasting and information supply services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998511', description: 'Support services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998611', description: 'Support services to mining, electricity, gas and water distribution', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998711', description: 'Maintenance, repair and installation services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998811', description: 'Manufacturing services on physical inputs owned by others', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '998911', description: 'Other manufacturing services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999111', description: 'Public administration and other services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999211', description: 'Education services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999311', description: 'Human health and social care services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999411', description: 'Sewage and waste collection, treatment and disposal', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999511', description: 'Services of membership organisations', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999611', description: 'Recreational, cultural and sporting services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999711', description: 'Other services (washing, cleaning, beauty services)', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999811', description: 'Domestic services', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },
  { code: '999911', description: 'Services provided by extra territorial organisations', cgstRate: 9, sgstRate: 9, igstRate: 18, schedule: 'III', type: 'services' },

  // 28% GST Services
  { code: '999612', description: 'Services by way of admission to casinos or race clubs', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'services' },
  { code: '999613', description: 'Services provided by a race club by way of totalisator', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'services' },
  { code: '999614', description: 'Gambling', cgstRate: 14, sgstRate: 14, igstRate: 28, schedule: 'IV', type: 'services' },
]

// Combine all items
export const allGSTRates: GSTRateItem[] = [
  ...scheduleIGoods,
  ...scheduleIIGoods,
  ...scheduleIIIGoods,
  ...scheduleIVGoods,
  ...services,
]

/**
 * Search HSN/SAC codes based on product name and description
 */
export function searchHSNCodes(query: string, type?: 'goods' | 'services'): GSTRateItem[] {
  const lowerQuery = query.toLowerCase()
  const filtered = allGSTRates.filter(item => {
    if (type && item.type !== type) return false
    return (
      item.code.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    )
  })
  return filtered.slice(0, 50) // Limit to 50 results
}

/**
 * Get GST rate by HSN/SAC code
 */
export function getGSTRateByCode(code: string): GSTRateItem | undefined {
  return allGSTRates.find(item => item.code === code)
}

/**
 * Get common GST rates for quick selection
 */
export const commonGSTRates = [
  { rate: 0, label: '0% (Nil Rate)' },
  { rate: 5, label: '5% (CGST 2.5% + SGST 2.5%)' },
  { rate: 12, label: '12% (CGST 6% + SGST 6%)' },
  { rate: 18, label: '18% (CGST 9% + SGST 9%)' },
  { rate: 28, label: '28% (CGST 14% + SGST 14%)' },
]
