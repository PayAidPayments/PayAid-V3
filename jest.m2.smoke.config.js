module.exports = {
  forceExit: true,
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__/m2'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^server-only$': '<rootDir>/__tests__/m2/mocks/server-only.ts',
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
}

