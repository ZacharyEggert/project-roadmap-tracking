import {expect} from 'chai'

import Update from '../../src/commands/update.js'
import {PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'
import {readTempJsonFile} from '../helpers/fs-helpers.js'

describe('update command', () => {
  describe('basic functionality', () => {
    it('should update task status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(Update, ['F-001'], {status: STATUS.InProgress}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('Task F-001 has been updated')

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.InProgress)
      })
    })

    it('should update task to completed status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {status: STATUS.Completed}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
      })
    })

    it('should update task to not-started status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {status: STATUS.NotStarted}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.NotStarted)
      })
    })

    it('should update updatedAt timestamp', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', updatedAt: '2020-01-01T00:00:00.000Z'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {status: STATUS.InProgress}, tempDir)

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

  describe('notes handling', () => {
    it('should append notes to existing notes', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Original notes'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {notes: 'New notes'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].notes).to.equal('Original notes\nNew notes')
      })
    })

    it('should add notes to task with no existing notes', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: ''})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {notes: 'First notes'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].notes).to.equal('First notes')
      })
    })

    it('should clear notes with --clear-notes flag', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Original notes'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {'clear-notes': true}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].notes).to.equal('')
      })
    })

    it('should clear notes and add new notes when both flags provided', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Original notes'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {'clear-notes': true, notes: 'Replacement notes'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].notes).to.equal('Replacement notes')
      })
    })
  })

  describe('dependencies', () => {
    it('should update depends-on with valid task IDs', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-003'], {deps: 'F-001,F-002'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[2]['depends-on']).to.deep.equal(['F-001', 'F-002'])
      })
    })

    it('should update depends-on with single task ID', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const roadmap = createRoadmap({tasks: [task1, task2]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-002'], {deps: 'F-001'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[1]['depends-on']).to.deep.equal(['F-001'])
      })
    })

    it('should handle whitespace in dependencies', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-003'], {deps: 'F-001 , F-002'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[2]['depends-on']).to.deep.equal(['F-001', 'F-002'])
      })
    })

    it('should fail with invalid task ID in dependencies', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Update, ['F-001'], {deps: 'INVALID-ID'}, tempDir)

        assertCommandError(result, /Invalid task ID in dependencies/)
      })
    })

    it('should fail with malformed task ID in dependencies', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Update, ['F-001'], {deps: 'F001'}, tempDir)

        assertCommandError(result, /Invalid task ID in dependencies/)
      })
    })
  })

  describe('tested flag', () => {
    it('should set passes-tests to true', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {tested: 'true'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
      })
    })

    it('should set passes-tests to false', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {tested: 'false'}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.false
      })
    })
  })

  describe('multiple field updates', () => {
    it('should update status and notes together', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Original', status: STATUS.NotStarted})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {notes: 'Additional', status: STATUS.InProgress}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.InProgress)
        expect(updatedRoadmap.tasks[0].notes).to.equal('Original\nAdditional')
      })
    })

    it('should update status, notes, and tested together', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': false, status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(
          Update,
          ['F-001'],
          {notes: 'All tests pass', status: STATUS.Completed, tested: 'true'},
          tempDir,
        )

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.Completed)
        expect(updatedRoadmap.tasks[0]['passes-tests']).to.be.true
        expect(updatedRoadmap.tasks[0].notes).to.equal('All tests pass')
      })
    })

    it('should update all possible fields at once', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        id: 'F-002',
        notes: 'Old notes',
        'passes-tests': false,
        status: STATUS.NotStarted,
      })
      const roadmap = createRoadmap({tasks: [task1, task2]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(
          Update,
          ['F-002'],
          {deps: 'F-001', notes: 'New notes', status: STATUS.InProgress, tested: 'true'},
          tempDir,
        )

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        const updatedTask = updatedRoadmap.tasks[1]
        expect(updatedTask.status).to.equal(STATUS.InProgress)
        expect(updatedTask['passes-tests']).to.be.true
        expect(updatedTask.notes).to.equal('Old notes\nNew notes')
        expect(updatedTask['depends-on']).to.deep.equal(['F-001'])
      })
    })
  })

  describe('error handling', () => {
    it('should fail when task not found', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Update, ['F-999'], {status: STATUS.InProgress}, tempDir)

        assertCommandError(result, /Task not found: F-999/i)
      })
    })

    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Update, ['F-001'], {status: STATUS.InProgress}, tempDir)

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
          const result = await runCommand(Update, ['F-001'], {status: STATUS.InProgress, verbose: true}, tempDir)

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
    it('should preserve other task fields when updating', async () => {
      resetTaskCounter()
      const task = createFeatureTask({
        details: 'Important details',
        id: 'F-001',
        priority: PRIORITY.High,
        status: STATUS.NotStarted,
        tags: ['frontend', 'urgent'],
        title: 'Original Title',
        type: TASK_TYPE.Feature,
      })
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {status: STATUS.InProgress}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        const updatedTask = updatedRoadmap.tasks[0]
        expect(updatedTask.title).to.equal('Original Title')
        expect(updatedTask.details).to.equal('Important details')
        expect(updatedTask.priority).to.equal(PRIORITY.High)
        expect(updatedTask.type).to.equal(TASK_TYPE.Feature)
        expect(updatedTask.tags).to.deep.equal(['frontend', 'urgent'])
      })
    })

    it('should preserve other tasks in roadmap', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001', title: 'Task 1'})
      const task2 = createBugTask({id: 'B-001', title: 'Task 2'})
      const task3 = createFeatureTask({id: 'F-002', title: 'Task 3'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['B-001'], {status: STATUS.InProgress}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(3)
        expect(updatedRoadmap.tasks[0].title).to.equal('Task 1')
        expect(updatedRoadmap.tasks[1].title).to.equal('Task 2')
        expect(updatedRoadmap.tasks[2].title).to.equal('Task 3')
      })
    })

    it('should handle updates to different task types', async () => {
      resetTaskCounter()
      const featureTask = createFeatureTask({id: 'F-001'})
      const bugTask = createBugTask({id: 'B-001'})
      const roadmap = createRoadmap({tasks: [featureTask, bugTask]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Update, ['F-001'], {status: STATUS.InProgress}, tempDir)
        await runCommand(Update, ['B-001'], {status: STATUS.Completed}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.InProgress)
        expect(updatedRoadmap.tasks[1].status).to.equal(STATUS.Completed)
      })
    })
  })
})
