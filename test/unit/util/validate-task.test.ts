/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'

import {PRIORITY, STATUS, Task, TASK_TYPE} from '../../../src/util/types.js'
import {validateTask} from '../../../src/util/validate-task.js'
import {
  createBugTask,
  createFeatureTask,
  createImprovementTask,
  createPlanningTask,
  createResearchTask,
  createTask,
} from '../../fixtures/task-factory.js'

describe('validateTask', () => {
  describe('valid tasks', () => {
    it('should accept factory-created bug task', () => {
      const task = createBugTask()
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept factory-created feature task', () => {
      const task = createFeatureTask()
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept factory-created improvement task', () => {
      const task = createImprovementTask()
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept factory-created planning task', () => {
      const task = createPlanningTask()
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept factory-created research task', () => {
      const task = createResearchTask()
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with all valid enum combinations - high priority', () => {
      const task = createTask({priority: PRIORITY.High})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with all valid enum combinations - low priority', () => {
      const task = createTask({priority: PRIORITY.Low})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with all valid enum combinations - in-progress status', () => {
      const task = createTask({status: STATUS.InProgress})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with all valid enum combinations - completed status', () => {
      const task = createTask({status: STATUS.Completed})
      expect(() => validateTask(task)).to.not.throw()
    })
  })

  describe('required fields - id', () => {
    it('should reject task with invalid ID format', () => {
      const task = createTask({id: 'invalid' as any})
      expect(() => validateTask(task)).to.throw('task ID invalid is not valid')
    })

    it('should reject task with lowercase prefix', () => {
      const task = createTask({id: 'f-001' as any})
      expect(() => validateTask(task)).to.throw('task ID f-001 is not valid')
    })

    it('should reject task with wrong prefix', () => {
      const task = createTask({id: 'X-001' as any})
      expect(() => validateTask(task)).to.throw('task ID X-001 is not valid')
    })

    it('should reject task with too few digits', () => {
      const task = createTask({id: 'F-1' as any})
      expect(() => validateTask(task)).to.throw('task ID F-1 is not valid')
    })

    it('should reject task with too many digits', () => {
      const task = createTask({id: 'F-0001' as any})
      expect(() => validateTask(task)).to.throw('task ID F-0001 is not valid')
    })
  })

  describe('required fields - details', () => {
    it('should reject task with missing details', () => {
      const task = createTask({details: undefined as any})
      expect(() => validateTask(task)).to.throw('must have details')
    })

    it('should reject task with null details', () => {
      const task = createTask({details: null as any})
      expect(() => validateTask(task)).to.throw('must have details')
    })

    it('should reject task with empty string details', () => {
      const task = createTask({details: ''})
      expect(() => validateTask(task)).to.throw('must have details')
    })

    it('should accept task with whitespace-only details (truthy check)', () => {
      const task = createTask({details: '   '})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should include task ID in error message for missing details', () => {
      const task = createTask({details: '', id: 'F-001' as any})
      expect(() => validateTask(task)).to.throw('task ID F-001 must have details')
    })
  })

  describe('enum validation - type', () => {
    it('should accept all valid type values - bug', () => {
      const task = createTask({type: TASK_TYPE.Bug})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid type values - feature', () => {
      const task = createTask({type: TASK_TYPE.Feature})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid type values - improvement', () => {
      const task = createTask({type: TASK_TYPE.Improvement})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid type values - planning', () => {
      const task = createTask({type: TASK_TYPE.Planning})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid type values - research', () => {
      const task = createTask({type: TASK_TYPE.Research})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject invalid type value', () => {
      const task = createTask({type: 'invalid' as any})
      expect(() => validateTask(task)).to.throw('has invalid type: invalid')
    })

    it('should reject uppercase type value', () => {
      const task = createTask({type: 'FEATURE' as any})
      expect(() => validateTask(task)).to.throw('has invalid type: FEATURE')
    })

    it('should reject mixed case type value', () => {
      const task = createTask({type: 'Bug' as any})
      expect(() => validateTask(task)).to.throw('has invalid type: Bug')
    })

    it('should reject numeric type value', () => {
      const task = createTask({type: 123 as any})
      expect(() => validateTask(task)).to.throw('has invalid type: 123')
    })

    it('should reject null type value', () => {
      const task = createTask({type: null as any})
      expect(() => validateTask(task)).to.throw('has invalid type: null')
    })

    it('should include task ID in type error message', () => {
      const task = createTask({id: 'F-001' as any, type: 'invalid' as any})
      expect(() => validateTask(task)).to.throw('task ID F-001 has invalid type: invalid')
    })
  })

  describe('enum validation - priority', () => {
    it('should accept all valid priority values - high', () => {
      const task = createTask({priority: PRIORITY.High})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid priority values - medium', () => {
      const task = createTask({priority: PRIORITY.Medium})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid priority values - low', () => {
      const task = createTask({priority: PRIORITY.Low})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject invalid priority value', () => {
      const task = createTask({priority: 'urgent' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: urgent')
    })

    it('should reject uppercase priority value', () => {
      const task = createTask({priority: 'HIGH' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: HIGH')
    })

    it('should reject mixed case priority value', () => {
      const task = createTask({priority: 'Medium' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: Medium')
    })

    it('should reject numeric priority value', () => {
      const task = createTask({priority: 1 as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: 1')
    })

    it('should reject null priority value', () => {
      const task = createTask({priority: null as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: null')
    })

    it('should include task ID in priority error message', () => {
      const task = createTask({id: 'F-001' as any, priority: 'urgent' as any})
      expect(() => validateTask(task)).to.throw('task ID F-001 has invalid priority: urgent')
    })
  })

  describe('enum validation - status', () => {
    it('should accept all valid status values - not-started', () => {
      const task = createTask({status: STATUS.NotStarted})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid status values - in-progress', () => {
      const task = createTask({status: STATUS.InProgress})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept all valid status values - completed', () => {
      const task = createTask({status: STATUS.Completed})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject invalid status value', () => {
      const task = createTask({status: 'done' as any})
      expect(() => validateTask(task)).to.throw('has invalid status: done')
    })

    it('should reject uppercase status value', () => {
      const task = createTask({status: 'COMPLETED' as any})
      expect(() => validateTask(task)).to.throw('has invalid status: COMPLETED')
    })

    it('should reject mixed case status value', () => {
      const task = createTask({status: 'In-Progress' as any})
      expect(() => validateTask(task)).to.throw('has invalid status: In-Progress')
    })

    it('should reject numeric status value', () => {
      const task = createTask({status: 0 as any})
      expect(() => validateTask(task)).to.throw('has invalid status: 0')
    })

    it('should reject null status value', () => {
      const task = createTask({status: null as any})
      expect(() => validateTask(task)).to.throw('has invalid status: null')
    })

    it('should include task ID in status error message', () => {
      const task = createTask({id: 'F-001' as any, status: 'done' as any})
      expect(() => validateTask(task)).to.throw('task ID F-001 has invalid status: done')
    })
  })

  describe('field type validation', () => {
    it('should accept details as number (truthy check)', () => {
      const task = createTask({details: 123 as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject details as false boolean', () => {
      const task = createTask({details: false as any})
      expect(() => validateTask(task)).to.throw('must have details')
    })

    it('should accept details as true boolean (truthy check)', () => {
      const task = createTask({details: true as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details as object (truthy check)', () => {
      const task = createTask({details: {} as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details as array (truthy check)', () => {
      const task = createTask({details: [] as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject details as zero', () => {
      const task = createTask({details: 0 as any})
      expect(() => validateTask(task)).to.throw('must have details')
    })
  })

  describe('skipID option', () => {
    it('should validate ID when skipID is false', () => {
      const task = createTask({id: 'invalid' as any})
      expect(() => validateTask(task, {skipID: false})).to.throw('task ID invalid is not valid')
    })

    it('should skip ID validation when skipID is true', () => {
      const task = createTask({id: 'invalid' as any})
      expect(() => validateTask(task, {skipID: true})).to.not.throw()
    })

    it('should validate ID by default when skipID is not provided', () => {
      const task = createTask({id: 'invalid' as any})
      expect(() => validateTask(task)).to.throw('task ID invalid is not valid')
    })

    it('should omit task ID from type error message when skipID is true', () => {
      const task = createTask({id: 'F-001' as any, type: 'invalid' as any})
      expect(() => validateTask(task, {skipID: true})).to.throw('task  has invalid type: invalid')
    })

    it('should omit task ID from priority error message when skipID is true', () => {
      const task = createTask({id: 'F-001' as any, priority: 'urgent' as any})
      expect(() => validateTask(task, {skipID: true})).to.throw('task  has invalid priority: urgent')
    })

    it('should omit task ID from status error message when skipID is true', () => {
      const task = createTask({id: 'F-001' as any, status: 'done' as any})
      expect(() => validateTask(task, {skipID: true})).to.throw('task  has invalid status: done')
    })

    it('should omit task ID from details error message when skipID is true', () => {
      const task = createTask({details: '', id: 'F-001' as any})
      expect(() => validateTask(task, {skipID: true})).to.throw('task  must have details')
    })

    it('should still validate other fields when skipID is true', () => {
      const task = createTask({
        details: '',
        id: 'invalid' as any,
      })
      expect(() => validateTask(task, {skipID: true})).to.throw('must have details')
    })
  })

  describe('edge cases', () => {
    it('should reject completely empty task object', () => {
      const task = {} as Task
      expect(() => validateTask(task)).to.throw()
    })

    it('should allow task with extra unknown fields', () => {
      const task = createTask({extraField: 'some value'} as any)
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with all optional fields missing', () => {
      const task = createTask({
        assignedTo: undefined,
        createdAt: undefined,
        dueDate: undefined,
        effort: undefined,
        'github-refs': undefined,
        notes: undefined,
        updatedAt: undefined,
      })
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details with special characters', () => {
      const task = createTask({details: 'Details with !@#$%^&*() special chars'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details with newlines', () => {
      const task = createTask({details: 'Line 1\nLine 2\nLine 3'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details with unicode characters', () => {
      const task = createTask({details: 'Unicode: 你好世界 🚀 café'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject type with leading whitespace', () => {
      const task = createTask({type: ' feature' as any})
      expect(() => validateTask(task)).to.throw('has invalid type:  feature')
    })

    it('should reject type with trailing whitespace', () => {
      const task = createTask({type: 'feature ' as any})
      expect(() => validateTask(task)).to.throw('has invalid type: feature ')
    })
  })

  describe('edge cases - multiple validation failures', () => {
    it('should throw on first error when task has invalid ID and invalid type', () => {
      const task = createTask({id: 'INVALID' as any, type: 'invalid-type' as any})
      // Validation should stop at first error (ID checked first)
      expect(() => validateTask(task)).to.throw('task ID INVALID is not valid')
    })

    it('should throw on first error when task has invalid priority and empty details', () => {
      const task = createTask({details: '' as any, priority: 'invalid' as any})
      // Validation should stop at first error (priority checked before details)
      expect(() => validateTask(task)).to.throw('has invalid priority: invalid')
    })

    it('should throw on first error when task has invalid type, status, and priority', () => {
      const task = createTask({
        priority: 'invalid-priority' as any,
        status: 'invalid-status' as any,
        type: 'invalid-type' as any,
      })
      // Validation should stop at first error (type checked first)
      expect(() => validateTask(task)).to.throw('has invalid type: invalid-type')
    })

    it('should validate fields in order: ID, type, priority, status, details', () => {
      // Test that ID is checked first
      const taskInvalidID = createTask({
        details: '' as any,
        id: 'INVALID' as any,
        priority: 'invalid' as any,
        status: 'invalid' as any,
        type: 'invalid' as any,
      })
      expect(() => validateTask(taskInvalidID)).to.throw('task ID INVALID is not valid')

      // Test that type is checked after ID (skip ID validation)
      const taskInvalidType = createTask({
        details: '' as any,
        priority: 'invalid' as any,
        status: 'invalid' as any,
        type: 'invalid' as any,
      })
      expect(() => validateTask(taskInvalidType, {skipID: true})).to.throw('has invalid type: invalid')

      // Test that priority is checked after type (skip ID validation, valid type)
      const taskInvalidPriority = createTask({
        details: '' as any,
        priority: 'invalid' as any,
        status: 'invalid' as any,
      })
      expect(() => validateTask(taskInvalidPriority, {skipID: true})).to.throw('has invalid priority: invalid')

      // Test that status is checked after priority (skip ID validation, valid type and priority)
      const taskInvalidStatus = createTask({
        details: '' as any,
        status: 'invalid' as any,
      })
      expect(() => validateTask(taskInvalidStatus, {skipID: true})).to.throw('has invalid status: invalid')

      // Test that details is checked last (skip ID validation, all enums valid)
      const taskInvalidDetails = createTask({details: '' as any})
      expect(() => validateTask(taskInvalidDetails, {skipID: true})).to.throw('must have details')
    })

    it('should not collect all errors - validation stops at first failure', () => {
      const task = createTask({
        details: '' as any,
        priority: 'invalid-priority' as any,
        status: 'invalid-status' as any,
        type: 'invalid-type' as any,
      })
      try {
        validateTask(task)
        throw new Error('Expected validation to throw')
      } catch (error: any) {
        // Should only mention the first error (type)
        expect(error.message).to.include('has invalid type: invalid-type')
        expect(error.message).to.not.include('invalid-priority')
        expect(error.message).to.not.include('invalid-status')
        expect(error.message).to.not.include('must have details')
      }
    })
  })

  describe('edge cases - optional fields NOT validated', () => {
    it('should accept invalid date format in createdAt', () => {
      // NOTE: validateTask() does NOT validate date formats
      // Date validation happens at the service layer (RoadmapService)
      const task = createTask({createdAt: 'not-a-date' as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept invalid date format in updatedAt', () => {
      // NOTE: validateTask() does NOT validate date formats
      // Date validation happens at the service layer (RoadmapService)
      const task = createTask({updatedAt: '2023-13-45' as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept invalid date format in dueDate', () => {
      // NOTE: validateTask() does NOT validate date formats
      // Date validation happens at the service layer (RoadmapService)
      const task = createTask({dueDate: 'invalid' as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept invalid TaskID in depends-on array', () => {
      // NOTE: validateTask() does NOT validate TaskID references in dependency arrays
      // TaskID validation in depends-on happens at the service layer (RoadmapService per P-031)
      const task = createTask({'depends-on': ['INVALID-ID'] as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept invalid TaskID in blocks array', () => {
      // NOTE: validateTask() does NOT validate TaskID references in blocks arrays
      // TaskID validation in blocks happens at the service layer (RoadmapService per P-031)
      const task = createTask({blocks: ['X-999'] as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept non-array for tags field', () => {
      // NOTE: validateTask() does NOT validate field types for optional fields
      // Type checking happens at compile time via TypeScript
      const task = createTask({tags: 'tag1,tag2' as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept non-array for blocks field', () => {
      // NOTE: validateTask() does NOT validate field types for optional fields
      // Type checking happens at compile time via TypeScript
      const task = createTask({blocks: 'B-001' as any})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept non-array for depends-on field', () => {
      // NOTE: validateTask() does NOT validate field types for optional fields
      // Type checking happens at compile time via TypeScript
      const task = createTask({'depends-on': null as any})
      expect(() => validateTask(task)).to.not.throw()
    })
  })

  describe('edge cases - boundary conditions', () => {
    it('should accept ID at boundary B-000', () => {
      const task = createTask({id: 'B-000'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept ID at boundary F-999', () => {
      const task = createTask({id: 'F-999'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept ID at boundary R-001', () => {
      const task = createTask({id: 'R-001'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details with extremely long string (10KB+)', () => {
      const longDetails = 'a'.repeat(10_240) // 10KB of characters
      const task = createTask({details: longDetails})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept details with only tabs and newlines (truthy but all whitespace)', () => {
      const task = createTask({details: '\t\t\n\n\t\n'})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject priority with leading whitespace', () => {
      const task = createTask({priority: ' high' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority:  high')
    })

    it('should reject priority with trailing whitespace', () => {
      const task = createTask({priority: 'medium ' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority: medium ')
    })

    it('should reject status with leading whitespace', () => {
      const task = createTask({status: ' completed' as any})
      expect(() => validateTask(task)).to.throw('has invalid status:  completed')
    })

    it('should reject status with trailing whitespace', () => {
      const task = createTask({status: 'in-progress ' as any})
      expect(() => validateTask(task)).to.throw('has invalid status: in-progress ')
    })

    it('should accept task with all enum fields at their boundaries', () => {
      const task = createTask({
        details: ' ', // Single space is truthy
        id: 'B-000',
        priority: PRIORITY.Low,
        status: STATUS.NotStarted,
        type: TASK_TYPE.Bug,
      })
      expect(() => validateTask(task)).to.not.throw()
    })
  })

  describe('edge cases - real-world malformed data', () => {
    it('should reject type with extra spaces', () => {
      const task = createTask({type: '  feature  ' as any})
      expect(() => validateTask(task)).to.throw('has invalid type:   feature  ')
    })

    it('should reject priority with extra spaces', () => {
      const task = createTask({priority: '  medium  ' as any})
      expect(() => validateTask(task)).to.throw('has invalid priority:   medium  ')
    })

    it('should reject status with extra spaces', () => {
      const task = createTask({status: '  completed  ' as any})
      expect(() => validateTask(task)).to.throw('has invalid status:   completed  ')
    })

    it('should accept task with very long title (no title validation)', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime
      const longTitle = 'A'.repeat(10_000)
      const task = createTask({title: longTitle})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept task with empty string title (no title validation)', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime
      const task = createTask({title: ''})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should reject task object that is null', () => {
      expect(() => validateTask(null as any)).to.throw()
    })

    it('should reject task object that is undefined', () => {
      expect(() => validateTask(undefined as any)).to.throw()
    })
  })

  describe('edge cases - title field NOT validated', () => {
    it('should accept empty string title', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime by this utility
      const task = createTask({title: ''})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept very long title (10000+ characters)', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime by this utility
      const longTitle = 'Title '.repeat(2000) // ~12000 characters
      const task = createTask({title: longTitle})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept title with only whitespace', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime by this utility
      const task = createTask({title: '   \t\n   '})
      expect(() => validateTask(task)).to.not.throw()
    })

    it('should accept title with special characters and unicode', () => {
      // NOTE: validateTask() does NOT validate title field
      // Title is required by TypeScript type but not validated at runtime by this utility
      const task = createTask({title: '🚀 Fix: café !@#$%^&*() 你好世界'})
      expect(() => validateTask(task)).to.not.throw()
    })
  })
})
