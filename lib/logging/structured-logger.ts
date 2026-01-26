/**
 * Structured Logging Service
 * Zero-cost enhancement for better observability and debugging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  module?: string
  tenantId?: string
  userId?: string
  requestId?: string
  action?: string
  duration?: number
  metadata?: Record<string, any>
}

export class StructuredLogger {
  private static instance: StructuredLogger
  private logLevel: LogLevel

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    const currentIndex = levels.indexOf(this.logLevel)
    const messageIndex = levels.indexOf(level)
    return messageIndex >= currentIndex
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    }

    return JSON.stringify(logEntry)
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatLog(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatLog(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog(LogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: {
          name: error?.name,
          message: error?.message,
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        },
      }
      console.error(this.formatLog(LogLevel.ERROR, message, errorContext))
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    }
    console.error(this.formatLog(LogLevel.FATAL, message, errorContext))
    
    // In production, send to error tracking service
    if (process.env.SENTRY_DSN && error) {
      // Sentry integration would go here
    }
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, `${method} ${path} ${statusCode}`, {
      ...context,
      duration,
      statusCode,
      method,
      path,
    })
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    if (duration > 1000) {
      // Log slow queries as warnings
      this.warn(`Slow query detected: ${duration}ms`, {
        ...context,
        query: query.substring(0, 200), // Truncate long queries
        duration,
      })
    } else if (this.shouldLog(LogLevel.DEBUG)) {
      this.debug(`Query executed: ${duration}ms`, {
        ...context,
        query: query.substring(0, 200),
        duration,
      })
    }
  }

  /**
   * Generic log method
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message, context)
        break
      case LogLevel.INFO:
        this.info(message, context)
        break
      case LogLevel.WARN:
        this.warn(message, context)
        break
      case LogLevel.ERROR:
        this.error(message, undefined, context)
        break
      case LogLevel.FATAL:
        this.fatal(message, undefined, context)
        break
    }
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance()
