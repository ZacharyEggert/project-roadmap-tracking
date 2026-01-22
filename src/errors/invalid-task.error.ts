import {PrtError, PrtErrorCode} from './base.error.js'

/**
 * Error thrown when a task fails validation
 */
export class InvalidTaskError extends PrtError {
  constructor(message: string, taskId?: string, validationField?: string) {
    super(message, PrtErrorCode.PRT_TASK_INVALID, {
      ...(taskId && {taskId}),
      ...(validationField && {validationField}),
    })
  }
}
