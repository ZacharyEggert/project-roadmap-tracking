import type {TaskID} from '../util/types.js'

import {PrtError, PrtErrorCode} from './base.error.js'

/**
 * Error thrown when circular dependencies are detected in tasks
 */
export class CircularDependencyError extends PrtError {
  constructor(cycle: TaskID[], message?: string) {
    const defaultMessage = `Circular dependency detected: ${cycle.join(' -> ')} -> ${cycle[0]}`
    super(message || defaultMessage, PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY, {
      cycle,
      cycleLength: cycle.length,
    })
  }
}
