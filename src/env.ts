// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json')
export const __PROD__ = process.env.NODE_ENV === 'production'
export const __DEV__ = process.env.NODE_ENV === 'development'
export const __VERSION__ = version || process.env.VERSION
