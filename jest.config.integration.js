module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testMatch: ['<rootDir>/integration-tests/**/*.ts'],
    testPathIgnorePatterns: ['<rootDir>/integration-tests/setup.ts', '<rootDir>/integration-tests/teardown.ts','<rootDir>/integration-tests/helpers.ts'],
    collectCoverageFrom: ['<rootDir>/**/*.ts'],
    coveragePathIgnorePatterns: [''],
    coverageDirectory: '../coverage',
    globalSetup: '<rootDir>/integration-tests/setup.ts',
    globalTeardown: '<rootDir>/integration-tests/teardown.ts',
    testTimeout: 200000,
  }
  