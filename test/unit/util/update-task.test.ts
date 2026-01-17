import {expect} from 'chai'

import {PRIORITY, STATUS, TASK_TYPE} from '../../../src/util/types.js'
import {updateTaskInRoadmap} from '../../../src/util/update-task.js'
import {createRoadmap, createSimpleRoadmap} from '../../fixtures/roadmap-factory.js'
import {createTask, resetTaskCounter} from '../../fixtures/task-factory.js'
import {assertTaskEquals} from '../../helpers/assertions.js'

describe('updateTaskInRoadmap', () => {
  beforeEach(() => {
    resetTaskCounter()
  })

  describe('immutability', () => {
    it('should not mutate the original roadmap object', async () => {
      const roadmap = createSimpleRoadmap()
      const originalRoadmap = roadmap

      await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(roadmap).to.equal(originalRoadmap)
      expect(roadmap.tasks[0].status).to.equal(STATUS.NotStarted)
    })

    it('should not mutate the original tasks array', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTasksArray = roadmap.tasks

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(roadmap.tasks).to.equal(originalTasksArray)
      expect(updated.tasks).to.not.equal(originalTasksArray)
    })

    it('should not mutate the original task object', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]
      const originalStatus = originalTask.status

      await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(roadmap.tasks[0]).to.equal(originalTask)
      expect(roadmap.tasks[0].status).to.equal(originalStatus)
    })

    it('should return a new Roadmap object', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated).to.not.equal(roadmap)
      expect(updated).to.be.an('object')
    })

    it('should return a new tasks array', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.tasks).to.not.equal(roadmap.tasks)
      expect(updated.tasks).to.be.an('array')
    })

    it('should return a new task object', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.tasks[0]).to.not.equal(originalTask)
      expect(updated.tasks[0]).to.be.an('object')
    })
  })

  describe('timestamp updates', () => {
    it('should automatically set updatedAt timestamp', async () => {
      const roadmap = createSimpleRoadmap()
      const originalUpdatedAt = roadmap.tasks[0].updatedAt
      const beforeUpdate = Date.now()

      // Small delay to ensure timestamp changes
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 10)
      })

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      const afterUpdate = Date.now()
      expect(updated.tasks[0].updatedAt).to.be.a('string')
      expect(updated.tasks[0].updatedAt).to.not.equal(originalUpdatedAt)
      // Timestamp should be between before and after
      const updatedTimestamp = new Date(updated.tasks[0].updatedAt!).getTime()
      expect(updatedTimestamp).to.be.at.least(beforeUpdate)
      expect(updatedTimestamp).to.be.at.most(afterUpdate + 100)
    })

    it('should override updatedAt even if provided in updates', async () => {
      const roadmap = createSimpleRoadmap()
      const customTimestamp = '2020-01-01T00:00:00.000Z'
      const beforeUpdate = Date.now()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {
        status: STATUS.InProgress,
        updatedAt: customTimestamp,
      })

      expect(updated.tasks[0].updatedAt).to.not.equal(customTimestamp)
      const updatedTimestamp = new Date(updated.tasks[0].updatedAt!).getTime()
      expect(updatedTimestamp).to.be.at.least(beforeUpdate)
    })

    it('should not modify createdAt timestamp', async () => {
      const roadmap = createSimpleRoadmap()
      const originalCreatedAt = roadmap.tasks[0].createdAt

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.tasks[0].createdAt).to.equal(originalCreatedAt)
    })

    it('should set updatedAt to current time (within 1 second tolerance)', async () => {
      const roadmap = createSimpleRoadmap()
      const before = Date.now()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      const after = Date.now()
      const updatedTime = new Date(updated.tasks[0].updatedAt!).getTime()

      expect(updatedTime).to.be.at.least(before)
      expect(updatedTime).to.be.at.most(after + 1000) // 1 second tolerance
    })
  })

  describe('partial updates', () => {
    it('should update only the status field', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.tasks[0].status).to.equal(STATUS.InProgress)
      expect(updated.tasks[0].title).to.equal(originalTask.title)
      expect(updated.tasks[0].priority).to.equal(originalTask.priority)
      expect(updated.tasks[0].type).to.equal(originalTask.type)
    })

    it('should update only the priority field', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {priority: PRIORITY.High})

      expect(updated.tasks[0].priority).to.equal(PRIORITY.High)
      expect(updated.tasks[0].status).to.equal(originalTask.status)
      expect(updated.tasks[0].title).to.equal(originalTask.title)
      expect(updated.tasks[0].type).to.equal(originalTask.type)
    })

    it('should update only the title field', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {title: 'New Title'})

      expect(updated.tasks[0].title).to.equal('New Title')
      expect(updated.tasks[0].status).to.equal(originalTask.status)
      expect(updated.tasks[0].priority).to.equal(originalTask.priority)
      expect(updated.tasks[0].type).to.equal(originalTask.type)
    })

    it('should update multiple fields simultaneously', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {
        priority: PRIORITY.High,
        status: STATUS.InProgress,
        title: 'Updated Title',
      })

      expect(updated.tasks[0].status).to.equal(STATUS.InProgress)
      expect(updated.tasks[0].priority).to.equal(PRIORITY.High)
      expect(updated.tasks[0].title).to.equal('Updated Title')
      expect(updated.tasks[0].type).to.equal(originalTask.type)
      expect(updated.tasks[0].details).to.equal(originalTask.details)
    })

    it('should preserve fields not included in updates', async () => {
      const task = createTask({
        details: 'Original Details',
        notes: 'Original Notes',
        priority: PRIORITY.Medium,
        status: STATUS.NotStarted,
        tags: ['tag1', 'tag2'],
        title: 'Original Title',
        type: TASK_TYPE.Feature,
      })
      const roadmap = createRoadmap({tasks: [task]})

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.tasks[0].status).to.equal(STATUS.InProgress)
      expect(updated.tasks[0].title).to.equal('Original Title')
      expect(updated.tasks[0].details).to.equal('Original Details')
      expect(updated.tasks[0].priority).to.equal(PRIORITY.Medium)
      expect(updated.tasks[0].type).to.equal(TASK_TYPE.Feature)
      expect(updated.tasks[0].tags).to.deep.equal(['tag1', 'tag2'])
      expect(updated.tasks[0].notes).to.equal('Original Notes')
    })

    it('should handle empty updates object (only sets updatedAt)', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTask = roadmap.tasks[0]
      const originalUpdatedAt = originalTask.updatedAt

      // Small delay to ensure timestamp changes
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 10)
      })

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {})

      // All fields should remain the same except updatedAt
      expect(updated.tasks[0].title).to.equal(originalTask.title)
      expect(updated.tasks[0].status).to.equal(originalTask.status)
      expect(updated.tasks[0].priority).to.equal(originalTask.priority)
      expect(updated.tasks[0].type).to.equal(originalTask.type)
      expect(updated.tasks[0].updatedAt).to.not.equal(originalUpdatedAt)
    })
  })

  describe('updating all fields', () => {
    it('should be able to update title', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {title: 'New Title'})

      expect(updated.tasks[0].title).to.equal('New Title')
    })

    it('should be able to update details', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {details: 'New Details'})

      expect(updated.tasks[0].details).to.equal('New Details')
    })

    it('should be able to update status', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.Completed})

      expect(updated.tasks[0].status).to.equal(STATUS.Completed)
    })

    it('should be able to update priority', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {priority: PRIORITY.Low})

      expect(updated.tasks[0].priority).to.equal(PRIORITY.Low)
    })

    it('should be able to update type', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {type: TASK_TYPE.Bug})

      expect(updated.tasks[0].type).to.equal(TASK_TYPE.Bug)
    })

    it('should be able to update tags', async () => {
      const roadmap = createSimpleRoadmap()
      const newTags = ['new-tag1', 'new-tag2', 'new-tag3']

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {tags: newTags})

      expect(updated.tasks[0].tags).to.deep.equal(newTags)
    })

    it('should be able to update depends-on', async () => {
      const roadmap = createSimpleRoadmap()
      const newDependsOn = ['B-002', 'P-003'] as const

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {'depends-on': [...newDependsOn]})

      expect(updated.tasks[0]['depends-on']).to.deep.equal(newDependsOn)
    })

    it('should be able to update blocks', async () => {
      const roadmap = createSimpleRoadmap()
      const newBlocks = ['P-004', 'P-005'] as const

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {blocks: [...newBlocks]})

      expect(updated.tasks[0].blocks).to.deep.equal(newBlocks)
    })

    it('should be able to update passes-tests', async () => {
      const roadmap = createSimpleRoadmap()

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {'passes-tests': true})

      expect(updated.tasks[0]['passes-tests']).to.equal(true)
    })

    it('should be able to update notes', async () => {
      const roadmap = createSimpleRoadmap()
      const newNotes = 'These are new notes'

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {notes: newNotes})

      expect(updated.tasks[0].notes).to.equal(newNotes)
    })

    it('should be able to update assignedTo', async () => {
      const roadmap = createSimpleRoadmap()
      const newAssignee = 'developer@example.com'

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {assignedTo: newAssignee})

      expect(updated.tasks[0].assignedTo).to.equal(newAssignee)
    })

    it('should be able to update dueDate', async () => {
      const roadmap = createSimpleRoadmap()
      const newDueDate = '2026-12-31'

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {dueDate: newDueDate})

      expect(updated.tasks[0].dueDate).to.equal(newDueDate)
    })

    it('should be able to update effort', async () => {
      const roadmap = createSimpleRoadmap()
      const newEffort = 8

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {effort: newEffort})

      expect(updated.tasks[0].effort).to.equal(newEffort)
    })
  })

  describe('original roadmap preservation', () => {
    it('should not modify other tasks in the roadmap', async () => {
      const roadmap = createSimpleRoadmap() // Creates roadmap with multiple tasks
      const originalSecondTask = roadmap.tasks[1]
      const originalThirdTask = roadmap.tasks[2]

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      // Original roadmap's other tasks should not be modified
      expect(roadmap.tasks[1]).to.equal(originalSecondTask)
      expect(roadmap.tasks[2]).to.equal(originalThirdTask)

      // Updated roadmap's other tasks should be the same objects (not deep cloned)
      assertTaskEquals(updated.tasks[1], originalSecondTask)
      assertTaskEquals(updated.tasks[2], originalThirdTask)
    })

    it('should preserve roadmap metadata', async () => {
      const task1 = createTask({title: 'Task 1'})
      const task2 = createTask({title: 'Task 2'})
      const roadmap = createRoadmap({tasks: [task1, task2]})
      const originalSchema = roadmap.$schema
      const originalName = roadmap.metadata.name
      const originalCreatedAt = roadmap.metadata.createdAt

      const updated = await updateTaskInRoadmap(roadmap, 'F-001', {status: STATUS.InProgress})

      expect(updated.$schema).to.equal(originalSchema)
      expect(updated.metadata.name).to.equal(originalName)
      expect(updated.metadata.createdAt).to.equal(originalCreatedAt)
    })

    it('should preserve task order', async () => {
      const roadmap = createSimpleRoadmap()
      const originalTaskIds = roadmap.tasks.map((task) => task.id)

      const updated = await updateTaskInRoadmap(roadmap, 'B-002', {status: STATUS.InProgress})

      const updatedTaskIds = updated.tasks.map((task) => task.id)
      expect(updatedTaskIds).to.deep.equal(originalTaskIds)
    })

    it('should only update the specified task', async () => {
      const task1 = createTask({status: STATUS.NotStarted, title: 'Task 1'})
      const task2 = createTask({status: STATUS.NotStarted, title: 'Task 2'})
      const task3 = createTask({status: STATUS.NotStarted, title: 'Task 3'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      const updated = await updateTaskInRoadmap(roadmap, 'F-002', {status: STATUS.Completed})

      expect(updated.tasks[0].status).to.equal(STATUS.NotStarted)
      expect(updated.tasks[1].status).to.equal(STATUS.Completed)
      expect(updated.tasks[2].status).to.equal(STATUS.NotStarted)
    })
  })
})
