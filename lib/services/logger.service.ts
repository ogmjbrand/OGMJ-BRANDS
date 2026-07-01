/**
 * OGMJ BRANDS — Logging Service
 * Structured logging with multi-level support
 * Last Updated: July 1, 2026
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

// ================================
// LOG ENTRY INTERFACE
// ================================

export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  context?: Record<string, any>
  requestId?: string
  userId?: string
  businessId?: string
  error?: {
    code?: string
    message: string
    stack?: string
  }
}

// ================================
// LOGGER SERVICE
// ================================

class LoggerService {
  private static instance: LoggerService
  private minLevel: LogLevel = LogLevel.DEBUG
  private isDevelopment = process.env.NODE_ENV === 'development'

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService()
    }
    return LoggerService.instance
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)
    return currentIndex >= minIndex
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context)
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
    }

    // Console output
    this.outputToConsole(entry)

    // Production monitoring
    if (!this.isDevelopment) {
      this.sendToMonitoring(entry)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level}] ${entry.timestamp}`
    const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : ''

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, contextStr)
        break
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, contextStr)
        break
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, contextStr)
        break
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, contextStr)
        break
      case LogLevel.FATAL:
        console.error(`${prefix} ${entry.message}`, contextStr)
        break
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Implement Sentry, DataDog, or similar
    // For now, just log to console in production
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      console.error('[PRODUCTION LOG]', entry)
    }
  }
}

// ================================
// SINGLETON EXPORT
// ================================

export const logger = LoggerService.getInstance()

// ================================
// CONTEXT HELPERS
// ================================

export function createLogContext(
  userId?: string,
  businessId?: string,
  requestId?: string
): Record<string, any> {
  return {
    ...(userId && { userId }),
    ...(businessId && { businessId }),
    ...(requestId && { requestId }),
    timestamp: new Date().toISOString(),
  }
}
