import {expect} from 'chai'

import Complete from '../../src/commands/complete.js'
import {Roadmap, STATUS} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'
import {readTempJsonFile} from '../helpers/fs-helpers.js'

describe('complete command', () => {
  describe('basic functionality', () => {
    it('should mark task as completed', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(Complete, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('Task F-001 marked as completed')

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
      })
    })

    it('should mark not-started task as completed', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
      })
    })

    it('should update updatedAt timestamp', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.InProgress, updatedAt: '2020-01-01T00:00:00.000Z'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].updatedAt).to.not.equal('2020-01-01T00:00:00.000Z')
        // Should be a recent timestamp
        const updatedDate = new Date(updatedRoadmap.tasks[0].updatedAt!)
        const now = new Date()
        const diffInMs = now.getTime() - updatedDate.getTime()
        expect(diffInMs).to.be.lessThan(5000) // Within 5 seconds
      })
    })
  })

  describe('with tests flag', () => {
    it('should mark task as completed and passing tests with --tests flag', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {tests: true}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should set passes-tests to true even if already true', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {tests: true}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })
  })

  describe('without tests flag', () => {
    it('should not change passes-tests when flag not provided', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.false
      })
    })

    it('should preserve passes-tests true when flag not provided', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })
  })

  describe('idempotency', () => {
    it('should succeed when completing already-completed task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.Completed})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(Complete, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
      })
    })

    it('should succeed when completing already-completed task with --tests', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true, status: STATUS.Completed})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(Complete, ['F-001'], {tests: true}, tempDir)

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })
  })

  describe('error handling', () => {
    it('should fail when task not found', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Complete, ['F-999'], {}, tempDir)

        assertCommandError(result, /Task not found: F-999/i)
      })
    })

    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Complete, ['F-001'], {}, tempDir)

          assertCommandError(result, /config file/i)
          expect(result.exitCode).to.equal(3)
        },
        false, // Don't create config file
      )
    })

    it('should show detailed error with --verbose flag', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Complete, ['F-001'], {verbose: true}, tempDir)

          assertCommandError(result)
          expect(result.exitCode).to.not.equal(0)
          expect(result.error?.message).to.not.be.empty
          expect(result.error?.message).to.match(/Code:/i)
        },
        false,
      )
    })
  })

  describe('integration', () => {
    it('should preserve other task fields when completing', async () => {
      resetTaskCounter()
      const task = createFeatureTask({
        details: 'Important details',
        id: 'F-001',
        notes: 'Some notes',
        status: STATUS.InProgress,
        tags: ['frontend', 'urgent'],
        title: 'Original Title',
      })
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        const updatedTask = updatedRoadmap.tasks[0]
        expect(updatedTask.title).to.equal('Original Title')
        expect(updatedTask.details).to.equal('Important details')
        expect(updatedTask.notes).to.equal('Some notes')
        expect(updatedTask.tags).to.deep.equal(['frontend', 'urgent'])
      })
    })

    it('should preserve other tasks in roadmap', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001', status: STATUS.InProgress, title: 'Task 1'})
      const task2 = createBugTask({id: 'B-001', status: STATUS.NotStarted, title: 'Task 2'})
      const task3 = createFeatureTask({id: 'F-002', status: STATUS.Completed, title: 'Task 3'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(3)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[1].status).to.equal(STATUS.NotStarted)
        expect(updatedRoadmap.tasks[2].status).to.equal(STATUS.Completed)
      })
    })

    it('should handle completing different task types', async () => {
      resetTaskCounter()
      const featureTask = createFeatureTask({id: 'F-001', status: STATUS.InProgress})
      const bugTask = createBugTask({id: 'B-001', status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [featureTask, bugTask]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Complete, ['F-001'], {tests: true}, tempDir)
        await runCommand(Complete, ['B-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
        expect(updatedRoadmap.tasks[1].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[1]['passes-tests']).to.be.false
      })
    })
  })
})
