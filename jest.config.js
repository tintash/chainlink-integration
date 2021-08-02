module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testMatch: ['<rootDir>/tests/datastore-tests.ts'],
    testPathIgnorePatterns: ['<rootDir>/tests/setup.ts', '<rootDir>/tests/teardown.ts'],
    collectCoverageFrom: ['<rootDir>/**/*.ts'],
    coveragePathIgnorePatterns: [''],
    coverageDirectory: '../coverage',
    globalSetup: '<rootDir>/tests/setup.ts',
    globalTeardown: '<rootDir>/tests/teardown.ts',
    testTimeout: 20000,
  }
  