/**
 * OGMJ BRANDS — API Response Utilities
 * Standardized API responses and middleware
 * Last Updated: July 1, 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import { AppError } from './error.service'
import { logger } from './logger.service'

// ================================
// RESPONSE INTERFACES
// ================================

export interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
    details?: Record<string, any>
    requestId?: string
    timestamp: string
  }
}

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
    timestamp: string
    requestId?: string
  }
}

// ================================
// RESPONSE BUILDERS
// ================================

export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  requestId?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize)
  return {
    success: true,
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
      timestamp: new Date().toISOString(),
      requestId,
    },
  }
}

export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      requestId: error.requestId,
      timestamp: error.timestamp,
    },
  }
}

// ================================
// NEXT.JS RESPONSE UTILITIES
// ================================

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(createSuccessResponse(data, requestId), {
    status: statusCode,
  })
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  statusCode: number = 200,
  requestId?: string
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    createPaginatedResponse(data, page, pageSize, total, requestId),
    {
      status: statusCode,
    }
  )
}

export function errorResponse(error: AppError): NextResponse<ErrorResponse> {
  const response = createErrorResponse(error)
  return NextResponse.json(response, {
    status: error.statusCode,
  })
}

// ================================
// REQUEST UTILITIES
// ================================

export async function extractBusinessId(request: NextRequest): Promise<string | null> {
  // Try URL searchParams first
  const { searchParams } = new URL(request.url)
  const paramBusinessId = searchParams.get('business_id')
  if (paramBusinessId) return paramBusinessId

  // Try custom header
  const headerBusinessId = request.headers.get('X-Business-ID')
  if (headerBusinessId) return headerBusinessId

  // Try from body (for POST/PUT)
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json()
      if (body.business_id) return body.business_id
    } catch {
      // Invalid JSON, skip
    }
  }

  return null
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ================================
// MIDDLEWARE FOR API ROUTES
// ================================

export async function apiRouteHandler<T>(
  handler: (
    request: NextRequest,
    requestId: string,
    businessId: string
  ) => Promise<NextResponse<T>>,
  request: NextRequest
): Promise<NextResponse> {
  const requestId = generateRequestId()

  try {
    // Extract business ID
    const businessId = await extractBusinessId(request)
    if (!businessId) {
      const error = new AppError(
        'MISSING_REQUIRED_FIELD',
        400,
        'Business ID is required',
        { requestId }
      )
      logger.error('Missing business ID in request', { requestId })
      return errorResponse(error)
    }

    logger.info(`[${request.method}] ${request.nextUrl.pathname}`, {
      requestId,
      businessId,
      method: request.method,
    })

    // Execute handler
    const response = await handler(request, requestId, businessId)
    return response
  } catch (err) {
    const error = err instanceof AppError ? err : new AppError(
      'INTERNAL_ERROR',
      500,
      'An unexpected error occurred',
      { requestId }
    )

    logger.error(`API route error: ${request.nextUrl.pathname}`, {
      requestId,
      error: error.message,
      stack: err instanceof Error ? err.stack : undefined,
    })

    return errorResponse(error)
  }
}

// ================================
// VALIDATION MIDDLEWARE
// ================================

export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any // Zod schema
): Promise<T> {
  try {
    const body = await request.json()
    return await schema.parseAsync(body)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any
      const details: Record<string, any> = {}
      zodError.errors.forEach((err: any) => {
        const path = err.path.join('.')
        details[path] = err.message
      })
      throw new AppError('VALIDATION_ERROR', 422, 'Request validation failed', { details })
    }
    throw error
  }
}

// ================================
// PAGINATION HELPER
// ================================

export interface PaginationParams {
  page: number
  pageSize: number
}

export function extractPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))

  return { page, pageSize }
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

