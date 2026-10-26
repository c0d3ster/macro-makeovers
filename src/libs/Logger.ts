import {
  configure,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
} from '@logtape/logtape'

const isDevelopment = process.env.NODE_ENV === 'development'

configure({
  sinks: {
    console: getConsoleSink({ formatter: getJsonLinesFormatter() }),
  },
  loggers: [
    {
      category: ['logtape', 'meta'],
      sinks: ['console'],
      lowestLevel: 'warning',
    },
    {
      category: ['app'],
      sinks: ['console'],
      lowestLevel: isDevelopment ? 'debug' : 'info',
    },
  ],
})

export const logger = getLogger(['app'])
