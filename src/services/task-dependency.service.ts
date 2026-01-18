/* eslint-disable no-warning-comments */
import {Roadmap, Task, TaskID} from '../util/types.js'

/**
 * Represents a dependency graph as an adjacency list.
 * Maps task IDs to arrays of task IDs they depend on or block.
 */
export interface DependencyGraph {
  /** Map of task ID to array of task IDs it blocks */
  blocks: Map<TaskID, TaskID[]>
  /** Map of task ID to array of task IDs it depends on */
  dependsOn: Map<TaskID, TaskID[]>
}

/**
 * Represents a circular dependency cycle
 */
export interface CircularDependency {
  /** The cycle path as an array of task IDs (e.g., ['A', 'B', 'C', 'A']) */
  cycle: TaskID[]
  /** Human-readable description of the cycle */
  message: string
}

/**
 * Validation error for dependencies
 */
export interface DependencyValidationError {
  /** Error message */
  message: string
  /** Related task IDs (e.g., the invalid reference) */
  relatedTaskIds?: TaskID[]
  /** The task ID where the error occurred */
  taskId: TaskID
  /** The type of error */
  type: 'circular' | 'invalid-reference' | 'missing-task'
}

/**
 * TaskDependencyService provides operations for managing and validating task dependencies.
 * Includes dependency graph construction, circular dependency detection, and validation.
 *
 * @example
 * ```typescript
 * import taskDependencyService from './services/task-dependency.service.js';
 *
 * // Build dependency graph
 * const graph = taskDependencyService.buildGraph(roadmap.tasks);
 *
 * // Detect circular dependencies
 * const circular = taskDependencyService.detectCircular(roadmap.tasks);
 * if (circular) {
 *   console.log('Found circular dependency:', circular.message);
 * }
 *
 * // Validate all dependencies
 * const errors = taskDependencyService.validateDependencies(roadmap);
 * if (errors.length > 0) {
 *   console.log('Validation errors:', errors);
 * }
 * ```
 */
export class TaskDependencyService {
  /**
   * Builds a dependency graph from an array of tasks.
   * Creates adjacency lists for both depends-on and blocks relationships.
   *
   * @param tasks - The tasks to build the graph from
   * @returns A dependency graph with both depends-on and blocks relationships
   *
   * @example
   * ```typescript
   * const graph = taskDependencyService.buildGraph(roadmap.tasks);
   * console.log('Task B-001 depends on:', graph.dependsOn.get('B-001'));
   * console.log('Task F-001 blocks:', graph.blocks.get('F-001'));
   * ```
   */
  buildGraph(tasks: Task[]): DependencyGraph {
    const dependsOn = new Map<TaskID, TaskID[]>()
    const blocks = new Map<TaskID, TaskID[]>()

    // Initialize maps for all tasks
    for (const task of tasks) {
      dependsOn.set(task.id, task['depends-on'] || [])
      blocks.set(task.id, task.blocks || [])
    }

    return {blocks, dependsOn}
  }

  /**
   * Detects circular dependencies in tasks using depth-first search.
   * Returns the first circular dependency found, or null if none exist.
   *
   * Uses three-color DFS algorithm:
   * - White (unvisited): not yet explored
   * - Gray (visiting): currently in the DFS path (back edge = cycle)
   * - Black (visited): completely explored
   *
   * @param _tasks - The tasks to check for circular dependencies
   * @returns A CircularDependency object if a cycle is found, null otherwise
   *
   * @example
   * ```typescript
   * const circular = taskDependencyService.detectCircular(roadmap.tasks);
   * if (circular) {
   *   console.log('Circular dependency detected:', circular.message);
   *   // circular.cycle = ['A', 'B', 'C', 'A']
   * }
   * ```
   */
  detectCircular(_tasks: Task[]): CircularDependency | null {
    // TODO: Implement in P-042 using three-color DFS
    // For now, return null (no circular dependencies detected)
    return null
  }

  /**
   * Gets all tasks that are blocked by the specified task.
   * Returns tasks where this task appears in their depends-on array.
   *
   * @param task - The task to find blocked tasks for
   * @param allTasks - All tasks in the roadmap
   * @returns Array of tasks that are blocked by this task
   *
   * @example
   * ```typescript
   * const blockedTasks = taskDependencyService.getBlockedTasks(task, roadmap.tasks);
   * console.log(`${task.id} blocks ${blockedTasks.length} tasks`);
   * ```
   */
  getBlockedTasks(task: Task, allTasks: Task[]): Task[] {
    // Find all tasks that list this task in their depends-on array
    return allTasks.filter((t) => t['depends-on'].includes(task.id))
  }

  /**
   * Gets all tasks that this task depends on.
   * Returns tasks listed in this task's depends-on array.
   *
   * @param task - The task to find dependencies for
   * @param allTasks - All tasks in the roadmap
   * @returns Array of tasks that this task depends on
   *
   * @example
   * ```typescript
   * const dependencies = taskDependencyService.getDependsOnTasks(task, roadmap.tasks);
   * console.log(`${task.id} depends on ${dependencies.length} tasks`);
   * ```
   */
  getDependsOnTasks(task: Task, allTasks: Task[]): Task[] {
    // Find all tasks whose IDs are in this task's depends-on array
    const taskMap = new Map(allTasks.map((t) => [t.id, t]))
    return task['depends-on'].map((id) => taskMap.get(id)).filter((t): t is Task => t !== undefined)
  }

  /**
   * Sorts tasks in topological order (dependencies first).
   * Uses Kahn's algorithm or DFS-based topological sort.
   * Throws error if circular dependency exists.
   *
   * This is useful for executing tasks in the correct dependency order.
   *
   * @param tasks - The tasks to sort
   * @returns Tasks sorted in dependency order
   * @throws Error if circular dependency is detected
   *
   * @example
   * ```typescript
   * try {
   *   const sorted = taskDependencyService.topologicalSort(roadmap.tasks);
   *   console.log('Tasks in execution order:', sorted.map(t => t.id));
   * } catch (error) {
   *   console.error('Cannot sort: circular dependency exists');
   * }
   * ```
   */
  topologicalSort(tasks: Task[]): Task[] {
    // TODO: Implement in P-064 using Kahn's algorithm or DFS-based approach
    // For now, return tasks as-is
    return [...tasks]
  }

  /**
   * Validates all dependencies in a roadmap.
   * Checks for:
   * - Invalid task ID references (tasks that don't exist)
   * - Circular dependencies
   * - Missing tasks in depends-on or blocks arrays
   *
   * @param _roadmap - The roadmap to validate
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const errors = taskDependencyService.validateDependencies(roadmap);
   * if (errors.length > 0) {
   *   for (const error of errors) {
   *     console.log(`${error.taskId}: ${error.message}`);
   *   }
   * }
   * ```
   */
  validateDependencies(_roadmap: Roadmap): DependencyValidationError[] {
    // TODO: Implement in P-045
    // For now, return empty array (no errors)
    return []
  }
}

/**
 * Singleton instance of TaskDependencyService for convenience.
 * Import this to use the service without creating a new instance.
 *
 * @example
 * ```typescript
 * import taskDependencyService from './services/task-dependency.service.js';
 *
 * const graph = taskDependencyService.buildGraph(tasks);
 * ```
 */
const taskDependencyService = new TaskDependencyService()
export default taskDependencyService
