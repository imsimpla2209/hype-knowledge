/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testMatch: ['**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/types/**/*.ts',
    '!src/**/*.d.ts'
  ],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@middleware/(.*)': '<rootDir>/src/middleware/$1',
    '@types/(.*)': '<rootDir>/src/types/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
  testTimeout: 30000
}; 