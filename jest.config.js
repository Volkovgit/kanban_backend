module.exports = {
  displayName: 'api',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.spec.ts', '!src/tests/**'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  maxWorkers: 1,
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts']
};
