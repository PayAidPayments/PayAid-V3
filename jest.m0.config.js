module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__/m0'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest-m0.json',
        diagnostics: false,
      },
    ],
  },
  testTimeout: 15000,
  maxWorkers: 1,
  collectCoverageFrom: [
    'lib/ai-native/**/*.ts',
    'apps/dashboard/app/api/v1/**/*.ts',
    '!**/*.d.ts',
  ],
}
