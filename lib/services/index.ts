/**
 * OGMJ BRANDS — Services Library Index
 * Central export point for all foundation services
 * Last Updated: July 6, 2026
 */

// Error Handling Service
export {
  AppError,
  ErrorCodes,
  type ErrorCode,
  handleError,
  createValidationError,
  createAuthError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createInternalError,
} from './error.service'

// Logging Service
export {
  logger,
  LogLevel,
  createLogContext,
  type LogEntry,
} from './logger.service'

// Validation Schemas
export * from '../validators/schemas'

// API Response Utilities
export {
  createSuccessResponse,
  createPaginatedResponse,
  createErrorResponse,
  successResponse,
  paginatedResponse,
  errorResponse,
  extractBusinessId,
  generateRequestId,
  apiRouteHandler,
  validateRequestBody,
  extractPaginationParams,
  calculateOffset,
  type SuccessResponse,
  type ErrorResponse,
  type APIResponse,
  type PaginatedResponse,
  type PaginationParams,
} from './api.service'

