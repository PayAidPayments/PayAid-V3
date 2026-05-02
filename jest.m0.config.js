// `forceExit` ends the Jest process immediately after tests finish. The M0 suite historically
// relied on this to avoid hanging workers when some tests left async handles open; expect the
// post-run `Force exiting Jest` hint when running under this config. Removing `forceExit`
// requires a full `jest.m0` `--detectOpenHandles` audit, not a silent toggle.
module.exports = {
  forceExit: true,
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__/m0'],
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
  collectCoverageFrom: [
    'lib/ai-native/**/*.ts',
    'apps/dashboard/app/api/v1/**/*.ts',
    '!**/*.d.ts',
  ],
}
