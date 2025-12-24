/**
 * GST State Code Utilities
 * Extract state information from GSTIN and determine GST type (IGST vs CGST+SGST)
 */

// Indian State Codes (first 2 digits of GSTIN)
export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
}

// State name to state code mapping (for reverse lookup)
export const STATE_NAME_TO_CODE: Record<string, string> = {
  'Jammu and Kashmir': '01',
  'Himachal Pradesh': '02',
  'Punjab': '03',
  'Chandigarh': '04',
  'Uttarakhand': '05',
  'Haryana': '06',
  'Delhi': '07',
  'Rajasthan': '08',
  'Uttar Pradesh': '09',
  'Bihar': '10',
  'Sikkim': '11',
  'Arunachal Pradesh': '12',
  'Nagaland': '13',
  'Manipur': '14',
  'Mizoram': '15',
  'Tripura': '16',
  'Meghalaya': '17',
  'Assam': '18',
  'West Bengal': '19',
  'Jharkhand': '20',
  'Odisha': '21',
  'Chhattisgarh': '22',
  'Madhya Pradesh': '23',
  'Gujarat': '24',
  'Daman and Diu': '25',
  'Dadra and Nagar Haveli': '26',
  'Maharashtra': '27',
  'Andhra Pradesh': '28',
  'Karnataka': '29',
  'Goa': '30',
  'Lakshadweep': '31',
  'Kerala': '32',
  'Tamil Nadu': '33',
  'Puducherry': '34',
  'Andaman and Nicobar Islands': '35',
  'Telangana': '36',
  'Andhra Pradesh (New)': '37',
  'Ladakh': '38',
}

/**
 * Extract state code from GSTIN
 * GSTIN format: 15 characters
 * First 2 digits: State code
 * @param gstin - GST Identification Number
 * @returns State code (2 digits) or null if invalid
 */
export function extractStateCodeFromGSTIN(gstin: string | null | undefined): string | null {
  if (!gstin || gstin.length < 2) {
    return null
  }

  const stateCode = gstin.substring(0, 2)
  
  // Validate state code (should be 01-38)
  if (STATE_CODES[stateCode]) {
    return stateCode
  }

  return null
}

/**
 * Get state code from state name
 * @param stateName - Full state name
 * @returns State code (2 digits) or null if not found
 */
export function getStateCodeFromName(stateName: string | null | undefined): string | null {
  if (!stateName) {
    return null
  }

  // Try exact match first
  if (STATE_NAME_TO_CODE[stateName]) {
    return STATE_NAME_TO_CODE[stateName]
  }

  // Try case-insensitive match
  const normalizedName = stateName.trim()
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (name.toLowerCase() === normalizedName.toLowerCase()) {
      return code
    }
  }

  return null
}

/**
 * Determine if transaction is inter-state or intra-state
 * @param sellerStateCode - Seller's state code (from GSTIN or state name)
 * @param buyerStateCode - Buyer's state code (from GSTIN or state name)
 * @returns true if inter-state (different states), false if intra-state (same state)
 */
export function isInterStateTransaction(
  sellerStateCode: string | null,
  buyerStateCode: string | null
): boolean {
  // If either state code is missing, default to intra-state (conservative approach)
  if (!sellerStateCode || !buyerStateCode) {
    return false
  }

  // If states are different, it's inter-state
  return sellerStateCode !== buyerStateCode
}

/**
 * Determine GST type and calculate breakdown
 * @param sellerGSTIN - Seller's GSTIN
 * @param sellerState - Seller's state name (fallback if GSTIN not available)
 * @param buyerGSTIN - Buyer's GSTIN
 * @param buyerState - Buyer's state name (fallback if GSTIN not available)
 * @param placeOfSupply - Place of supply state (optional, overrides buyer state)
 * @returns Object with GST type information
 */
export interface GSTTypeInfo {
  isInterState: boolean
  sellerStateCode: string | null
  buyerStateCode: string | null
  placeOfSupplyCode: string | null
  gstType: 'IGST' | 'CGST+SGST'
}

export function determineGSTType(
  sellerGSTIN: string | null | undefined,
  sellerState: string | null | undefined,
  buyerGSTIN: string | null | undefined,
  buyerState: string | null | undefined,
  placeOfSupply: string | null | undefined = null
): GSTTypeInfo {
  // Get seller state code
  let sellerStateCode: string | null = null
  if (sellerGSTIN) {
    sellerStateCode = extractStateCodeFromGSTIN(sellerGSTIN)
  }
  if (!sellerStateCode && sellerState) {
    sellerStateCode = getStateCodeFromName(sellerState)
  }

  // Get buyer/place of supply state code
  // Place of supply takes precedence over buyer state
  let buyerStateCode: string | null = null
  if (placeOfSupply) {
    // Place of supply can be state code or state name
    buyerStateCode = placeOfSupply.length === 2 
      ? (STATE_CODES[placeOfSupply] ? placeOfSupply : null)
      : getStateCodeFromName(placeOfSupply)
  }
  
  if (!buyerStateCode && buyerGSTIN) {
    buyerStateCode = extractStateCodeFromGSTIN(buyerGSTIN)
  }
  
  if (!buyerStateCode && buyerState) {
    buyerStateCode = getStateCodeFromName(buyerState)
  }

  // Determine if inter-state
  const isInterState = isInterStateTransaction(sellerStateCode, buyerStateCode)

  return {
    isInterState,
    sellerStateCode,
    buyerStateCode,
    placeOfSupplyCode: buyerStateCode, // Place of supply code is the buyer state code
    gstType: isInterState ? 'IGST' : 'CGST+SGST',
  }
}

/**
 * Get state name from state code
 * @param stateCode - 2-digit state code
 * @returns State name or null if not found
 */
export function getStateNameFromCode(stateCode: string | null | undefined): string | null {
  if (!stateCode || !STATE_CODES[stateCode]) {
    return null
  }
  return STATE_CODES[stateCode]
}
