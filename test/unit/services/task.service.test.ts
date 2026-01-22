import {expect} from 'chai'

import {TaskService} from '../../../src/services/task.service.js'
import {PRIORITY, STATUS, TASK_TYPE, TaskID} from '../../../src/util/types.js'
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

    describe('edge cases and gap filling', () => {
      it('should fill gap: B-001, B-003 exist, next ID is B-002', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-003'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should fill smallest gap: B-001, B-005, B-010 exist, next ID is B-002', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-005'}), createBugTask({id: 'B-010'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should fill middle gap: F-001, F-002, F-005 exist, next ID is F-003', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'}), createFeatureTask({id: 'F-002'}), createFeatureTask({id: 'F-005'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-003')
      })

      it('should handle multiple gaps and fill the first one', () => {
        const roadmap = createRoadmap({
          tasks: [
            createBugTask({id: 'B-001'}),
            createBugTask({id: 'B-003'}),
            createBugTask({id: 'B-007'}),
            createBugTask({id: 'B-010'}),
          ],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should handle non-sequential IDs (simulating deleted tasks)', () => {
        const roadmap = createRoadmap({
          tasks: [
            createPlanningTask({id: 'P-001'}),
            createPlanningTask({id: 'P-010'}),
            createPlanningTask({id: 'P-020'}),
          ],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Planning)

        expect(nextId).to.equal('P-002')
      })

      it('should generate B-001 for empty roadmap', () => {
        const roadmap = createEmptyRoadmap()

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-001')
      })

      it('should handle maximum ID boundary: next after B-998 is B-999', () => {
        const bugTasks = Array.from({length: 998}, (_, i) => {
          const idNum = String(i + 1).padStart(3, '0')
          return createBugTask({id: `B-${idNum}` as TaskID})
        })
        const roadmap = createRoadmap({tasks: bugTasks})

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-999')
      })

      it('should fill gap even when approaching maximum: B-001, B-999 exist, next is B-002', () => {
        const roadmap = createRoadmap({
          tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-999'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Bug)

        expect(nextId).to.equal('B-002')
      })

      it('should handle gaps in high number range: F-995, F-997, F-999 exist, next is F-001', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-995'}), createFeatureTask({id: 'F-997'}), createFeatureTask({id: 'F-999'})],
        })

        const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)

        expect(nextId).to.equal('F-001')
      })
    })
  })

  describe('createTask', () => {
    it('should create a task with required fields', () => {
      const task = taskService.createTask({
        details: 'Test details',
        id: 'B-001',
        title: 'Test task',
        type: TASK_TYPE.Bug,
      })

      expect(task.id).to.equal('B-001')
      expect(task.title).to.equal('Test task')
      expect(task.details).to.equal('Test details')
      expect(task.type).to.equal(TASK_TYPE.Bug)
    })

    it('should set default values for optional fields', () => {
      const task = taskService.createTask({
        details: 'Test details',
        id: 'F-001',
        title: 'Test feature',
        type: TASK_TYPE.Feature,
      })

      expect(task.priority).to.equal(PRIORITY.Medium)
      expect(task.status).to.equal(STATUS.NotStarted)
      expect(task['passes-tests']).to.equal(false)
      expect(task.notes).to.equal('')
      expect(task.blocks).to.deep.equal([])
      expect(task['depends-on']).to.deep.equal([])
      expect(task.tags).to.deep.equal([])
    })

    it('should set timestamps on creation', () => {
      const beforeCreation = new Date()
      const task = taskService.createTask({
        details: 'Test details',
        id: 'P-001',
        title: 'Test planning',
        type: TASK_TYPE.Planning,
      })
      const afterCreation = new Date()

      expect(task.createdAt).to.be.a('string')
      expect(task.updatedAt).to.be.a('string')
      expect(new Date(task.createdAt!).getTime()).to.be.at.least(beforeCreation.getTime())
      expect(new Date(task.createdAt!).getTime()).to.be.at.most(afterCreation.getTime())
      expect(task.updatedAt).to.equal(task.createdAt)
    })

    it('should accept custom priority', () => {
      const task = taskService.createTask({
        details: 'High priority bug',
        id: 'B-001',
        priority: PRIORITY.High,
        title: 'Critical bug',
        type: TASK_TYPE.Bug,
      })

      expect(task.priority).to.equal(PRIORITY.High)
    })

    it('should accept custom status', () => {
      const task = taskService.createTask({
        details: 'Already started',
        id: 'F-001',
        status: STATUS.InProgress,
        title: 'In progress feature',
        type: TASK_TYPE.Feature,
      })

      expect(task.status).to.equal(STATUS.InProgress)
    })

    it('should accept tags array', () => {
      const tags = ['urgent', 'frontend', 'ui']
      const task = taskService.createTask({
        details: 'UI improvement',
        id: 'I-001',
        tags,
        title: 'Improve UI',
        type: TASK_TYPE.Improvement,
      })

      expect(task.tags).to.deep.equal(tags)
    })

    it('should accept notes', () => {
      const notes = 'Additional implementation notes'
      const task = taskService.createTask({
        details: 'Research task',
        id: 'R-001',
        notes,
        title: 'Research topic',
        type: TASK_TYPE.Research,
      })

      expect(task.notes).to.equal(notes)
    })

    it('should accept blocks array', () => {
      const blocks: TaskID[] = ['F-002', 'F-003']
      const task = taskService.createTask({
        blocks,
        details: 'Blocking feature',
        id: 'F-001',
        title: 'Foundation feature',
        type: TASK_TYPE.Feature,
      })

      expect(task.blocks).to.deep.equal(blocks)
    })

    it('should accept depends-on array', () => {
      const dependsOn: TaskID[] = ['F-001', 'F-002']
      const task = taskService.createTask({
        'depends-on': dependsOn,
        details: 'Dependent feature',
        id: 'F-003',
        title: 'Extension feature',
        type: TASK_TYPE.Feature,
      })

      expect(task['depends-on']).to.deep.equal(dependsOn)
    })

    it('should accept passes-tests flag', () => {
      const task = taskService.createTask({
        details: 'Tested feature',
        id: 'F-001',
        'passes-tests': true,
        title: 'Tested feature',
        type: TASK_TYPE.Feature,
      })

      expect(task['passes-tests']).to.equal(true)
    })

    it('should create tasks for all task types', () => {
      const bugTask = taskService.createTask({
        details: 'Bug details',
        id: 'B-001',
        title: 'Bug',
        type: TASK_TYPE.Bug,
      })
      const featureTask = taskService.createTask({
        details: 'Feature details',
        id: 'F-001',
        title: 'Feature',
        type: TASK_TYPE.Feature,
      })
      const improvementTask = taskService.createTask({
        details: 'Improvement details',
        id: 'I-001',
        title: 'Improvement',
        type: TASK_TYPE.Improvement,
      })
      const planningTask = taskService.createTask({
        details: 'Planning details',
        id: 'P-001',
        title: 'Planning',
        type: TASK_TYPE.Planning,
      })
      const researchTask = taskService.createTask({
        details: 'Research details',
        id: 'R-001',
        title: 'Research',
        type: TASK_TYPE.Research,
      })

      expect(bugTask.type).to.equal(TASK_TYPE.Bug)
      expect(featureTask.type).to.equal(TASK_TYPE.Feature)
      expect(improvementTask.type).to.equal(TASK_TYPE.Improvement)
      expect(planningTask.type).to.equal(TASK_TYPE.Planning)
      expect(researchTask.type).to.equal(TASK_TYPE.Research)
    })
  })

  describe('addTask', () => {
    it('should add a task to an empty roadmap', () => {
      const roadmap = createEmptyRoadmap()
      const task = taskService.createTask({
        details: 'New task',
        id: 'B-001',
        title: 'First task',
        type: TASK_TYPE.Bug,
      })

      const updatedRoadmap = taskService.addTask(roadmap, task)

      expect(updatedRoadmap.tasks).to.have.lengthOf(1)
      expect(updatedRoadmap.tasks[0]).to.deep.equal(task)
    })

    it('should add a task to a roadmap with existing tasks', () => {
      const existingTask = createBugTask({id: 'B-001'})
      const roadmap = createRoadmap({tasks: [existingTask]})
      const newTask = taskService.createTask({
        details: 'Second task',
        id: 'B-002',
        title: 'Second task',
        type: TASK_TYPE.Bug,
      })

      const updatedRoadmap = taskService.addTask(roadmap, newTask)

      expect(updatedRoadmap.tasks).to.have.lengthOf(2)
      expect(updatedRoadmap.tasks[0]).to.deep.equal(existingTask)
      expect(updatedRoadmap.tasks[1]).to.deep.equal(newTask)
    })

    it('should not mutate the original roadmap', () => {
      const roadmap = createEmptyRoadmap()
      const task = taskService.createTask({
        details: 'New task',
        id: 'F-001',
        title: 'New feature',
        type: TASK_TYPE.Feature,
      })

      const updatedRoadmap = taskService.addTask(roadmap, task)

      expect(roadmap.tasks).to.have.lengthOf(0)
      expect(updatedRoadmap.tasks).to.have.lengthOf(1)
      expect(updatedRoadmap).to.not.equal(roadmap)
    })

    it('should preserve all roadmap properties', () => {
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001'})],
      })
      const newTask = taskService.createTask({
        details: 'New task',
        id: 'F-002',
        title: 'Second feature',
        type: TASK_TYPE.Feature,
      })

      const updatedRoadmap = taskService.addTask(roadmap, newTask)

      expect(updatedRoadmap.$schema).to.equal(roadmap.$schema)
      expect(updatedRoadmap.metadata).to.deep.equal(roadmap.metadata)
    })

    it('should allow adding tasks of different types', () => {
      const roadmap = createRoadmap({
        tasks: [createBugTask({id: 'B-001'})],
      })
      const featureTask = taskService.createTask({
        details: 'Feature task',
        id: 'F-001',
        title: 'Feature',
        type: TASK_TYPE.Feature,
      })

      const updatedRoadmap = taskService.addTask(roadmap, featureTask)

      expect(updatedRoadmap.tasks).to.have.lengthOf(2)
      expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Bug)
      expect(updatedRoadmap.tasks[1].type).to.equal(TASK_TYPE.Feature)
    })

    it('should add multiple tasks sequentially', () => {
      let roadmap = createEmptyRoadmap()

      const task1 = taskService.createTask({
        details: 'First',
        id: 'B-001',
        title: 'Task 1',
        type: TASK_TYPE.Bug,
      })
      const task2 = taskService.createTask({
        details: 'Second',
        id: 'B-002',
        title: 'Task 2',
        type: TASK_TYPE.Bug,
      })
      const task3 = taskService.createTask({
        details: 'Third',
        id: 'B-003',
        title: 'Task 3',
        type: TASK_TYPE.Bug,
      })

      roadmap = taskService.addTask(roadmap, task1)
      roadmap = taskService.addTask(roadmap, task2)
      roadmap = taskService.addTask(roadmap, task3)

      expect(roadmap.tasks).to.have.lengthOf(3)
      expect(roadmap.tasks[0].id).to.equal('B-001')
      expect(roadmap.tasks[1].id).to.equal('B-002')
      expect(roadmap.tasks[2].id).to.equal('B-003')
    })

    it('should throw error when adding invalid task with bad ID format', () => {
      const roadmap = createEmptyRoadmap()
      const invalidTask = {
        ...taskService.createTask({
          details: 'Invalid task',
          id: 'B-001',
          title: 'Task',
          type: TASK_TYPE.Bug,
        }),
        
        id: 'invalid' as any,
      }

      expect(() => taskService.addTask(roadmap, invalidTask)).to.throw('task ID invalid is not valid')
    })

    it('should throw error when adding task with missing details', () => {
      const roadmap = createEmptyRoadmap()
      const invalidTask = {
        ...taskService.createTask({
          details: 'Details',
          id: 'B-001',
          title: 'Task',
          type: TASK_TYPE.Bug,
        }),
        details: '',
      }

      expect(() => taskService.addTask(roadmap, invalidTask)).to.throw('task ID B-001 must have details')
    })

    it('should throw error when adding task with invalid type', () => {
      const roadmap = createEmptyRoadmap()
      const invalidTask = {
        ...taskService.createTask({
          details: 'Details',
          id: 'B-001',
          title: 'Task',
          type: TASK_TYPE.Bug,
        }),
        type: 'invalid-type' as any,
      }

      expect(() => taskService.addTask(roadmap, invalidTask)).to.throw('task ID B-001 has invalid type')
    })

    it('should throw error when adding task with invalid priority', () => {
      const roadmap = createEmptyRoadmap()
      const invalidTask = {
        ...taskService.createTask({
          details: 'Details',
          id: 'F-001',
          title: 'Task',
          type: TASK_TYPE.Feature,
        }),
        
        priority: 'invalid-priority' as any,
      }

      expect(() => taskService.addTask(roadmap, invalidTask)).to.throw('task ID F-001 has invalid priority')
    })

    it('should throw error when adding task with invalid status', () => {
      const roadmap = createEmptyRoadmap()
      const invalidTask = {
        ...taskService.createTask({
          details: 'Details',
          id: 'P-001',
          title: 'Task',
          type: TASK_TYPE.Planning,
        }),
        
        status: 'invalid-status' as any,
      }

      expect(() => taskService.addTask(roadmap, invalidTask)).to.throw('task ID P-001 has invalid status')
    })
  })

  describe('findTask', () => {
    it('should find an existing task by ID', () => {
      const task1 = createFeatureTask({id: 'F-001', title: 'Feature 1'})
      const task2 = createBugTask({id: 'B-001', title: 'Bug 1'})
      const roadmap = createRoadmap({tasks: [task1, task2]})

      const found = taskService.findTask(roadmap, 'F-001')

      expect(found).to.not.be.undefined
      expect(found!.id).to.equal('F-001')
      expect(found!.title).to.equal('Feature 1')
    })

    it('should return undefined for non-existent task ID', () => {
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001'})],
      })

      const found = taskService.findTask(roadmap, 'F-999')

      expect(found).to.be.undefined
    })

    it('should return undefined for empty roadmap', () => {
      const roadmap = createEmptyRoadmap()

      const found = taskService.findTask(roadmap, 'F-001')

      expect(found).to.be.undefined
    })

    it('should find task in roadmap with multiple tasks', () => {
      const roadmap = createRoadmap({
        tasks: [
          createBugTask({id: 'B-001'}),
          createFeatureTask({id: 'F-001'}),
          createPlanningTask({id: 'P-001'}),
          createFeatureTask({id: 'F-002'}),
          createBugTask({id: 'B-002'}),
        ],
      })

      const foundFirst = taskService.findTask(roadmap, 'B-001')
      const foundMiddle = taskService.findTask(roadmap, 'P-001')
      const foundLast = taskService.findTask(roadmap, 'B-002')

      expect(foundFirst).to.not.be.undefined
      expect(foundFirst!.id).to.equal('B-001')
      expect(foundMiddle).to.not.be.undefined
      expect(foundMiddle!.id).to.equal('P-001')
      expect(foundLast).to.not.be.undefined
      expect(foundLast!.id).to.equal('B-002')
    })

    it('should match exact task ID (case-sensitive)', () => {
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001'})],
      })

      const foundLower = taskService.findTask(roadmap, 'f-001')
      const foundUpper = taskService.findTask(roadmap, 'F-001')

      expect(foundLower).to.be.undefined
      expect(foundUpper).to.not.be.undefined
    })

    it('should return first task when duplicate IDs exist (edge case)', () => {
      const task1 = createFeatureTask({id: 'F-001', title: 'First'})
      const task2 = createFeatureTask({id: 'F-001', title: 'Second'})
      const roadmap = createRoadmap({tasks: [task1, task2]})

      const found = taskService.findTask(roadmap, 'F-001')

      expect(found).to.not.be.undefined
      expect(found!.title).to.equal('First')
    })
  })

  describe('updateTask', () => {
    describe('basic updates', () => {
      it('should update task status', () => {
        const task = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.status).to.equal(STATUS.InProgress)
      })

      it('should update task priority', () => {
        const task = createFeatureTask({id: 'F-001', priority: PRIORITY.Low})
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          priority: PRIORITY.High,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.priority).to.equal(PRIORITY.High)
      })

      it('should update task title and details', () => {
        const task = createFeatureTask({
          details: 'Old details',
          id: 'F-001',
          title: 'Old title',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          details: 'New details',
          title: 'New title',
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.title).to.equal('New title')
        expect(updatedTask!.details).to.equal('New details')
      })

      it('should update passes-tests flag', () => {
        const task = createFeatureTask({id: 'F-001', 'passes-tests': false})
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          'passes-tests': true,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!['passes-tests']).to.equal(true)
      })

      it('should update multiple fields simultaneously', () => {
        const task = createFeatureTask({
          id: 'F-001',
          priority: PRIORITY.Low,
          status: STATUS.NotStarted,
        })
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          'passes-tests': true,
          priority: PRIORITY.High,
          status: STATUS.Completed,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.status).to.equal(STATUS.Completed)
        expect(updatedTask!.priority).to.equal(PRIORITY.High)
        expect(updatedTask!['passes-tests']).to.equal(true)
      })
    })

    describe('timestamp handling', () => {
      it('should automatically set updatedAt timestamp', () => {
        const task = createFeatureTask({id: 'F-001'})
        const roadmap = createRoadmap({tasks: [task]})
        const beforeUpdate = new Date()

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
        })

        const afterUpdate = new Date()
        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        const updatedAt = new Date(updatedTask!.updatedAt!)

        expect(updatedAt.getTime()).to.be.at.least(beforeUpdate.getTime())
        expect(updatedAt.getTime()).to.be.at.most(afterUpdate.getTime())
      })

      it('should not modify createdAt timestamp', () => {
        const task = createFeatureTask({id: 'F-001'})
        const originalCreatedAt = task.createdAt
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.createdAt).to.equal(originalCreatedAt)
      })

      it('should override updatedAt even if provided in updates', () => {
        const task = createFeatureTask({id: 'F-001'})
        const roadmap = createRoadmap({tasks: [task]})
        const customTimestamp = '2020-01-01T00:00:00.000Z'
        const beforeUpdate = new Date()

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
          updatedAt: customTimestamp,
        })

        const afterUpdate = new Date()
        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        const updatedAt = new Date(updatedTask!.updatedAt!)

        // Should use current timestamp, not the custom one
        expect(updatedAt.getTime()).to.be.at.least(beforeUpdate.getTime())
        expect(updatedAt.getTime()).to.be.at.most(afterUpdate.getTime())
        expect(updatedTask!.updatedAt).to.not.equal(customTimestamp)
      })
    })

    describe('immutability', () => {
      it('should not mutate the original roadmap', () => {
        const task = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
        const roadmap = createRoadmap({tasks: [task]})
        const originalStatus = roadmap.tasks[0].status

        taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.Completed,
        })

        expect(roadmap.tasks[0].status).to.equal(originalStatus)
        expect(roadmap.tasks[0].status).to.equal(STATUS.NotStarted)
      })

      it('should return a new roadmap object', () => {
        const task = createFeatureTask({id: 'F-001'})
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
        })

        expect(updatedRoadmap).to.not.equal(roadmap)
        expect(updatedRoadmap.tasks).to.not.equal(roadmap.tasks)
      })

      it('should not mutate the original task object', () => {
        const task = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
        const roadmap = createRoadmap({tasks: [task]})
        const originalTask = roadmap.tasks[0]
        const originalStatus = originalTask.status

        taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.Completed,
        })

        expect(originalTask.status).to.equal(originalStatus)
        expect(originalTask.status).to.equal(STATUS.NotStarted)
      })
    })

    describe('error handling', () => {
      it('should throw error when task ID not found', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'})],
        })

        expect(() =>
          taskService.updateTask(roadmap, 'F-999', {
            status: STATUS.InProgress,
          }),
        ).to.throw('Task not found: F-999')
      })

      it('should throw error for empty roadmap', () => {
        const roadmap = createEmptyRoadmap()

        expect(() =>
          taskService.updateTask(roadmap, 'F-001', {
            status: STATUS.InProgress,
          }),
        ).to.throw('Task not found: F-001')
      })

      it('should include task ID in error message', () => {
        const roadmap = createRoadmap({
          tasks: [createFeatureTask({id: 'F-001'})],
        })

        try {
          taskService.updateTask(roadmap, 'B-042', {
            status: STATUS.InProgress,
          })
          expect.fail('Should have thrown error')
        } catch (error) {
          expect((error as Error).message).to.include('B-042')
        }
      })
    })

    describe('edge cases', () => {
      it('should update only specified fields, preserve others', () => {
        const task = createFeatureTask({
          details: 'Original details',
          id: 'F-001',
          priority: PRIORITY.High,
          status: STATUS.NotStarted,
          title: 'Original title',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.InProgress,
        })

        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        expect(updatedTask!.status).to.equal(STATUS.InProgress)
        expect(updatedTask!.title).to.equal('Original title')
        expect(updatedTask!.details).to.equal('Original details')
        expect(updatedTask!.priority).to.equal(PRIORITY.High)
      })

      it('should handle empty updates object (only updates timestamp)', () => {
        const task = createFeatureTask({id: 'F-001'})
        const roadmap = createRoadmap({tasks: [task]})
        const beforeUpdate = new Date()

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {})

        const afterUpdate = new Date()
        const updatedTask = taskService.findTask(updatedRoadmap, 'F-001')
        const updatedAt = new Date(updatedTask!.updatedAt!)

        // Verify timestamp was updated
        expect(updatedAt.getTime()).to.be.at.least(beforeUpdate.getTime())
        expect(updatedAt.getTime()).to.be.at.most(afterUpdate.getTime())
        expect(updatedTask!.id).to.equal('F-001')
      })

      it('should update task at beginning of task list', () => {
        const roadmap = createRoadmap({
          tasks: [
            createFeatureTask({id: 'F-001', status: STATUS.NotStarted}),
            createFeatureTask({id: 'F-002'}),
            createFeatureTask({id: 'F-003'}),
          ],
        })

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-001', {
          status: STATUS.Completed,
        })

        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[1].id).to.equal('F-002')
        expect(updatedRoadmap.tasks[2].id).to.equal('F-003')
      })

      it('should update task at end of task list', () => {
        const roadmap = createRoadmap({
          tasks: [
            createFeatureTask({id: 'F-001'}),
            createFeatureTask({id: 'F-002'}),
            createFeatureTask({id: 'F-003', status: STATUS.NotStarted}),
          ],
        })

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-003', {
          status: STATUS.Completed,
        })

        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[1].id).to.equal('F-002')
        expect(updatedRoadmap.tasks[2].status).to.equal(STATUS.Completed)
      })

      it('should update task in middle of task list', () => {
        const roadmap = createRoadmap({
          tasks: [
            createFeatureTask({id: 'F-001'}),
            createFeatureTask({id: 'F-002', status: STATUS.NotStarted}),
            createFeatureTask({id: 'F-003'}),
          ],
        })

        const updatedRoadmap = taskService.updateTask(roadmap, 'F-002', {
          status: STATUS.Completed,
        })

        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[1].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[2].id).to.equal('F-003')
      })
    })
  })
})
