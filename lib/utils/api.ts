import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasNextPage?: boolean;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiResponse['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  error: string | Error | ApiError,
  status: number = 500
): NextResponse<ApiResponse> {
  const message = error instanceof Error ? error.message : error;
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  return NextResponse.json(response, { status });
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    // Handle specific database errors
    if (error.message.includes('duplicate key value')) {
      return createErrorResponse('Resource already exists', 409);
    }
    if (error.message.includes('violates foreign key constraint')) {
      return createErrorResponse('Invalid reference', 400);
    }
    if (error.message.includes('violates not-null constraint')) {
      return createErrorResponse('Required field is missing', 400);
    }

    return createErrorResponse('Internal server error', 500);
  }

  return createErrorResponse('Unknown error occurred', 500);
}

// Validation helpers
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(`${fieldName} is required`, 400);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError('Invalid email format', 400);
  }
}

export function validateUUID(uuid: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ApiError(`Invalid ${fieldName} format`, 400);
  }
}