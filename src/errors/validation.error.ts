import { PrtError, PrtErrorCode } from './base.error.js'

/**
 * Details about a single validation error
 */
export interface ValidationErrorDetail {
  field?: string
  message: string
  taskId?: string
  type: 'circular-dependency' | 'duplicate-id' | 'invalid-reference' | 'invalid-value' | 'missing-field' | 'missing-task' | 'structure' | 'task'
}

/**
 * Error thrown when validation fails with multiple issues
 */
export class ValidationError extends PrtError {
  constructor(errors: ValidationErrorDetail[]) {
    const errorCount = errors.length
    const errorTypes = [...new Set(errors.map((e) => e.type))]
    const message = `Validation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}`

    super(message, PrtErrorCode.PRT_VALIDATION_FAILED, {
      errorCount,
      errors,
      errorTypes,
    })
  }
}
