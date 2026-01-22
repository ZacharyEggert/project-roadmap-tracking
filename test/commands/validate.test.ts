import {expect} from 'chai'
import {writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import Validate from '../../src/commands/validate.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap, createSimpleRoadmap} from '../fixtures/roadmap-factory.js'
import {createFeatureTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'

describe('validate command', () => {
  describe('valid roadmaps', () => {
    it('should pass validation for empty roadmap', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/roadmap contains no tasks/i)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should pass validation for simple valid roadmap', async () => {
      const roadmap = createSimpleRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should pass validation for roadmap with single task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/valid JSON/i)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should pass validation for roadmap with multiple valid tasks', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should pass validation for roadmap with valid dependencies', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({'depends-on': ['F-001'], id: 'F-002'})
      const task3 = createFeatureTask({'depends-on': ['F-001', 'F-002'], id: 'F-003'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/all task dependencies are valid/i)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })
  })

  describe('invalid JSON', () => {
    it('should fail validation for malformed JSON', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        // Write invalid JSON to the roadmap file
        await writeFile(roadmapPath, '{ invalid json }', 'utf8')

        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result, /not valid JSON/i)
      })
    })

    it('should fail validation for incomplete JSON', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({roadmapPath, tempDir}) => {
        // Write incomplete JSON
        await writeFile(roadmapPath, '{"name": "Test", "tasks": [', 'utf8')

        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result, /not valid JSON/i)
      })
    })
  })

  describe('invalid tasks', () => {
    it('should fail validation for task with invalid status', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      // @ts-expect-error - intentionally setting invalid status for testing
      task.status = 'invalid-status'
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.error?.message).to.match(/F-001.*invalid/i)
      })
    })

    it('should fail validation for task with invalid priority', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      // @ts-expect-error - intentionally setting invalid priority for testing
      task.priority = 'invalid-priority'
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.error?.message).to.match(/F-001.*invalid/i)
      })
    })

    it('should fail validation for task with missing details field', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      task.details = ''
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.error?.message).to.match(/F-001.*invalid/i)
      })
    })
  })

  describe('circular dependencies', () => {
    it('should fail validation for simple circular dependency (A -> B -> A)', async () => {
      resetTaskCounter()
      const taskA = createFeatureTask({'depends-on': ['F-002'], id: 'F-001'})
      const taskB = createFeatureTask({'depends-on': ['F-001'], id: 'F-002'})
      const roadmap = createRoadmap({tasks: [taskA, taskB]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.stdout).to.match(/circular/i)
        expect(result.error?.message).to.match(/validation failed/i)
      })
    })

    it('should fail validation for complex circular dependency (A -> B -> C -> A)', async () => {
      resetTaskCounter()
      const taskA = createFeatureTask({'depends-on': ['F-002'], id: 'F-001'})
      const taskB = createFeatureTask({'depends-on': ['F-003'], id: 'F-002'})
      const taskC = createFeatureTask({'depends-on': ['F-001'], id: 'F-003'})
      const roadmap = createRoadmap({tasks: [taskA, taskB, taskC]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.stdout).to.match(/circular/i)
        expect(result.error?.message).to.match(/validation failed/i)
      })
    })

    it('should fail validation for self-referential dependency', async () => {
      resetTaskCounter()
      const task = createFeatureTask({'depends-on': ['F-001'], id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.stdout).to.match(/circular/i)
      })
    })
  })

  describe('invalid task references', () => {
    it('should fail validation for depends-on referencing non-existent task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({'depends-on': ['F-999'], id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.stdout).to.match(/F-999/i)
      })
    })

    it('should fail validation for blocks referencing non-existent task', async () => {
      resetTaskCounter()
      const task = createFeatureTask({blocks: ['F-999'], id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        expect(result.stdout).to.match(/F-999/i)
      })
    })

    it('should fail validation for multiple invalid references', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({'depends-on': ['F-888', 'F-999'], id: 'F-001'})
      const task2 = createFeatureTask({blocks: ['F-777'], id: 'F-002'})
      const roadmap = createRoadmap({tasks: [task1, task2]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        // Should mention multiple invalid references
        expect(result.stdout).to.match(/F-888|F-999|F-777/i)
      })
    })
  })

  // Note: Duplicate task ID validation is not currently implemented in the validate command

  describe('error handling', () => {
    it('should fail when config not found (exit code 3)', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(
        roadmap,
        async ({tempDir}) => {
          const result = await runCommand(Validate, [], {}, tempDir)

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
          const result = await runCommand(Validate, [], {verbose: true}, tempDir)

          assertCommandError(result)
          expect(result.exitCode).to.not.equal(0)
          expect(result.error?.message).to.not.be.empty
          expect(result.error?.message).to.match(/Code:/i)
        },
        false,
      )
    })
  })

  describe('output validation', () => {
    it('should display validation progress messages', async () => {
      resetTaskCounter()
      const task = createFeatureTask({id: 'F-001'})
      const roadmap = createRoadmap({tasks: [task]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validating roadmap/i)
        expect(result.stdout).to.match(/validating task dependencies/i)
      })
    })

    it('should display all validation errors for multiple issues', async () => {
      resetTaskCounter()
      // Create a roadmap with multiple issues: circular dependency + invalid reference
      const taskA = createFeatureTask({'depends-on': ['F-002', 'F-999'], id: 'F-001'})
      const taskB = createFeatureTask({'depends-on': ['F-001'], id: 'F-002'})
      const roadmap = createRoadmap({tasks: [taskA, taskB]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandError(result)
        // Should display multiple errors
        expect(result.stdout.length).to.be.greaterThan(50) // Should have substantial output
      })
    })

    it('should validate roadmap JSON structure message', async () => {
      const roadmap = createSimpleRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/valid JSON/i)
      })
    })
  })

  describe('integration', () => {
    it('should handle complex valid roadmaps', async () => {
      resetTaskCounter()
      // Create a complex but valid dependency graph
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({'depends-on': ['F-001'], id: 'F-002'})
      const task3 = createFeatureTask({'depends-on': ['F-001'], id: 'F-003'})
      const task4 = createFeatureTask({'depends-on': ['F-002', 'F-003'], id: 'F-004'})
      const roadmap = createRoadmap({tasks: [task1, task2, task3, task4]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/all task dependencies are valid/i)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should validate roadmap with all task types', async () => {
      resetTaskCounter()
      const featureTask = createFeatureTask({id: 'F-001', type: TASK_TYPE.Feature})
      const bugTask = createFeatureTask({id: 'B-001', type: TASK_TYPE.Bug})
      const improvementTask = createFeatureTask({id: 'I-001', type: TASK_TYPE.Improvement})
      const planningTask = createFeatureTask({id: 'P-001', type: TASK_TYPE.Planning})
      const researchTask = createFeatureTask({id: 'R-001', type: TASK_TYPE.Research})
      const roadmap = createRoadmap({tasks: [featureTask, bugTask, improvementTask, planningTask, researchTask]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should validate roadmap with all statuses', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001', status: STATUS.NotStarted})
      const task2 = createFeatureTask({id: 'F-002', status: STATUS.InProgress})
      const task3 = createFeatureTask({id: 'F-003', status: STATUS.Completed})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })

    it('should validate roadmap with all priorities', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({id: 'F-001', priority: PRIORITY.High})
      const task2 = createFeatureTask({id: 'F-002', priority: PRIORITY.Medium})
      const task3 = createFeatureTask({id: 'F-003', priority: PRIORITY.Low})
      const roadmap = createRoadmap({tasks: [task1, task2, task3]})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(Validate, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.match(/validation complete/i)
      })
    })
  })
})
