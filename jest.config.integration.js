module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testMatch: ['<rootDir>/integration-tests/**/*.ts'],
    testPathIgnorePatterns: ['<rootDir>/integration-tests/setup.ts', '<rootDir>/integration-tests/teardown.ts'],
    collectCoverageFrom: ['<rootDir>/**/*.ts'],
    coveragePathIgnorePatterns: [''],
    coverageDirectory: '../coverage',
    globalSetup: '<rootDir>/tests/setup.ts',
    globalTeardown: '<rootDir>/tests/teardown.ts',
    testTimeout: 20000,
  }
  