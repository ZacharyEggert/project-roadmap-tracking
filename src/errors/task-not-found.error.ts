import {PrtError, PrtErrorCode} from './base.error.js'

/**
 * Error thrown when a task cannot be found by its ID
 */
export class TaskNotFoundError extends PrtError {
  constructor(taskId: string, roadmapPath?: string) {
    super(`Task not found: ${taskId}`, PrtErrorCode.PRT_TASK_NOT_FOUND, {
      taskId,
      ...(roadmapPath && {roadmapPath}),
    })
  }
}
