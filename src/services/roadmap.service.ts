import {readRoadmapFile} from '../util/read-roadmap.js'
import {PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../util/types.js'
import {validateTask} from '../util/validate-task.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

/**
 * Statistics about a roadmap's tasks
 */
export interface RoadmapStats {
  /** Count of tasks by priority */
  byPriority: {
    [PRIORITY.High]: number
    [PRIORITY.Low]: number
    [PRIORITY.Medium]: number
  }
  /** Count of tasks by status */
  byStatus: {
    [STATUS.Completed]: number
    [STATUS.InProgress]: number
    [STATUS.NotStarted]: number
  }
  /** Count of tasks by type */
  byType: {
    [TASK_TYPE.Bug]: number
    [TASK_TYPE.Feature]: number
    [TASK_TYPE.Improvement]: number
    [TASK_TYPE.Planning]: number
    [TASK_TYPE.Research]: number
  }
  /** Total number of tasks in the roadmap */
  totalTasks: number
}

/**
 * Validation error information
 */
export interface ValidationError {
  /** Error message */
  message: string
  /** Associated task ID if applicable */
  taskId?: string
  /** Type of validation error */
  type: 'duplicate-id' | 'invalid-reference' | 'structure' | 'task'
}

/**
 * RoadmapService provides core operations for managing roadmaps.
 * This service abstracts all file I/O and roadmap-level operations.
 */
export class RoadmapService {
  /**
   * Gets statistics about a roadmap's tasks.
   * Provides counts by status, type, and priority.
   *
   * @param roadmap - The roadmap to analyze
   * @returns Statistics object with task counts
   *
   * @example
   * ```typescript
   * const stats = roadmapService.getStats(roadmap);
   * console.log(`Completed: ${stats.byStatus.completed}`);
   * console.log(`Total: ${stats.totalTasks}`);
   * ```
   */
  getStats(roadmap: Roadmap): RoadmapStats {
    const stats: RoadmapStats = {
      byPriority: {
        [PRIORITY.High]: 0,
        [PRIORITY.Low]: 0,
        [PRIORITY.Medium]: 0,
      },
      byStatus: {
        [STATUS.Completed]: 0,
        [STATUS.InProgress]: 0,
        [STATUS.NotStarted]: 0,
      },
      byType: {
        [TASK_TYPE.Bug]: 0,
        [TASK_TYPE.Feature]: 0,
        [TASK_TYPE.Improvement]: 0,
        [TASK_TYPE.Planning]: 0,
        [TASK_TYPE.Research]: 0,
      },
      totalTasks: roadmap.tasks.length,
    }

    for (const task of roadmap.tasks) {
      // Count by status
      if (task.status in stats.byStatus) {
        stats.byStatus[task.status]++
      }

      // Count by type
      if (task.type in stats.byType) {
        stats.byType[task.type]++
      }

      // Count by priority
      if (task.priority in stats.byPriority) {
        stats.byPriority[task.priority]++
      }
    }

    return stats
  }

  /**
   * Loads a roadmap from a file.
   * Reads and parses the roadmap JSON file.
   *
   * @param path - The file path to read the roadmap from
   * @returns A Promise resolving to the Roadmap object
   * @throws Error if the file cannot be read or parsed
   *
   * @example
   * ```typescript
   * const roadmap = await roadmapService.load('./prt.json');
   * ```
   */
  async load(path: string): Promise<Roadmap> {
    try {
      return await readRoadmapFile(path)
    } catch (error) {
      throw new Error(`Failed to load roadmap from ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Saves a roadmap to a file.
   * Validates the roadmap before writing to ensure data integrity.
   *
   * @param path - The file path to write the roadmap to
   * @param roadmap - The roadmap object to save
   * @returns A Promise that resolves when the file is written
   * @throws Error if validation fails or the file cannot be written
   *
   * @example
   * ```typescript
   * await roadmapService.save('./prt.json', roadmap);
   * ```
   */
  async save(path: string, roadmap: Roadmap): Promise<void> {
    const errors = this.validate(roadmap)
    if (errors.length > 0) {
      throw new Error(`Cannot save invalid roadmap: ${errors.map((e) => e.message).join(', ')}`)
    }

    try {
      await writeRoadmapFile(path, roadmap)
    } catch (error) {
      throw new Error(`Failed to save roadmap to ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validates a roadmap's structure and data integrity.
   * Checks for valid structure, task validation, duplicate IDs, and reference integrity.
   *
   * @param roadmap - The roadmap to validate
   * @returns An array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const errors = roadmapService.validate(roadmap);
   * if (errors.length > 0) {
   *   console.error('Validation errors:', errors);
   * }
   * ```
   */
  validate(roadmap: Roadmap): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate roadmap structure
    this.validateStructure(roadmap, errors)

    // If structure is invalid, return early
    if (errors.some((e) => e.type === 'structure' && e.message.includes('tasks array'))) {
      return errors
    }

    // Validate tasks and collect IDs
    const taskIds = this.validateTasks(roadmap.tasks, errors)

    // Validate task references
    this.validateReferences(roadmap.tasks, taskIds, errors)

    return errors
  }

  /**
   * Validates roadmap metadata
   * @param metadata - The metadata to validate
   * @param errors - Array to collect errors
   */
  private validateMetadata(metadata: Roadmap['metadata'], errors: ValidationError[]): void {
    if (!metadata.name || typeof metadata.name !== 'string') {
      errors.push({message: 'Roadmap metadata must have a name', type: 'structure'})
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
      errors.push({message: 'Roadmap metadata must have a description', type: 'structure'})
    }

    if (!metadata.createdBy || typeof metadata.createdBy !== 'string') {
      errors.push({message: 'Roadmap metadata must have a createdBy', type: 'structure'})
    }

    if (!metadata.createdAt || typeof metadata.createdAt !== 'string') {
      errors.push({message: 'Roadmap metadata must have a createdAt', type: 'structure'})
    }
  }

  /**
   * Validates task references (depends-on and blocks)
   * @param tasks - The tasks to validate
   * @param taskIds - Set of valid task IDs
   * @param errors - Array to collect errors
   */
  private validateReferences(tasks: Roadmap['tasks'], taskIds: Set<string>, errors: ValidationError[]): void {
    for (const task of tasks) {
      if (task['depends-on']) {
        for (const depId of task['depends-on']) {
          if (!taskIds.has(depId)) {
            errors.push({
              message: `Task ${task.id} depends on non-existent task ${depId}`,
              taskId: task.id,
              type: 'invalid-reference',
            })
          }
        }
      }

      if (task.blocks) {
        for (const blockId of task.blocks) {
          if (!taskIds.has(blockId)) {
            errors.push({
              message: `Task ${task.id} blocks non-existent task ${blockId}`,
              taskId: task.id,
              type: 'invalid-reference',
            })
          }
        }
      }
    }
  }

  /**
   * Validates the basic structure of a roadmap
   * @param roadmap - The roadmap to validate
   * @param errors - Array to collect errors
   */
  private validateStructure(roadmap: Roadmap, errors: ValidationError[]): void {
    if (!roadmap || typeof roadmap !== 'object') {
      errors.push({message: 'Roadmap must be an object', type: 'structure'})
      return
    }

    if (!roadmap.$schema || typeof roadmap.$schema !== 'string') {
      errors.push({message: 'Roadmap must have a $schema property', type: 'structure'})
    }

    if (!roadmap.metadata || typeof roadmap.metadata !== 'object') {
      errors.push({message: 'Roadmap must have a metadata object', type: 'structure'})
    } else {
      this.validateMetadata(roadmap.metadata, errors)
    }

    if (!Array.isArray(roadmap.tasks)) {
      errors.push({message: 'Roadmap must have a tasks array', type: 'structure'})
    }
  }

  /**
   * Validates tasks and checks for duplicates
   * @param tasks - The tasks to validate
   * @param errors - Array to collect errors
   * @returns Set of valid task IDs
   */
  private validateTasks(tasks: Roadmap['tasks'], errors: ValidationError[]): Set<string> {
    const taskIds = new Set<string>()

    for (const task of tasks) {
      try {
        validateTask(task)
      } catch (error) {
        errors.push({
          message: error instanceof Error ? error.message : String(error),
          taskId: task.id,
          type: 'task',
        })
      }

      // Check for duplicate IDs
      if (taskIds.has(task.id)) {
        errors.push({
          message: `Duplicate task ID: ${task.id}`,
          taskId: task.id,
          type: 'duplicate-id',
        })
      }

      taskIds.add(task.id)
    }

    return taskIds
  }
}

/**
 * Default export instance of RoadmapService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import roadmapService from './services/roadmap.service.js';
 * const roadmap = await roadmapService.load('./prt.json');
 * ```
 */
export default new RoadmapService()
