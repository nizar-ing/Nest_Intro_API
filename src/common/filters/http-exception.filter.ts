import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Global exception filter — catches every unhandled exception in the application
 * and normalises it into a single, consistent error response envelope:
 *
 *   { statusCode, timestamp, path, message }
 *
 * Two distinct categories are handled explicitly:
 *
 * 1. TypeORM QueryFailedError — raw database errors that would otherwise surface
 *    as opaque 500s with implementation-leaking stack traces. We map PostgreSQL
 *    SQLSTATE codes to safe HTTP responses. We do NOT forward pg's `detail` string
 *    because it contains column/table names (information-disclosure risk).
 *
 * 2. NestJS HttpException (and all subclasses: NotFoundException, ConflictException,
 *    BadRequestException, etc.) — these carry the intended status code and message
 *    already; we just normalise the response shape so clients always get the same
 *    envelope regardless of which exception was thrown.
 *
 * Anything else (unexpected runtime error) falls through to a generic 500.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    console.error(exception);

    let statusCode: number;
    let message: string;

    if (exception instanceof QueryFailedError) {
      // driverError.code is the PostgreSQL SQLSTATE code (string).
      // We map only the codes we can handle safely; everything else → 500.
      const pgCode = (exception as any).driverError?.code as string | undefined;

      switch (pgCode) {
        case '23505': // unique_violation
          statusCode = HttpStatus.CONFLICT;
          message    = 'A record with the provided value already exists.';
          break;
        case '23503': // foreign_key_violation
          statusCode = HttpStatus.BAD_REQUEST;
          message    = 'The referenced resource does not exist.';
          break;
        case '23502': // not_null_violation
          statusCode = HttpStatus.BAD_REQUEST;
          message    = 'A required field was not provided.';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message    = 'An unexpected database error occurred.';
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      // getResponse() returns either a string or the default NestJS error object
      // { statusCode, message, error }. ValidationPipe returns message as string[].
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const raw = (exceptionResponse as any).message;
        message   = Array.isArray(raw) ? (raw as string[]).join('; ') : String(raw);
      } else {
        message = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message    = 'Internal server error';
    }

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path:      request.url,
      message,
    });
  }
}
