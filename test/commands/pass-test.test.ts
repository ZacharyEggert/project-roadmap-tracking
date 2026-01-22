import {expect} from 'chai'

import PassTest from '../../src/commands/pass-test.js'
import {Roadmap, STATUS} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'
import {readTempJsonFile} from '../helpers/fs-helpers.js'

describe('pass-test command', () => {
  describe('basic functionality', () => {
    it('should mark task as passing tests', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(PassTest, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('Task F-001 marked as passing tests')

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should set passes-tests to true when initially false', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should update updatedAt timestamp', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, updatedAt: '2020-01-01T00:00:00.000Z'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

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

  describe('status preservation', () => {
    it('should preserve not-started status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.NotStarted})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.NotStarted)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should preserve in-progress status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.InProgress)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should preserve completed status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.Completed})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })
  })

  describe('idempotency', () => {
    it('should succeed when marking already-passing task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(PassTest, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should succeed multiple times on same task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)
        await runCommand(PassTest, ['F-001'], {}, tempDir)
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })
  })

  describe('error handling', () => {
    it('should fail when task not found', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(PassTest, ['F-999'], {}, tempDir)

        assertCommandError(result, /Task not found: F-999/i)
      })
    })

    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(PassTest, ['F-001'], {}, tempDir)

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
          const result = await runCommand(PassTest, ['F-001'], {verbose: true}, tempDir)

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
    it('should preserve other task fields', async () => {
      resetTaskCounter()
      const task = createFeatureTask({
        details: 'Important details',
        id: 'F-001',
        notes: 'Some notes',
        'passes-tests': false,
        status: STATUS.InProgress,
        tags: ['frontend', 'urgent'],
        title: 'Original Title',
      })
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        const updatedTask = updatedRoadmap.tasks[0]
        expect(updatedTask.title).to.equal('Original Title')
        expect(updatedTask.details).to.equal('Important details')
        expect(updatedTask.notes).to.equal('Some notes')
        expect(updatedTask.status).to.equal(STATUS.InProgress)
        expect(updatedTask.tags).to.deep.equal(['frontend', 'urgent'])
      })
    })

    it('should preserve other tasks in roadmap', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001', 'passes-tests': false, title: 'Task 1'})
      const task2 = createBugTask({id: 'B-001', 'passes-tests': true, title: 'Task 2'})
      const task3 = createFeatureTask({id: 'F-002', 'passes-tests': false, title: 'Task 3'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(3)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
        expect(updatedRoadmap.tasks[1]['passes-tests']).to.be.true
        expect(updatedRoadmap.tasks[2]['passes-tests']).to.be.false
      })
    })

    it('should handle different task types', async () => {
      resetTaskCounter()
      const featureTask = createFeatureTask({id: 'F-001', 'passes-tests': false})
      const bugTask = createBugTask({id: 'B-001', 'passes-tests': false})
      const roadmap = createRoadmap({tasks: [featureTask, bugTask]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(PassTest, ['F-001'], {}, tempDir)
        await runCommand(PassTest, ['B-001'], {}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
        expect(updatedRoadmap.tasks[1]['passes-tests']).to.be.true
      })
    })
  })
})
