/* eslint-disable @typescript-eslint/no-unused-expressions */
import {expect} from 'chai'

import {PRIORITY, type Roadmap, STATUS, type Task, TASK_ID_REGEX, TASK_TYPE, type TaskID} from '../../src/util/types.js'

/**
 * Assert that a string is a valid TaskID format
 * @param id - The ID to validate
 * @param message - Optional custom error message
 */
export function assertValidTaskId(id: unknown, message?: string): asserts id is TaskID {
  expect(id, message ?? `Expected "${id}" to be a valid TaskID format`).to.be.a('string')
  expect(TASK_ID_REGEX.test(id as string), message ?? `Expected "${id}" to be a valid TaskID format`).to.be.true
}

/**
 * Assert that an object is a valid Task with all required fields
 * @param task - The task to validate
 * @param message - Optional custom error message
 */
export function assertValidTask(task: unknown, message = 'Expected a valid Task object'): asserts task is Task {
  expect(task, message).to.be.an('object')
  expect(task, message).to.not.be.null

  const t = task as Record<string, unknown>

  // Required fields
  expect(t, `${message}: missing id`).to.have.property('id')
  assertValidTaskId(t.id, `${message}: invalid id format`)

  expect(t, `${message}: missing title`).to.have.property('title')
  expect(t.title, `${message}: title must be a string`).to.be.a('string')

  expect(t, `${message}: missing details`).to.have.property('details')
  expect(t.details, `${message}: details must be a string`).to.be.a('string')

  expect(t, `${message}: missing type`).to.have.property('type')
  expect(Object.values(TASK_TYPE), `${message}: invalid type`).to.include(t.type)

  expect(t, `${message}: missing status`).to.have.property('status')
  expect(Object.values(STATUS), `${message}: invalid status`).to.include(t.status)

  expect(t, `${message}: missing priority`).to.have.property('priority')
  expect(Object.values(PRIORITY), `${message}: invalid priority`).to.include(t.priority)

  expect(t, `${message}: missing blocks`).to.have.property('blocks')
  expect(t.blocks, `${message}: blocks must be an array`).to.be.an('array')

  expect(t, `${message}: missing depends-on`).to.have.property('depends-on')
  expect(t['depends-on'], `${message}: depends-on must be an array`).to.be.an('array')

  expect(t, `${message}: missing tags`).to.have.property('tags')
  expect(t.tags, `${message}: tags must be an array`).to.be.an('array')

  expect(t, `${message}: missing passes-tests`).to.have.property('passes-tests')
  expect(t['passes-tests'], `${message}: passes-tests must be a boolean`).to.be.a('boolean')
}

/**
 * Assert that two tasks are equal, ignoring timestamp fields
 * @param actual - The actual task
 * @param expected - The expected task
 * @param message - Optional custom error message
 */
export function assertTaskEquals(actual: Task, expected: Task, message = 'Tasks should be equal'): void {
  // Create copies without timestamp fields
  const {createdAt: _a1, updatedAt: _a2, ...actualWithoutTimestamps} = actual
  const {createdAt: _e1, updatedAt: _e2, ...expectedWithoutTimestamps} = expected

  expect(actualWithoutTimestamps, message).to.deep.equal(expectedWithoutTimestamps)
}

/**
 * Assert that an object is a valid Roadmap with proper structure
 * @param roadmap - The roadmap to validate
 * @param message - Optional custom error message
 */
export function assertRoadmapValid(
  roadmap: unknown,
  message = 'Expected a valid Roadmap object',
): asserts roadmap is Roadmap {
  expect(roadmap, message).to.be.an('object')
  expect(roadmap, message).to.not.be.null

  const r = roadmap as Record<string, unknown>

  // Check $schema
  expect(r, `${message}: missing $schema`).to.have.property('$schema')
  expect(r.$schema, `${message}: $schema must be a string`).to.be.a('string')

  // Check metadata
  expect(r, `${message}: missing metadata`).to.have.property('metadata')
  expect(r.metadata, `${message}: metadata must be an object`).to.be.an('object')

  const metadata = r.metadata as Record<string, unknown>
  expect(metadata, `${message}: metadata missing name`).to.have.property('name')
  expect(metadata.name, `${message}: metadata.name must be a string`).to.be.a('string')

  expect(metadata, `${message}: metadata missing description`).to.have.property('description')
  expect(metadata.description, `${message}: metadata.description must be a string`).to.be.a('string')

  expect(metadata, `${message}: metadata missing createdBy`).to.have.property('createdBy')
  expect(metadata.createdBy, `${message}: metadata.createdBy must be a string`).to.be.a('string')

  expect(metadata, `${message}: metadata missing createdAt`).to.have.property('createdAt')
  expect(metadata.createdAt, `${message}: metadata.createdAt must be a string`).to.be.a('string')

  // Check tasks
  expect(r, `${message}: missing tasks`).to.have.property('tasks')
  expect(r.tasks, `${message}: tasks must be an array`).to.be.an('array')

  // Validate each task
  const tasks = r.tasks as unknown[]
  for (const [index, task] of tasks.entries()) {
    assertValidTask(task, `${message}: invalid task at index ${index}`)
  }
}

/**
 * Assert that a roadmap has a specific number of tasks
 * @param roadmap - The roadmap to check
 * @param count - The expected number of tasks
 * @param message - Optional custom error message
 */
export function assertHasTasks(
  roadmap: Roadmap,
  count: number,
  message = `Expected roadmap to have ${count} tasks`,
): void {
  expect(roadmap.tasks, message).to.have.lengthOf(count)
}

/**
 * Assert that a task has specific field values
 * @param task - The task to check
 * @param fields - Object with field name/value pairs to check
 * @param message - Optional custom error message
 */
export function assertTaskHasFields(
  task: Task,
  fields: Partial<Task>,
  message = 'Task should have expected field values',
): void {
  for (const [key, value] of Object.entries(fields)) {
    expect(task, `${message}: missing field ${key}`).to.have.property(key)
    expect((task as Record<string, unknown>)[key], `${message}: field ${key} mismatch`).to.deep.equal(value)
  }
}

/**
 * Assert that a roadmap contains a task with a specific ID
 * @param roadmap - The roadmap to search
 * @param taskId - The task ID to find
 * @param message - Optional custom error message
 */
export function assertRoadmapContainsTask(
  roadmap: Roadmap,
  taskId: TaskID,
  message = `Expected roadmap to contain task ${taskId}`,
): void {
  const task = roadmap.tasks.find((t) => t.id === taskId)
  expect(task, message).to.not.be.undefined
}
