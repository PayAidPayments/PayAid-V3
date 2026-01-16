/**
 * Artillery Processor
 * Custom functions for load testing
 */

module.exports = {
  // Generate random tenant ID for testing
  generateTenantId: () => {
    return `test-tenant-${Math.random().toString(36).substring(7)}`;
  },
  
  // Generate random user ID
  generateUserId: () => {
    return `test-user-${Math.random().toString(36).substring(7)}`;
  },
};
