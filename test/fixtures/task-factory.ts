import {PRIORITY, STATUS, Task, TASK_TYPE, TaskID} from '../../src/util/types.js'

// Counter for generating unique sequential IDs within test runs
let taskCounter = 0

export function createTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? generateDefaultId(overrides.type ?? TASK_TYPE.Feature)
  const now = new Date().toISOString()

  return {
    assignedTo: null,
    blocks: [],
    createdAt: now,
    'depends-on': [],
    details: 'This is a test task created by the task factory',
    dueDate: null,
    effort: null,
    'github-refs': undefined,
    id,
    notes: null,
    'passes-tests': false,
    priority: PRIORITY.Medium,
    status: STATUS.NotStarted,
    tags: [],
    title: `Test Task ${taskCounter}`,
    type: TASK_TYPE.Feature,
    updatedAt: now,
    ...overrides,
  }
}

export function createTasks(count: number, overrides: Partial<Task> = {}): Task[] {
  return Array.from({length: count}, (_, i) =>
    createTask({
      ...overrides,
      title: `${overrides.title ?? 'Test Task'} ${i + 1}`,
    }),
  )
}

// Preset factories for each task type
export function createBugTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    priority: PRIORITY.High,
    title: `Bug: ${overrides.title ?? 'Test Bug'}`,
    type: TASK_TYPE.Bug,
    ...overrides,
  })
}

export function createFeatureTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    title: `Feature: ${overrides.title ?? 'Test Feature'}`,
    type: TASK_TYPE.Feature,
    ...overrides,
  })
}

export function createImprovementTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    title: `Improvement: ${overrides.title ?? 'Test Improvement'}`,
    type: TASK_TYPE.Improvement,
    ...overrides,
  })
}

export function createPlanningTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    title: `Planning: ${overrides.title ?? 'Test Planning'}`,
    type: TASK_TYPE.Planning,
    ...overrides,
  })
}

export function createResearchTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    priority: PRIORITY.Low,
    title: `Research: ${overrides.title ?? 'Test Research'}`,
    type: TASK_TYPE.Research,
    ...overrides,
  })
}

// Helper to generate a default task ID
function generateDefaultId(type: TASK_TYPE): TaskID {
  taskCounter++
  const num = String(taskCounter).padStart(3, '0')
  const prefix =
    type === TASK_TYPE.Bug
      ? 'B'
      : type === TASK_TYPE.Feature
        ? 'F'
        : type === TASK_TYPE.Improvement
          ? 'I'
          : type === TASK_TYPE.Planning
            ? 'P'
            : 'R'
  return `${prefix}-${num}` as TaskID
}

// Reset counter for test isolation
export function resetTaskCounter(): void {
  taskCounter = 0
}
