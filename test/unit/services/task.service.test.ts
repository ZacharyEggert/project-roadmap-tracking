/* eslint-disable max-nested-callbacks */
import {expect} from 'chai'

import {TaskService} from '../../../src/services/task.service.js'
import {TASK_TYPE, TaskID} from '../../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, createPlanningTask} from '../../fixtures/task-factory.js'

describe('TaskService', () => {
  let taskService: TaskService

  beforeEach(() => {
    taskService = new TaskService()
  })

  describe('generateNextId', () => {
    describe('first ID generation', () => {
      it('should generate B-001 as first bug ID', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-001')
      })

      it('should generate F-001 as first feature ID', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-001')
      })

      it('should generate I-001 as first improvement ID', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Improvement)

        expect(nextId).to.equal('I-001')
      })

      it('should generate P-001 as first planning ID', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(nextId).to.equal('P-001')
      })

      it('should generate R-001 as first research ID', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Research)

        expect(nextId).to.equal('R-001')
      })
    })

    describe('sequential ID generation', () => {
      it('should generate B-002 after B-001 exists', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should generate B-003 after B-001 and B-002 exist', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-002'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-003')
      })

      it('should generate B-004 after B-001, B-002, and B-003 exist', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-002'}), createBugTask({id: 'B-003'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-004')
      })

      it('should generate F-002 after F-001 exists', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-002')
      })

      it('should generate F-003 after F-001 and F-002 exist', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'}), createFeatureTask({id: 'F-002'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-003')
      })

      it('should generate P-002 after P-001 exists', () => {
        const roadmap = createRoadmap({
          tasks: [createPlanningTask({id: 'P-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(nextId).to.equal('P-002')
      })
    })

    describe('different types do not interfere', () => {
      it('should generate B-001, F-001, P-001 independently', () => {
        const roadmap = createEmptyRoadmap()

        const bugId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)
        const featureId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)
        const planningId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(bugId).to.equal('B-001')
        expect(featureId).to.equal('F-001')
        expect(planningId).to.equal('P-001')
      })

      it('should generate F-001 when B-001 exists', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-001')
      })

      it('should generate B-001 when F-001 exists', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-001')
      })

      it('should generate B-002 when B-001, F-001, and P-001 exist', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createFeatureTask({id: 'F-001'}), createPlanningTask({id: 'P-001'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should generate F-002 when F-001, B-001, B-002, and P-001 exist', () => {
        const roadmap = createRoadmap({
          tasks: [
            createFeatureTask({id: 'F-001'}),
            createBugTask({id: 'B-001'}),
            createBugTask({id: 'B-002'}),
            createPlanningTask({id: 'P-001'}),
          ],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-002')
      })

      it('should handle mixed types with multiple tasks each', () => {
        const roadmap = createRoadmap({
          tasks: [
            createBugTask({id: 'B-001'}),
            createFeatureTask({id: 'F-001'}),
            createBugTask({id: 'B-002'}),
            createFeatureTask({id: 'F-002'}),
            createPlanningTask({id: 'P-001'}),
            createBugTask({id: 'B-003'}),
          ],
        })

        const bugId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)
        const featureId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)
        const planningId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(bugId).to.equal('B-004')
        expect(featureId).to.equal('F-003')
        expect(planningId).to.equal('P-002')
      })
    })

    describe('zero-padding', () => {
      it('should pad single digit IDs correctly: B-001', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-001')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should pad single digit IDs correctly: B-009', () => {
        const roadmap = createRoadmap({
          tasks: [
            createBugTask({id: 'B-001'}),
            createBugTask({id: 'B-002'}),
            createBugTask({id: 'B-003'}),
            createBugTask({id: 'B-004'}),
            createBugTask({id: 'B-005'}),
            createBugTask({id: 'B-006'}),
            createBugTask({id: 'B-007'}),
            createBugTask({id: 'B-008'}),
          ],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-009')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should pad double digit IDs correctly: B-010', () => {
        const bugTasks = Array.from({length: 9}, (_, i) => {
          const idNum = String(i + 1).padStart(3, '0')
          return createBugTask({id: `B-${idNum}` as TaskID})
        })
        const roadmap = createRoadmap({tasks: bugTasks})

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-010')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should pad double digit IDs correctly: F-099', () => {
        const featureTasks = Array.from({length: 98}, (_, i) => {
          const idNum = String(i + 1).padStart(3, '0')
          return createFeatureTask({id: `F-${idNum}` as TaskID})
        })
        const roadmap = createRoadmap({tasks: featureTasks})

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-099')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should not pad triple digit IDs: P-100', () => {
        const planningTasks = Array.from({length: 99}, (_, i) => {
          const idNum = String(i + 1).padStart(3, '0')
          return createPlanningTask({id: `P-${idNum}` as TaskID})
        })
        const roadmap = createRoadmap({tasks: planningTasks})

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(nextId).to.equal('P-100')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should not pad triple digit IDs: B-999', () => {
        const bugTasks = Array.from({length: 998}, (_, i) => {
          const idNum = String(i + 1).padStart(3, '0')
          return createBugTask({id: `B-${idNum}` as TaskID})
        })
        const roadmap = createRoadmap({tasks: bugTasks})

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-999')
        expect(nextId).to.have.lengthOf(5)
      })

      it('should always generate IDs with format X-NNN (5 characters)', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'}), createFeatureTask({id: 'F-010'}), createFeatureTask({id: 'F-100'})],
        })

        const nextId1 = taskService.generateNextId(roadmap, TASK_TYPE.Bug)
        const nextId2 = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId1).to.match(/^[A-Z]-\d{3}$/)
        expect(nextId2).to.match(/^[A-Z]-\d{3}$/)
        expect(nextId1).to.have.lengthOf(5)
        expect(nextId2).to.have.lengthOf(5)
      })
    })
  })
})
