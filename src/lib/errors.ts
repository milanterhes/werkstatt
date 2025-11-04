/**
 * Custom error classes for structured error handling with byethrow Result types.
 * These errors provide better type safety, error categorization, and metadata
 * for observability tools like OpenTelemetry.
 *
 * Uses @praha/error-factory for consistent error structure as recommended by byethrow.
 */

import { ErrorFactory } from "@praha/error-factory";

/**
 * Base error type that all custom errors extend.
 * Provides common properties for error categorization and metadata.
 */
export type BaseError = Error & {
  readonly code: string;
  readonly statusCode: number;
  readonly metadata?: Record<string, unknown>;
};

/**
 * Error thrown when a requested resource is not found.
 * HTTP Status: 404
 */
export class NotFoundError extends ErrorFactory({
  name: "NotFoundError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Resource not found",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Error thrown when request validation fails.
 * HTTP Status: 400
 */
export class ValidationError extends ErrorFactory({
  name: "ValidationError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Validation failed",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Error thrown when a database operation fails.
 * HTTP Status: 500
 */
export class DatabaseError extends ErrorFactory({
  name: "DatabaseError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Database operation failed",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Error thrown when a user is not authenticated.
 * HTTP Status: 401
 */
export class UnauthorizedError extends ErrorFactory({
  name: "UnauthorizedError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Unauthorized",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Error thrown when access to a resource is forbidden.
 * HTTP Status: 403
 */
export class ForbiddenError extends ErrorFactory({
  name: "ForbiddenError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Forbidden",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate key).
 * HTTP Status: 409
 */
export class ConflictError extends ErrorFactory({
  name: "ConflictError",
  message: (fields: {
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }) => fields.customMessage ?? "Resource conflict",
  fields: ErrorFactory.fields<{
    code: string;
    statusCode: number;
    customMessage?: string;
    metadata?: Record<string, unknown>;
  }>(),
}) {}

/**
 * Type guard to check if an error is a BaseError instance.
 */
export function isBaseError(error: unknown): error is BaseError {
  return (
    error instanceof Error &&
    "code" in error &&
    "statusCode" in error &&
    typeof (error as BaseError).code === "string" &&
    typeof (error as BaseError).statusCode === "number"
  );
}

/**
 * Type guard to check if an error is a specific error type.
 */
export function isErrorType<T extends BaseError>(
  error: unknown,
  ErrorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof ErrorClass;
}
