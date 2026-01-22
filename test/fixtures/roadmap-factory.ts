import {PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {
  createBugTask,
  createFeatureTask,
  createImprovementTask,
  createPlanningTask,
  createTask,
  resetTaskCounter,
} from './task-factory.js'

export function createRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  const now = new Date().toISOString()

  return {
    $schema: 'https://example.com/roadmap-schema.json',
    metadata: {
      createdAt: now,
      createdBy: 'Test User',
      description: 'Test roadmap created by roadmap factory',
      name: 'Test Roadmap',
    },
    tasks: [],
    ...overrides,
  }
}

export function createEmptyRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  return createRoadmap({
    ...overrides,
    tasks: [],
  })
}

export function createSimpleRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  resetTaskCounter()

  const tasks = [
    createFeatureTask({title: 'Add user authentication'}),
    createBugTask({title: 'Fix login bug'}),
    createImprovementTask({title: 'Improve performance'}),
    createPlanningTask({title: 'Plan Q2 roadmap'}),
  ]

  return createRoadmap({
    ...overrides,
    tasks,
  })
}

export function createComplexRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  resetTaskCounter()

  // Create tasks with various states and dependencies
  const task1 = createFeatureTask({
    priority: PRIORITY.High,
    status: STATUS.Completed,
    title: 'Foundation task',
  })

  const task2 = createFeatureTask({
    'depends-on': [task1.id],
    priority: PRIORITY.High,
    status: STATUS.InProgress,
    title: 'Dependent feature',
  })

  const task3 = createBugTask({
    priority: PRIORITY.High,
    status: STATUS.NotStarted,
    title: 'Critical bug',
  })

  const task4 = createImprovementTask({
    'depends-on': [task1.id, task2.id],
    priority: PRIORITY.Medium,
    status: STATUS.NotStarted,
    title: 'Performance optimization',
  })

  const task5 = createPlanningTask({
    priority: PRIORITY.Low,
    status: STATUS.Completed,
    title: 'Architecture planning',
  })

  const task6 = createTask({
    assignedTo: 'Alice',
    'depends-on': [task3.id],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    effort: 8,
    priority: PRIORITY.High,
    status: STATUS.NotStarted,
    tags: ['urgent', 'frontend'],
    title: 'Fix UI issues',
    type: TASK_TYPE.Bug,
  })

  const task7 = createTask({
    assignedTo: 'Bob',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    effort: 13,
    notes: 'This task requires backend and frontend work',
    priority: PRIORITY.Medium,
    status: STATUS.InProgress,
    tags: ['backend', 'api'],
    title: 'API integration',
    type: TASK_TYPE.Feature,
  })

  const task8 = createTask({
    'depends-on': [task7.id],
    effort: 5,
    'github-refs': ['#123', '#456'],
    'passes-tests': true,
    priority: PRIORITY.Low,
    status: STATUS.Completed,
    tags: ['testing'],
    title: 'Write integration tests',
    type: TASK_TYPE.Improvement,
  })

  // Set blocks relationships
  task1.blocks = [task2.id, task4.id]
  task2.blocks = [task4.id]
  task3.blocks = [task6.id]
  task7.blocks = [task8.id]

  const tasks = [task1, task2, task3, task4, task5, task6, task7, task8]

  return createRoadmap({
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'Test User',
      description: 'Complex test roadmap with dependencies and varied task states',
      name: 'Complex Test Roadmap',
    },
    ...overrides,
    tasks,
  })
}
