module.exports = {
  forceExit: true,
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__/m3'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    ['^@/(.*)' + String.fromCharCode(36)]: '<rootDir>/' + String.fromCharCode(36) + '1',
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
