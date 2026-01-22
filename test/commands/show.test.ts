import {expect} from 'chai'

import Show from '../../src/commands/show.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'

describe('show command', () => {
  describe('basic functionality', () => {
    it('should display task details', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', title: 'Test Feature'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Test Feature')
      })
    })

    it('should display task ID in output', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', title: 'Feature'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/F-001/i)
      })
    })

    it('should display task title in output', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', title: 'My Feature Title'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('My Feature Title')
      })
    })
  })

  describe('field display', () => {
    it('should display task type', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', type: TASK_TYPE.Feature})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/type.*feature/i)
      })
    })

    it('should display task status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', status: STATUS.InProgress})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/status.*In Progress/i)
      })
    })

    it('should display task priority', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', priority: PRIORITY.High})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/priority.*high/i)
      })
    })

    it('should display task details field', async () => {
      resetTaskCounter()
      const task = createFeatureTask({details: 'This is a detailed description', id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('This is a detailed description')
      })
    })

    it('should display passes-tests status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', 'passes-tests': true})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/test/i)
      })
    })

    it('should display task tags when present', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', tags: ['frontend', 'ui', 'urgent']})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('frontend')
        expect(result.stdout).to.include('ui')
        expect(result.stdout).to.include('urgent')
      })
    })
  })

  describe('task with dependencies', () => {
    it('should display depends-on dependencies', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({'depends-on': ['F-001', 'F-002'], id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-003'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('F-002')
      })
    })

    it('should display blocks dependencies', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({blocks: ['F-002', 'F-003'], id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-002')
        expect(result.stdout).to.include('F-003')
      })
    })
  })

  describe('task with notes', () => {
    it('should display task notes when present', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Important notes about this task'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('Important notes about this task')
      })
    })

    it('should display multiline notes', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001', notes: 'Line 1\nLine 2\nLine 3'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('Line 1')
        expect(result.stdout).to.include('Line 2')
        expect(result.stdout).to.include('Line 3')
      })
    })
  })

  describe('error handling', () => {
    it('should fail when task not found', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-999'], {}, tempDir)

        assertCommandError(result, /task.*F-999.*not found/i)
      })
    })

    it('should suggest using prt list when task not found', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-999'], {}, tempDir)

        assertCommandError(result, /prt list/i)
      })
    })

    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Show, ['F-001'], {}, tempDir)

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
          const result = await runCommand(Show, ['F-001'], {verbose: true}, tempDir)

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
    it('should display different task types correctly', async () => {
      resetTaskCounter()
      const featureTask = createFeatureTask({id: 'F-001', title: 'Feature Task', type: TASK_TYPE.Feature})
      const bugTask = createBugTask({id: 'B-001', title: 'Bug Task', type: TASK_TYPE.Bug})
      const roadmap = createRoadmap({tasks: [featureTask, bugTask]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const featureResult = await runCommand(Show, ['F-001'], {}, tempDir)
        const bugResult = await runCommand(Show, ['B-001'], {}, tempDir)

        assertCommandSuccess(featureResult)
        assertCommandSuccess(bugResult)
        expect(featureResult.stdout).to.include('Feature Task')
        expect(bugResult.stdout).to.include('Bug Task')
      })
    })

    it('should display complete task information', async () => {
      resetTaskCounter()
      const task = createFeatureTask({
        blocks: ['F-002'],
        'depends-on': ['F-003'],
        details: 'Comprehensive task details',
        id: 'F-001',
        notes: 'Task notes',
        'passes-tests': true,
        priority: PRIORITY.High,
        status: STATUS.InProgress,
        tags: ['frontend', 'critical'],
        title: 'Complex Feature',
        type: TASK_TYPE.Feature,
      })
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Show, ['F-001'], {}, tempDir)

        assertCommandSuccess(result)
        // Verify all key information is present
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Complex Feature')
        expect(result.stdout).to.include('Comprehensive task details')
        expect(result.stdout).to.include('Task notes')
        expect(result.stdout).to.match(/high/i)
        expect(result.stdout).to.match(/In Progress/i)
        expect(result.stdout).to.include('frontend')
        expect(result.stdout).to.include('critical')
        expect(result.stdout).to.include('F-002')
        expect(result.stdout).to.include('F-003')
      })
    })
  })
})
