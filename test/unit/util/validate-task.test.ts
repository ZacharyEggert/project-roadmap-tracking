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
})
