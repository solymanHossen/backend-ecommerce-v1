module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  verbose: true,
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
