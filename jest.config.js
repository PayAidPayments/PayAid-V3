/** Jest config for root-level tests (e.g. __tests__/phase1a, __tests__/ai) */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)\u0024': '<rootDir>/\u00241',
  },
  testTimeout: 10000,
}
