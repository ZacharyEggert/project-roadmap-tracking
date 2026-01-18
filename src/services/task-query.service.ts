import {PRIORITY, STATUS, Task, TASK_TYPE} from '../util/types.js'

/**
 * Sort order for sorting operations
 */
export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

/**
 * Fields that can be used for sorting tasks
 */
export type SortField = 'createdAt' | 'dueDate' | 'effort' | 'priority' | 'status' | 'title' | 'type' | 'updatedAt'

/**
 * Criteria for filtering tasks
 */
export interface FilterCriteria {
  /** Filter by assigned user */
  assignedTo?: null | string
  /** Filter by whether task blocks others */
  hasBlocks?: boolean
  /** Filter by whether task has dependencies */
  hasDependencies?: boolean
  /** Filter by priority level */
  priority?: PRIORITY
  /** Filter by status (single status or array of statuses) */
  status?: STATUS | STATUS[]
  /** Filter by tags (tasks must have all specified tags) */
  tags?: Array<string>
  /** Filter by type */
  type?: TASK_TYPE
}

/**
 * TaskQueryService provides operations for querying, filtering, and sorting tasks.
 * All operations are pure functions that do not mutate the input arrays.
 */
export class TaskQueryService {
  /**
   * Filters tasks based on the provided criteria.
   * Returns tasks that match ALL specified criteria (AND logic).
   *
   * @param tasks - The tasks to filter
   * @param criteria - The filter criteria to apply
   * @returns A new array of tasks matching the criteria
   *
   * @example
   * ```typescript
   * const highPriorityTasks = taskQueryService.filter(tasks, {
   *   priority: PRIORITY.High,
   *   status: STATUS.InProgress
   * });
   * ```
   */
  filter(tasks: Array<Task>, criteria: FilterCriteria): Array<Task> {
    const filtered = tasks.filter((task) => {
      // Check status filter - support both single status and array of statuses
      if (criteria.status !== undefined) {
        const statusMatch = Array.isArray(criteria.status)
          ? criteria.status.includes(task.status)
          : task.status === criteria.status
        if (!statusMatch) {
          return false
        }
      }

      // Check type filter
      if (criteria.type !== undefined && task.type !== criteria.type) {
        return false
      }

      // Check priority filter
      if (criteria.priority !== undefined && task.priority !== criteria.priority) {
        return false
      }

      // Check assignedTo filter
      if (criteria.assignedTo !== undefined && task.assignedTo !== criteria.assignedTo) {
        return false
      }

      // Check tags filter - task must have all specified tags
      if (criteria.tags !== undefined && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every((tag) => task.tags.includes(tag))
        if (!hasAllTags) {
          return false
        }
      }

      // Check hasBlocks filter
      if (criteria.hasBlocks !== undefined) {
        const taskHasBlocks = task.blocks.length > 0
        if (taskHasBlocks !== criteria.hasBlocks) {
          return false
        }
      }

      // Check hasDependencies filter
      if (criteria.hasDependencies !== undefined) {
        const taskHasDependencies = task['depends-on'].length > 0
        if (taskHasDependencies !== criteria.hasDependencies) {
          return false
        }
      }

      return true
    })

    return filtered
  }

  /**
   * Gets all tasks with a specific status.
   * This is a convenience method that uses the filter method.
   *
   * @param tasks - The tasks to search
   * @param status - The status to filter by
   * @returns A new array of tasks with the specified status
   *
   * @example
   * ```typescript
   * const completedTasks = taskQueryService.getByStatus(tasks, STATUS.Completed);
   * ```
   */
  getByStatus(tasks: Array<Task>, status: STATUS): Array<Task> {
    const criteria: FilterCriteria = {status}
    const filtered = tasks.filter((task) => {
      if (criteria.status !== undefined && task.status !== criteria.status) {
        return false
      }

      return true
    })
    return filtered
  }

  /**
   * Gets all tasks of a specific type.
   * This is a convenience method that uses the filter method.
   *
   * @param tasks - The tasks to search
   * @param type - The type to filter by
   * @returns A new array of tasks with the specified type
   *
   * @example
   * ```typescript
   * const featureTasks = taskQueryService.getByType(tasks, TASK_TYPE.Feature);
   * ```
   */
  getByType(tasks: Array<Task>, type: TASK_TYPE): Array<Task> {
    const criteria: FilterCriteria = {type}
    const filtered = tasks.filter((task) => {
      if (criteria.type !== undefined && task.type !== criteria.type) {
        return false
      }

      return true
    })
    return filtered
  }

  /**
   * Searches for tasks matching a query string in title or details.
   * The search is case-insensitive.
   *
   * @param tasks - The tasks to search
   * @param query - The search query string
   * @returns A new array of tasks matching the query
   *
   * @example
   * ```typescript
   * const loginTasks = taskQueryService.search(tasks, 'login');
   * ```
   */
  search(tasks: Array<Task>, query: string): Array<Task> {
    if (!query || query.trim() === '') {
      return [...tasks]
    }

    const lowerQuery = query.toLowerCase()
    return tasks.filter((task) => {
      const titleMatch = task.title.toLowerCase().includes(lowerQuery)
      const detailsMatch = task.details.toLowerCase().includes(lowerQuery)
      return detailsMatch || titleMatch
    })
  }

  /**
   * Sorts tasks by the specified field and order.
   * Returns a new sorted array without mutating the original.
   *
   * @param tasks - The tasks to sort
   * @param field - The field to sort by
   * @param order - The sort order (ascending or descending)
   * @returns A new sorted array of tasks
   *
   * @example
   * ```typescript
   * const sorted = taskQueryService.sort(tasks, 'priority', SortOrder.Descending);
   * ```
   */
  sort(tasks: Array<Task>, field: SortField, order: SortOrder = SortOrder.Ascending): Array<Task> {
    const sortedTasks = [...tasks]

    // eslint-disable-next-line complexity
    sortedTasks.sort((a, b) => {
      let aValue: null | number | string | undefined
      let bValue: null | number | string | undefined

      // Get values based on field
      switch (field) {
        case 'createdAt': {
          aValue = a.createdAt ?? ''
          bValue = b.createdAt ?? ''
          break
        }

        case 'dueDate': {
          aValue = a.dueDate ?? ''
          bValue = b.dueDate ?? ''
          break
        }

        case 'effort': {
          aValue = a.effort
          bValue = b.effort
          break
        }

        case 'priority': {
          // Sort priority as: high > medium > low
          const priorityOrder = {
            [PRIORITY.High]: 3,
            [PRIORITY.Low]: 1,
            [PRIORITY.Medium]: 2,
          }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        }

        case 'status': {
          // Sort status as: not-started > in-progress > completed
          const statusOrder = {
            [STATUS.Completed]: 3,
            [STATUS.InProgress]: 2,
            [STATUS.NotStarted]: 1,
          }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        }

        case 'title': {
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        }

        case 'type': {
          // Sort type alphabetically by enum value
          aValue = a.type
          bValue = b.type
          break
        }

        case 'updatedAt': {
          aValue = a.updatedAt ?? ''
          bValue = b.updatedAt ?? ''
          break
        }

        default: {
          return 0
        }
      }

      // Handle null/undefined values - push them to the end
      if (aValue === null || aValue === undefined || aValue === '') {
        return 1
      }

      if (bValue === null || bValue === undefined || bValue === '') {
        return -1
      }

      // Compare values
      let comparison = 0
      if (aValue < bValue) {
        comparison = -1
      } else if (aValue > bValue) {
        comparison = 1
      }

      // Apply sort order
      return order === SortOrder.Ascending ? comparison : -comparison
    })

    return sortedTasks
  }
}

/**
 * Default export instance of TaskQueryService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import taskQueryService from './services/task-query.service.js';
 * const filtered = taskQueryService.filter(tasks, { status: STATUS.InProgress });
 * ```
 */
export default new TaskQueryService()
