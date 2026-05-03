/**
 * Indian Data Helper Utilities
 * Provides realistic Indian names, addresses, phone numbers, and business data
 * for seeding comprehensive sample data across all 28 PayAid V3 modules
 */

/**
 * Indian First Names (Common)
 */
export const INDIAN_FIRST_NAMES = [
  // Male names
  'Rajesh', 'Amit', 'Rahul', 'Vikram', 'Arjun', 'Karan', 'Siddharth', 'Aditya', 'Rohan', 'Nikhil',
  'Pranav', 'Ankit', 'Saurabh', 'Abhishek', 'Vivek', 'Manish', 'Deepak', 'Gaurav', 'Yash', 'Kunal',
  // Female names
  'Priya', 'Anjali', 'Sneha', 'Meera', 'Kavya', 'Divya', 'Shreya', 'Pooja', 'Neha', 'Riya',
  'Aishwarya', 'Swati', 'Radha', 'Kiran', 'Sunita', 'Lakshmi', 'Sarita', 'Manisha', 'Deepika', 'Ananya',
]

/**
 * Indian Last Names (Common)
 */
export const INDIAN_LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Nair', 'Iyer', 'Rao',
  'Joshi', 'Desai', 'Shah', 'Agarwal', 'Malhotra', 'Verma', 'Chopra', 'Kapoor', 'Bansal', 'Arora',
  'Saxena', 'Tiwari', 'Mishra', 'Pandey', 'Yadav', 'Jain', 'Bhatt', 'Gandhi', 'Krishnan', 'Menon',
]

/**
 * Indian Cities (Major)
 */
export const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
  { city: 'Delhi', state: 'Delhi', postalCode: '110001' },
  { city: 'Bangalore', state: 'Karnataka', postalCode: '560001' },
  { city: 'Hyderabad', state: 'Telangana', postalCode: '500001' },
  { city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' },
  { city: 'Kolkata', state: 'West Bengal', postalCode: '700001' },
  { city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
  { city: 'Ahmedabad', state: 'Gujarat', postalCode: '380001' },
  { city: 'Jaipur', state: 'Rajasthan', postalCode: '302001' },
  { city: 'Surat', state: 'Gujarat', postalCode: '395001' },
  { city: 'Lucknow', state: 'Uttar Pradesh', postalCode: '226001' },
  { city: 'Kanpur', state: 'Uttar Pradesh', postalCode: '208001' },
  { city: 'Nagpur', state: 'Maharashtra', postalCode: '440001' },
  { city: 'Indore', state: 'Madhya Pradesh', postalCode: '452001' },
  { city: 'Thane', state: 'Maharashtra', postalCode: '400601' },
]

/**
 * Indian Company Names (Realistic)
 */
export const INDIAN_COMPANY_NAMES = [
  'Tech Solutions Pvt Ltd', 'Digital Innovations India', 'Business Growth Services',
  'Enterprise Solutions Pvt Ltd', 'Smart Business Solutions', 'Professional Services Ltd',
  'Global Tech India', 'Modern Enterprises', 'Advanced Business Systems', 'Prime Solutions',
  'Elite Business Services', 'Premium Solutions Pvt Ltd', 'Strategic Business Partners',
  'Innovative Tech Services', 'Dynamic Business Solutions', 'Excellence Enterprises',
  'Progressive Business Solutions', 'Future Tech India', 'NextGen Solutions', 'Visionary Services',
]

/**
 * Indian Street Names (Common)
 */
export const INDIAN_STREETS = [
  'MG Road', 'Park Street', 'Commercial Street', 'High Street', 'Main Road',
  'Church Street', 'Brigade Road', 'Indira Nagar', 'Koramangala', 'Whitefield',
  'HSR Layout', 'BTM Layout', 'JP Nagar', 'Banashankari', 'Malleshwaram',
]

/**
 * Generate random Indian name
 */
export function generateIndianName(): string {
  const firstName = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)]
  const lastName = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)]
  return `${firstName} ${lastName}`
}

/**
 * Generate random Indian email
 */
export function generateIndianEmail(name?: string): string {
  const baseName = name
    ? name.toLowerCase().replace(/\s+/g, '.')
    : generateIndianName().toLowerCase().replace(/\s+/g, '.')
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.in']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${baseName}@${domain}`
}

/**
 * Generate random Indian phone number
 */
export function generateIndianPhone(): string {
  const prefixes = ['98765', '98764', '98763', '98762', '98761', '98760', '98759', '98758']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `+91-${prefix}${suffix}`
}

/**
 * Generate random Indian address
 */
export function generateIndianAddress(): {
  address: string
  city: string
  state: string
  postalCode: string
  country: string
} {
  const location = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)]
  const street = INDIAN_STREETS[Math.floor(Math.random() * INDIAN_STREETS.length)]
  const buildingNumber = Math.floor(Math.random() * 999) + 1
  
  return {
    address: `${buildingNumber}, ${street}`,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: 'India',
  }
}

/**
 * Generate random Indian company name
 */
export function generateIndianCompanyName(): string {
  return INDIAN_COMPANY_NAMES[Math.floor(Math.random() * INDIAN_COMPANY_NAMES.length)]
}

/**
 * Generate random GSTIN (format: 29ABCDE1234F1Z5)
 */
export function generateGSTIN(): string {
  const states = ['29', '27', '09', '10', '24', '33', '07', '06', '22', '19']
  const stateCode = states[Math.floor(Math.random() * states.length)]
  const pan = generatePAN()
  return `${stateCode}${pan}1Z5`
}

/**
 * Generate random PAN (format: ABCDE1234F)
 */
export function generatePAN(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let pan = ''
  // First 5 letters
  for (let i = 0; i < 5; i++) {
    pan += letters[Math.floor(Math.random() * letters.length)]
  }
  // 4 digits
  for (let i = 0; i < 4; i++) {
    pan += numbers[Math.floor(Math.random() * numbers.length)]
  }
  // Last letter
  pan += letters[Math.floor(Math.random() * letters.length)]
  
  return pan
}

/**
 * Generate random amount in INR (realistic range)
 */
export function generateAmount(min: number = 10000, max: number = 1000000): number {
  const amount = Math.floor(Math.random() * (max - min + 1)) + min
  // Round to nearest 100
  return Math.round(amount / 100) * 100
}

/**
 * Generate random date in range
 */
export function generateDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime()
  const end = endDate.getTime()
  const randomTime = Math.random() * (end - start) + start
  return new Date(randomTime)
}

/**
 * Generate random date in past N days
 */
export function generatePastDate(daysAgo: number): Date {
  const now = new Date()
  const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return generateDate(pastDate, now)
}

/**
 * Generate random date in future N days
 */
export function generateFutureDate(daysAhead: number): Date {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  return generateDate(now, futureDate)
}

/**
 * Generate random date in current month
 */
export function generateCurrentMonthDate(): Date {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return generateDate(startOfMonth, endOfMonth)
}

/**
 * Pick random item from array
 */
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Pick N random items from array
 */
export function pickRandomN<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
