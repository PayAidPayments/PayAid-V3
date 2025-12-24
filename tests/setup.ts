/**
 * Jest Test Setup
 * 
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'http://localhost:3000'
process.env.CRM_MODULE_URL = process.env.CRM_MODULE_URL || 'http://localhost:3001'
process.env.INVOICING_MODULE_URL = process.env.INVOICING_MODULE_URL || 'http://localhost:3002'
process.env.ACCOUNTING_MODULE_URL = process.env.ACCOUNTING_MODULE_URL || 'http://localhost:3003'
process.env.HR_MODULE_URL = process.env.HR_MODULE_URL || 'http://localhost:3004'
process.env.WHATSAPP_MODULE_URL = process.env.WHATSAPP_MODULE_URL || 'http://localhost:3005'
process.env.ANALYTICS_MODULE_URL = process.env.ANALYTICS_MODULE_URL || 'http://localhost:3006'

// Increase timeout for integration tests
jest.setTimeout(30000)

// Global test utilities
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
}

