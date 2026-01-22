/**
 * Error codes for all PRT errors
 */
export enum PrtErrorCode {
  PRT_FILE_CONFIG_NOT_FOUND = 'PRT_FILE_CONFIG_NOT_FOUND',
  // File errors
  PRT_FILE_ROADMAP_NOT_FOUND = 'PRT_FILE_ROADMAP_NOT_FOUND',

  PRT_TASK_ID_INVALID = 'PRT_TASK_ID_INVALID',
  PRT_TASK_INVALID = 'PRT_TASK_INVALID',
  // Task errors
  PRT_TASK_NOT_FOUND = 'PRT_TASK_NOT_FOUND',

  // Generic
  PRT_UNKNOWN = 'PRT_UNKNOWN',
  PRT_VALIDATION_CIRCULAR_DEPENDENCY = 'PRT_VALIDATION_CIRCULAR_DEPENDENCY',

  // Validation errors
  PRT_VALIDATION_FAILED = 'PRT_VALIDATION_FAILED',
}

/**
 * Base error class for all PRT custom errors
 */
export class PrtError extends Error {
  public readonly code: PrtErrorCode
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    code: PrtErrorCode = PrtErrorCode.PRT_UNKNOWN,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.context = context

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
