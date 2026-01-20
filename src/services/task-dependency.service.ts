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
   * @param tasks - The tasks to check for circular dependencies
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
  detectCircular(tasks: Task[]): CircularDependency | null {
    const graph = this.buildUnifiedGraph(tasks)
    const visited = new Set<TaskID>()

    for (const task of tasks) {
      const path: TaskID[] = []
      if (this.hasCycle(task.id, graph, visited, path)) {
        const cycle = this.extractCycle(path)
        const message = `Circular dependency detected: ${cycle.join(' -> ')}`
        return {cycle, message}
      }
    }

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
   * @param roadmap - The roadmap to validate
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
  validateDependencies(roadmap: Roadmap): DependencyValidationError[] {
    const errors: DependencyValidationError[] = []

    // Step 1: Build valid task ID set for O(1) lookups
    const validTaskIds = new Set<TaskID>(roadmap.tasks.map((task) => task.id))

    // Step 2: Validate task references (check both depends-on and blocks arrays)
    for (const task of roadmap.tasks) {
      // Validate depends-on references
      if (task['depends-on']) {
        for (const depId of task['depends-on']) {
          if (!validTaskIds.has(depId)) {
            errors.push({
              message: `Task ${task.id} depends on non-existent task ${depId}`,
              relatedTaskIds: [depId],
              taskId: task.id,
              type: 'missing-task',
            })
          }
        }
      }

      // Validate blocks references
      if (task.blocks) {
        for (const blockId of task.blocks) {
          if (!validTaskIds.has(blockId)) {
            errors.push({
              message: `Task ${task.id} blocks non-existent task ${blockId}`,
              relatedTaskIds: [blockId],
              taskId: task.id,
              type: 'missing-task',
            })
          }
        }
      }
    }

    // Step 3: Detect circular dependencies
    const circular = this.detectCircular(roadmap.tasks)
    if (circular) {
      errors.push({
        message: circular.message,
        relatedTaskIds: circular.cycle,
        taskId: circular.cycle[0],
        type: 'circular',
      })
    }

    // Step 4: (Optional) Check for bidirectional consistency between depends-on and blocks
    // This step is commented out to avoid overly strict validation.
    // Uncomment if bidirectional consistency is required.

    const taskMap = new Map(roadmap.tasks.map((t) => [t.id, t]))
    const dependsOnMap = new Map<TaskID, Set<TaskID>>()

    for (const task of roadmap.tasks) {
      dependsOnMap.set(task.id, new Set(task['depends-on'] || []))
    }

    for (const task of roadmap.tasks) {
      if (task.blocks) {
        for (const blockedId of task.blocks) {
          const blockedTask = taskMap.get(blockedId)
          if (blockedTask) {
            const blockedDependsOn = dependsOnMap.get(blockedId)
            // eslint-disable-next-line max-depth
            if (blockedDependsOn && !blockedDependsOn.has(task.id)) {
              // Inconsistency found: task blocks blockedId, but blockedId does not depend on task
              errors.push({
                message: `Inconsistency: Task ${task.id} blocks ${blockedId}, but ${blockedId} does not depend on ${task.id}`,
                relatedTaskIds: [blockedId],
                taskId: task.id,
                type: 'invalid-reference',
              })
            }
          }
        }
      }
    }

    /*
    Note: Bidirectional consistency checking (blocks <-> depends-on symmetry)
    was considered but removed as it was too strict for practical use cases.
    The blocks and depends-on relationships can be used independently without
    requiring full symmetry.
			*/

    return errors
  }

  /**
   * Builds a unified dependency graph combining both depends-on and blocks relationships.
   * For depends-on: adds direct edges (task → dependency)
   * For blocks: adds reverse edges (if A blocks B, then B → A)
   *
   * @param tasks - The tasks to build the unified graph from
   * @returns Adjacency list representation of the unified graph
   */
  private buildUnifiedGraph(tasks: Task[]): Map<TaskID, TaskID[]> {
    const graph = new Map<TaskID, TaskID[]>()

    // Initialize empty adjacency lists for all tasks
    for (const task of tasks) {
      graph.set(task.id, [])
    }

    // Add edges from both depends-on and blocks relationships
    for (const task of tasks) {
      const edges = graph.get(task.id) || []

      // Add depends-on edges (task → dependency)
      for (const dependency of task['depends-on'] || []) {
        edges.push(dependency)
      }

      // Add blocks edges in reverse (if A blocks B, then B → A)
      for (const blockedTask of task.blocks || []) {
        const blockedEdges = graph.get(blockedTask) || []
        blockedEdges.push(task.id)
        graph.set(blockedTask, blockedEdges)
      }

      graph.set(task.id, edges)
    }

    return graph
  }

  /**
   * Extracts the cycle from a DFS path when a back edge is detected.
   * The path contains all nodes from root to the repeated node.
   *
   * @param path - The DFS path containing a cycle
   * @returns The cycle as an array of task IDs
   */
  private extractCycle(path: TaskID[]): TaskID[] {
    const repeatedNode = path.at(-1)!
    const firstOccurrence = path.indexOf(repeatedNode)
    return path.slice(firstOccurrence)
  }

  /**
   * Recursive DFS helper to detect cycles in the dependency graph.
   * Uses visited set (black nodes) and path array (gray nodes).
   *
   * @param taskId - Current task ID being explored
   * @param graph - The unified dependency graph
   * @param visited - Set of fully explored nodes (black)
   * @param path - Current DFS path (gray nodes)
   * @returns true if cycle detected, false otherwise
   */
  private hasCycle(taskId: TaskID, graph: Map<TaskID, TaskID[]>, visited: Set<TaskID>, path: TaskID[]): boolean {
    // Back edge detected - node already in current path
    if (path.includes(taskId)) {
      path.push(taskId) // Add repeated node to complete the cycle
      return true
    }

    // Already fully explored this node
    if (visited.has(taskId)) {
      return false
    }

    // Mark as visiting (gray node)
    visited.add(taskId)
    path.push(taskId)

    // Explore all neighbors
    const neighbors = graph.get(taskId) || []
    for (const neighbor of neighbors) {
      if (this.hasCycle(neighbor, graph, visited, path)) {
        return true
      }
    }

    // Backtrack - remove from path (node becomes black)
    path.pop()
    return false
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
