import {expect} from 'chai'

import Add from '../../src/commands/add.js'
import {PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, createPlanningTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'
import {readTempJsonFile} from '../helpers/fs-helpers.js'

describe('add command', () => {
  describe('basic functionality', () => {
    it('should create task with correct ID', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(
          Add,
          ['Test Feature'],
          {details: 'Test feature details', type: TASK_TYPE.Feature},
          tempDir,
        )

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(1)
        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[0].title).to.equal('Test Feature')
      })
    })

    it('should generate sequential IDs per type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        // Add first feature
        await runCommand(Add, ['Feature 1'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        // Add second feature
        await runCommand(Add, ['Feature 2'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        // Add third feature
        await runCommand(Add, ['Feature 3'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(3)
        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[1].id).to.equal('F-002')
        expect(updatedRoadmap.tasks[2].id).to.equal('F-003')
      })
    })

    it('should fill gaps in ID sequence', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [createBugTask({id: 'B-001'}), createBugTask({id: 'B-003'})],
      })

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(Add, ['New Bug'], {details: 'Bug details', type: TASK_TYPE.Bug}, tempDir)

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(3)
        expect(updatedRoadmap.tasks[2].id).to.equal('B-002')
      })
    })

    it('should add task with all required flags', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(
          Add,
          ['Required Task'],
          {details: 'Task details', type: TASK_TYPE.Feature},
          tempDir,
        )

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(1)
        expect(updatedRoadmap.tasks[0].title).to.equal('Required Task')
        expect(updatedRoadmap.tasks[0].details).to.equal('Task details')
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Feature)
      })
    })

    it('should add task with optional flags (priority, status, tags)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        const result = await runCommand(
          Add,
          ['Task with Options'],
          {
            details: 'Detailed description',
            priority: PRIORITY.High,
            status: STATUS.InProgress,
            tags: 'frontend,ui,urgent',
            type: TASK_TYPE.Feature,
          },
          tempDir,
        )

        assertCommandSuccess(result)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(1)
        expect(updatedRoadmap.tasks[0].priority).to.equal(PRIORITY.High)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.InProgress)
        expect(updatedRoadmap.tasks[0].tags).to.deep.equal(['frontend', 'ui', 'urgent'])
      })
    })

    it('should write task to roadmap file', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Test Task'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(1)
        expect(updatedRoadmap.tasks[0].id).to.equal('B-001')
      })
    })
  })

  describe('ID generation', () => {
    it('should generate F-001 for first feature', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Feature'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
      })
    })

    it('should generate B-001 for first bug', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Bug'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].id).to.equal('B-001')
      })
    })

    it('should generate sequential IDs (B-001, B-002, B-003)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Bug 1'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)
        await runCommand(Add, ['Bug 2'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)
        await runCommand(Add, ['Bug 3'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].id).to.equal('B-001')
        expect(updatedRoadmap.tasks[1].id).to.equal('B-002')
        expect(updatedRoadmap.tasks[2].id).to.equal('B-003')
      })
    })

    it('should handle multiple task types independently', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Bug'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)
        await runCommand(Add, ['Feature'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)
        await runCommand(Add, ['Bug 2'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)
        await runCommand(Add, ['Feature 2'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].id).to.equal('B-001')
        expect(updatedRoadmap.tasks[1].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[2].id).to.equal('B-002')
        expect(updatedRoadmap.tasks[3].id).to.equal('F-002')
      })
    })

    it('should fill gaps when tasks deleted', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001'}), createFeatureTask({id: 'F-005'})],
      })

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Feature'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[2].id).to.equal('F-002')
      })
    })
  })

  describe('flags and options', () => {
    it('should accept bug task type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Bug Task'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Bug)
      })
    })

    it('should accept feature task type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Feature Task'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Feature)
      })
    })

    it('should accept improvement task type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Improvement Task'], {details: 'Details', type: TASK_TYPE.Improvement}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Improvement)
      })
    })

    it('should accept planning task type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Planning Task'], {details: 'Details', type: TASK_TYPE.Planning}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Planning)
      })
    })

    it('should accept research task type', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Research Task'], {details: 'Details', type: TASK_TYPE.Research}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].type).to.equal(TASK_TYPE.Research)
      })
    })

    it('should use default priority (medium)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Task'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].priority).to.equal(PRIORITY.Medium)
      })
    })

    it('should use default status (not-started)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Task'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].status).to.equal(STATUS.NotStarted)
      })
    })

    it('should parse comma-separated tags correctly', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['Task'], {details: 'Details', tags: 'tag1,tag2,tag3', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].tags).to.deep.equal(['tag1', 'tag2', 'tag3'])
      })
    })

    it('should handle tags with whitespace', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(
          Add,
          ['Task'],
          {details: 'Details', tags: 'tag1 , tag2 , tag3', type: TASK_TYPE.Feature},
          tempDir,
        )

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks[0].tags).to.deep.equal(['tag1', 'tag2', 'tag3'])
      })
    })
  })

  describe('error handling', () => {
    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      // Create temp roadmap WITHOUT config file
      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Add, ['Task'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)

          assertCommandError(result, /config file/i)
          expect(result.exitCode).to.equal(3)
        },
        false, // Don't create config file
      )
    })

    it('should show detailed error with --verbose flag', async () => {
      const roadmap = createEmptyRoadmap()

      // Create temp roadmap WITHOUT config file
      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(
            Add,
            ['Task'],
            {details: 'Details', type: TASK_TYPE.Feature, verbose: true},
            tempDir,
          )

          assertCommandError(result)
          expect(result.exitCode).to.not.equal(0)
          // Verbose flag should include additional error information in error message
          expect(result.error?.message).to.not.be.empty
          // With verbose, error should contain 'Code:' and context information
          expect(result.error?.message).to.match(/Code:/i)
        },
        false, // Don't create config file
      )
    })
  })

  describe('integration', () => {
    it('should verify task appears in roadmap after add', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['New Task'], {details: 'Task details', type: TASK_TYPE.Feature}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        const addedTask = updatedRoadmap.tasks.find((t) => t.title === 'New Task')
        expect(addedTask).to.exist
        expect(addedTask!.details).to.equal('Task details')
      })
    })

    it('should preserve existing tasks when adding new ones', async () => {
      resetTaskCounter()
      const existingTask = createPlanningTask({id: 'P-001', title: 'Existing Task'})
      const roadmap = createRoadmap({tasks: [existingTask]})

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        await runCommand(Add, ['New Task'], {details: 'New details', type: TASK_TYPE.Planning}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(2)
        expect(updatedRoadmap.tasks[0].title).to.equal('Existing Task')
        expect(updatedRoadmap.tasks[1].title).to.equal('New Task')
      })
    })

    it('should update roadmap file atomically', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001'}), createBugTask({id: 'B-001'})],
      })

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        // Add multiple tasks sequentially
        await runCommand(Add, ['Task 1'], {details: 'Details', type: TASK_TYPE.Feature}, tempDir)
        await runCommand(Add, ['Task 2'], {details: 'Details', type: TASK_TYPE.Bug}, tempDir)

        const updatedRoadmap = await readTempJsonFile<Roadmap>(roadmapPath)
        expect(updatedRoadmap.tasks).to.have.lengthOf(4)
        // Verify all tasks are present
        expect(updatedRoadmap.tasks[0].id).to.equal('F-001')
        expect(updatedRoadmap.tasks[1].id).to.equal('B-001')
        expect(updatedRoadmap.tasks[2].id).to.equal('F-002')
        expect(updatedRoadmap.tasks[3].id).to.equal('B-002')
      })
    })
  })
}) // .timeout(50_000) // Extend timeout for file operations
