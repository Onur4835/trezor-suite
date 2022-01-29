module.exports = {
    roots: ['<rootDir>/src-electron'],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src-electron/http.ts'],
    coverageThreshold: {
        global: {
            statements: 38,
            branches: 0,
            functions: 50,
            lines: 40,
        },
    },
    moduleNameMapper: {
        '^react-native$': 'react-native-web',
        '^@suite/(.+)': '<rootDir>/../../packages/suite/src/$1', // relative to this project
        '^@(.+)-views/(.+)': '<rootDir>/../../packages/suite/src/views/$1/$2',
        '^@(.+)-views': '<rootDir>/../../packages/suite/src/views/$1/index',
        '^@(.+)-components/(.+)': '<rootDir>/../../packages/suite/src/components/$1/$2',
        '^@(.+)-components': '<rootDir>/../../packages/suite/src/components/$1/index',
        '^@(.+)-actions/(.+)': '<rootDir>/../../packages/suite/src/actions/$1/$2',
        '^@(.+)-actions': '<rootDir>/../../packages/suite/src/actions/$1/index',
        '^@(.+)-reducers/(.+)': '<rootDir>/../../packages/suite/src/reducers/$1/$2',
        '^@(.+)-reducers': '<rootDir>/../../packages/suite/src/reducers/$1/index',
        '^@(.+)-config/(.+)': '<rootDir>/../../packages/suite/src/config/$1/$2',
        '^@(.+)-config': '<rootDir>/../../packages/suite/src/config/$1/index',
        '^@(.+)-constants/(.+)': '<rootDir>/../../packages/suite/src/constants/$1/$2',
        '^@(.+)-constants': '<rootDir>/../../packages/suite/src/constants/$1/index',
        '^@(.+)-support/(.+)': '<rootDir>/../../packages/suite/src/support/$1/$2',
        '^@(.+)-support': '<rootDir>/../../packages/suite/src/support/$1/index',
        '^@(.+)-utils/(.+)': '<rootDir>/../../packages/suite/src/utils/$1/$2',
        '^@(.+)-utils': '<rootDir>/../../packages/suite/src/utils/$1/index',
        '^@(.+)-types/(.+)': '<rootDir>/../../packages/suite/src/types/$1/$2',
        '^@(.+)-types': '<rootDir>/../../packages/suite/src/types/$1/index',
        '^@(.+)-middlewares/(.+)': '<rootDir>/../../packages/suite/src/middlewares/$1/$2',
        '^@(.+)-middlewares': '<rootDir>/../../packages/suite/src/middlewares/$1/index',
        '^@(.+)-hooks/(.+)': '<rootDir>/../../packages/suite/src/hooks/$1/$2',
        '^@(.+)-hooks': '<rootDir>/../../packages/suite/src/hooks/$1/index',
        '^@(.+)-services/(.+)': '<rootDir>/../../packages/suite/src/services/$1/$2',
        '^@(.+)-services': '<rootDir>/../../packages/suite/src/services/$1/index',
        '^@desktop/(.+)': './src/$1', // relative to this project
    },
    modulePathIgnorePatterns: ['node_modules'],
    transformIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    verbose: false,
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
        },
    },
};
