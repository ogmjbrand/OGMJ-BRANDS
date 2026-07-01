/**
 * OGMJ BRANDS — Services Library Index
 * Central export point for all foundation services
 * Last Updated: July 1, 2026
 */

// Error Handling Service
export {
  AppError,
  ErrorCodes,
  handleError,
  createValidationError,
  createDatabaseError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createDuplicateError,
} from './error.service'

// Logging Service
export {
  LoggerService,
  logger,
  type LogLevel,
  type LogContext,
} from './logger.service'

// Validation Schemas
export {
  contactSchema,
  dealSchema,
  invoiceSchema,
  sequenceSchema,
  businessSchema,
  commonSchemas,
  validateInput,
  validateInputAsync,
  type Contact,
  type Deal,
  type Invoice,
  type Sequence,
  type Business,
} from './validators/schemas'

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
