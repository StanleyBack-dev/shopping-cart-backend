import { HttpException } from '@nestjs/common';

import { AppErrorDefinition } from './app-error-definition.type';

export interface AppExceptionBody {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * A domain/application-level error carrying a stable machine-readable `code`
 * alongside the HTTP status, so clients can branch on `code` instead of
 * parsing human-readable messages.
 */
export class AppException extends HttpException {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  private constructor(
    code: string,
    httpStatus: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, httpStatus);
    this.code = code;
    this.details = details;
  }

  static from<TParams>(
    definition: AppErrorDefinition<TParams>,
    params?: TParams,
    details?: Record<string, unknown>,
  ): AppException {
    const message =
      typeof definition.message === 'function'
        ? definition.message(params as TParams)
        : definition.message;

    return new AppException(definition.code, definition.httpStatus, message, details);
  }
}
