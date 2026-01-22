/* eslint-disable jsdoc/check-param-names */
import {TaskNotFoundError} from '../errors/index.js'
import {PRIORITY, Roadmap, STATUS, Task, TASK_TYPE, TASK_TYPE_MAP, TaskID} from '../util/types.js'
import {validateTask} from '../util/validate-task.js'

/**
 * TaskService provides core operations for managing tasks in a roadmap.
 * This service handles task creation, ID generation, and task manipulation.
 */
export class TaskService {
  /**
   * Adds a task to the roadmap and returns a new roadmap object.
   * This method does not mutate the original roadmap.
   * Validates the task before adding to ensure data integrity.
   *
   * @param roadmap - The roadmap to add the task to
   * @param task - The task to add
   * @returns A new Roadmap object with the task added
   * @throws Error if the task is invalid
   *
   * @example
   * ```typescript
   * const task = taskService.createTask({ ... });
   * const updatedRoadmap = taskService.addTask(roadmap, task);
   * ```
   */
  addTask(roadmap: Roadmap, task: Task): Roadmap {
    validateTask(task)
    return {
      ...roadmap,
      tasks: [...roadmap.tasks, task],
    }
  }

  /**
   * Creates a new task object with the provided data and default values.
   * Automatically sets createdAt, updatedAt timestamps and initializes arrays.
   *
   * @name createTask
   *
   * @param data - Partial task data to create the task from
   * @param {Array<Task['id']> | undefined} data.blocks - IDs of tasks blocked by this task
   * @param {boolean | undefined} data.passes-tests - Whether the task passes tests
   * @param {Array<Task['id']> | undefined} data.depends-on - IDs of tasks this task depends on
   * @param {string} data.details - Detailed description of the task
   * @param {TaskID} data.id - Unique identifier for the task
   * @param {string | undefined} data.notes - Additional notes for the task
   * @param {PRIORITY | undefined} data.priority - Priority level of the task
   * @param {STATUS | undefined} data.status - Current status of the task
   * @param {Array<string> | undefined} data.tags - Tags associated with the task
   * @param {string} data.title - Title of the task
   * @param {TASK_TYPE} data.type - Type of the task (bug, feature, etc.)
   * @returns A complete Task object with all required fields
   *
   * @example
   * ```typescript
   * const task = taskService.createTask({
   *   id: 'F-001',
   *   title: 'Add login feature',
   *   details: 'Implement user authentication',
   *   type: TASK_TYPE.Feature,
   *   priority: PRIORITY.High,
   * });
   * ```
   */
  createTask(data: {
    blocks?: Array<Task['id']>
    'depends-on'?: Array<Task['id']>
    details: string
    id: TaskID
    notes?: string
    'passes-tests'?: boolean
    priority?: PRIORITY
    status?: STATUS
    tags?: Array<string>
    title: string
    type: TASK_TYPE
  }): Task {
    return {
      blocks: data.blocks ?? [],
      createdAt: new Date().toISOString(),
      'depends-on': data['depends-on'] ?? [],
      details: data.details,
      id: data.id,
      notes: data.notes ?? '',
      'passes-tests': data['passes-tests'] ?? false,
      priority: data.priority ?? PRIORITY.Medium,
      status: data.status ?? STATUS.NotStarted,
      tags: data.tags ?? [],
      title: data.title,
      type: data.type,
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Finds a task in the roadmap by its ID.
   *
   * @param roadmap - The roadmap to search
   * @param taskId - The ID of the task to find
   * @returns The task if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const task = taskService.findTask(roadmap, 'F-001');
   * if (task) {
   *   console.log(task.title);
   * }
   * ```
   */
  findTask(roadmap: Roadmap, taskId: string): Task | undefined {
    return roadmap.tasks.find((task) => task.id === taskId)
  }

  /**
   * Generates the next available task ID for a given task type.
   * IDs follow the format: {TYPE_LETTER}-{NNN} where TYPE_LETTER is B, F, I, P, or R
   * and NNN is a zero-padded 3-digit number starting from 001.
   *
   * @param roadmap - The roadmap containing existing tasks
   * @param taskType - The type of task (bug, feature, improvement, planning, research)
   * @returns The next available task ID for the given type
   *
   * @example
   * ```typescript
   * const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature);
   * // Returns "F-001" if no features exist, or "F-042" if F-041 is the highest
   * ```
   */
  generateNextId(roadmap: Roadmap, taskType: TASK_TYPE): TaskID {
    const existingTaskIDs = new Set(roadmap.tasks.filter((task) => task.type === taskType).map((task) => task.id))

    let newIDNumber = 1
    let newTaskID: TaskID

    while (true) {
      const potentialID = `${TASK_TYPE_MAP.get(taskType)}-${String(newIDNumber).padStart(3, '0')}` as TaskID
      if (!existingTaskIDs.has(potentialID)) {
        newTaskID = potentialID
        break
      }

      newIDNumber++
    }

    return newTaskID
  }

  /**
   * Updates an existing task in the roadmap with the provided updates.
   * Automatically updates the updatedAt timestamp.
   * This method does not mutate the original roadmap.
   *
   * @param roadmap - The roadmap containing the task to update
   * @param taskId - The ID of the task to update
   * @param updates - Partial task object with fields to update
   * @returns A new Roadmap object with the task updated
   * @throws Error if the task with the given ID is not found
   *
   * @example
   * ```typescript
   * const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
   *   status: STATUS.Completed,
   *   'passes-tests': true,
   * });
   * ```
   */
  updateTask(roadmap: Roadmap, taskId: string, updates: Partial<Task>): Roadmap {
    const taskIndex = roadmap.tasks.findIndex((task) => task.id === taskId)
    if (taskIndex === -1) {
      throw new TaskNotFoundError(taskId)
    }

    const updatedTask = {
      ...roadmap.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return {
      ...roadmap,
      tasks: [...roadmap.tasks.slice(0, taskIndex), updatedTask, ...roadmap.tasks.slice(taskIndex + 1)],
    }
  }
}

/**
 * Default export instance of TaskService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import taskService from './services/task.service.js';
 * const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature);
 * ```
 */
export default new TaskService()
