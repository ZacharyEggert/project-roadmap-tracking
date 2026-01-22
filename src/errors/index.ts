// Base error and error codes
export { PrtError, PrtErrorCode } from './base.error.js'

export { CircularDependencyError } from './circular-dependency.error.js'
// Specific error classes
export { ConfigNotFoundError } from './config-not-found.error.js'
export { InvalidTaskError } from './invalid-task.error.js'
export { RoadmapNotFoundError } from './roadmap-not-found.error.js'
export { TaskNotFoundError } from './task-not-found.error.js'
export { ValidationError, type ValidationErrorDetail } from './validation.error.js'

// Import for type guards
import { PrtError, PrtErrorCode } from './base.error.js'

/**
 * Type guard to check if an error is a PrtError
 */
export function isPrtError(error: unknown): error is PrtError {
  return error instanceof PrtError
}

/**
 * Get the error code from an error, or null if not a PrtError
 */
export function getErrorCode(error: unknown): null | PrtErrorCode {
  if (isPrtError(error)) {
    return error.code
  }

  return null
}
