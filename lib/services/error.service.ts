/**
 * OGMJ BRANDS — Error Handling Service
 * Centralized error management with standardized responses
 * Last Updated: July 1, 2026
 */

import { logger } from './logger.service'

// ================================
// ERROR CODES
// ================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',

  // Business Logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // External Services
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  API_ERROR: 'API_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

// ================================
// ERROR CLASS
// ================================

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly requestId?: string
  public readonly timestamp: string

  constructor(
    code: ErrorCode,
    statusCode: number,
    message: string,
    options?: {
      details?: Record<string, any>
      requestId?: string
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = options?.details
    this.requestId = options?.requestId
    this.timestamp = new Date().toISOString()

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        requestId: this.requestId,
        timestamp: this.timestamp,
      },
    }
  }
}

// ================================
// ERROR HANDLER
// ================================

export function handleError(
  error: unknown,
  context?: {
    userId?: string
    businessId?: string
    requestId?: string
    endpoint?: string
  }
): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    logger.error(error.message, {
      code: error.code,
      statusCode: error.statusCode,
      ...context,
    })
    return error
  }

  // Supabase Auth Error
  if (error instanceof Error && error.message.includes('JWT')) {
    const appError = new AppError(
      ErrorCodes.INVALID_TOKEN,
      401,
      'Invalid or expired authentication token',
      { requestId: context?.requestId }
    )
    logger.error('JWT Error', { error: error.message, ...context })
    return appError
  }

  // Database errors (Supabase Postgrest)
  if (error instanceof Error && error.message.includes('duplicate')) {
    const appError = new AppError(
      ErrorCodes.DUPLICATE_ENTRY,
      409,
      'This entry already exists',
      { requestId: context?.requestId }
    )
    logger.error('Duplicate entry error', { error: error.message, ...context })
    return appError
  }

  if (error instanceof Error && error.message.includes('not found')) {
    const appError = new AppError(
      ErrorCodes.NOT_FOUND,
      404,
      'Resource not found',
      { requestId: context?.requestId }
    )
    logger.error('Not found error', { error: error.message, ...context })
    return appError
  }

  // Generic Error
  if (error instanceof Error) {
    const appError = new AppError(
      ErrorCodes.INTERNAL_ERROR,
      500,
      error.message || 'An unexpected error occurred',
      { requestId: context?.requestId }
    )
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      ...context,
    })
    return appError
  }

  // Unknown error
  const appError = new AppError(
    ErrorCodes.INTERNAL_ERROR,
    500,
    'An unknown error occurred',
    { requestId: context?.requestId }
  )
  logger.error('Unknown error', { error: String(error), ...context })
  return appError
}

// ================================
// SPECIFIC ERROR FACTORIES
// ================================

export function createValidationError(
  message: string,
  details?: Record<string, any>,
  requestId?: string
): AppError {
  return new AppError(ErrorCodes.VALIDATION_ERROR, 422, message, {
    details,
    requestId,
  })
}

export function createAuthError(
  message = 'Authentication required',
  requestId?: string
): AppError {
  return new AppError(ErrorCodes.UNAUTHORIZED, 401, message, { requestId })
}

export function createForbiddenError(
  message = 'Access denied',
  requestId?: string
): AppError {
  return new AppError(ErrorCodes.FORBIDDEN, 403, message, { requestId })
}

export function createNotFoundError(
  resource: string,
  requestId?: string
): AppError {
  return new AppError(
    ErrorCodes.NOT_FOUND,
    404,
    `${resource} not found`,
    { requestId }
  )
}

export function createConflictError(
  message: string,
  requestId?: string
): AppError {
  return new AppError(ErrorCodes.RESOURCE_CONFLICT, 409, message, { requestId })
}

export function createInternalError(
  message = 'An internal error occurred',
  requestId?: string
): AppError {
  return new AppError(ErrorCodes.INTERNAL_ERROR, 500, message, { requestId })
}
