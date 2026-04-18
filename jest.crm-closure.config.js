module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lib/crm/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  testTimeout: 30000,
  maxWorkers: 1,
  watchman: false,
}
