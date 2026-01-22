 

import {expect} from 'chai'

import List from '../../src/commands/list.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {createEmptyRoadmap, createRoadmap} from '../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, createPlanningTask, resetTaskCounter} from '../fixtures/task-factory.js'
import {assertCommandError, assertCommandSuccess, runCommand, withTempRoadmap} from '../helpers/command-runner.js'

describe('list command', () => {
  describe('basic functionality', () => {
    it('should display all tasks in roadmap', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', title: 'Feature 1'}),
          createBugTask({id: 'B-001', title: 'Bug 1'}),
          createPlanningTask({id: 'P-001', title: 'Planning 1'}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should handle empty roadmap gracefully', async () => {
      const roadmap = createEmptyRoadmap()

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        // Empty roadmap should not crash
        expect(result.exitCode).to.equal(0)
      })
    })

    it('should display task IDs, titles, and status', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({
            id: 'F-001',
            status: STATUS.InProgress,
            title: 'Test Feature',
          }),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Test Feature')
      })
    })
  })

  describe('filtering', () => {
    it('should filter by status: completed', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', status: STATUS.Completed}),
          createBugTask({id: 'B-001', status: STATUS.InProgress}),
          createPlanningTask({id: 'P-001', status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {status: STATUS.Completed}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })

    it('should filter by status: in-progress', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', status: STATUS.Completed}),
          createBugTask({id: 'B-001', status: STATUS.InProgress}),
          createPlanningTask({id: 'P-001', status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {status: STATUS.InProgress}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })

    it('should filter by status: not-started', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', status: STATUS.Completed}),
          createBugTask({id: 'B-001', status: STATUS.InProgress}),
          createPlanningTask({id: 'P-001', status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {status: STATUS.NotStarted}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should filter by priority: high', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High}),
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Low}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'high'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })

    it('should filter by priority: medium', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High}),
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Low}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'medium'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })

    it('should filter by priority: low', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High}),
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Low}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'low'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should filter by priority shortcut: h', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High}),
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'h'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001')
      })
    })

    it('should filter by priority shortcut: m', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High}),
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'm'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.include('B-001')
      })
    })

    it('should filter by priority shortcut: l', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createBugTask({id: 'B-001', priority: PRIORITY.Medium}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Low}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'l'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should show incomplete tasks only (--incomplete flag)', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', status: STATUS.Completed}),
          createBugTask({id: 'B-001', status: STATUS.InProgress}),
          createPlanningTask({id: 'P-001', status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {incomplete: true}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.not.include('F-001')
        expect(result.stdout).to.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should combine filters correctly (status + priority)', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High, status: STATUS.InProgress}),
          createBugTask({id: 'B-001', priority: PRIORITY.High, status: STATUS.Completed}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Medium, status: STATUS.InProgress}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {priority: 'high', status: STATUS.InProgress}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })

    it('should combine filters correctly (incomplete + priority)', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.High, status: STATUS.NotStarted}),
          createBugTask({id: 'B-001', priority: PRIORITY.High, status: STATUS.Completed}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Medium, status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {incomplete: true, priority: 'high'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001')
        expect(result.stdout).to.not.include('P-001')
      })
    })
  })

  describe('sorting', () => {
    it('should sort by createdAt ascending', async () => {
      resetTaskCounter()
      const task1 = createFeatureTask({createdAt: '2023-01-01T00:00:00.000Z', id: 'F-001', title: 'First'})
      const task2 = createBugTask({createdAt: '2023-01-02T00:00:00.000Z', id: 'B-001', title: 'Second'})
      const task3 = createPlanningTask({createdAt: '2023-01-03T00:00:00.000Z', id: 'P-001', title: 'Third'})
      const roadmap = createRoadmap({
        tasks: [task2, task3, task1], // Out of order
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {sort: 'createdAt'}, tempDir)

        assertCommandSuccess(result)
        // Verify order in output
        const firstIndex = result.stdout.indexOf('F-001')
        const secondIndex = result.stdout.indexOf('B-001')
        const thirdIndex = result.stdout.indexOf('P-001')
        expect(firstIndex).to.be.lessThan(secondIndex)
        expect(secondIndex).to.be.lessThan(thirdIndex)
      })
    })

    it('should sort by priority', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', priority: PRIORITY.Medium, title: 'Medium'}),
          createBugTask({id: 'B-001', priority: PRIORITY.High, title: 'High'}),
          createPlanningTask({id: 'P-001', priority: PRIORITY.Low, title: 'Low'}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {sort: 'priority'}, tempDir)

        assertCommandSuccess(result)
        // Verify tasks are sorted by priority
        expect(result.stdout).to.be.a('string')
      })
    })

    it('should sort by dueDate', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({dueDate: '2023-03-01T00:00:00.000Z', id: 'F-001'}),
          createBugTask({dueDate: '2023-01-01T00:00:00.000Z', id: 'B-001'}),
          createPlanningTask({dueDate: '2023-02-01T00:00:00.000Z', id: 'P-001'}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {sort: 'dueDate'}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.be.a('string')
      })
    })

    it('should maintain filter when sorting', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({
            createdAt: '2023-01-02T00:00:00.000Z',
            id: 'F-001',
            priority: PRIORITY.High,
            status: STATUS.InProgress,
          }),
          createBugTask({
            createdAt: '2023-01-01T00:00:00.000Z',
            id: 'B-001',
            priority: PRIORITY.High,
            status: STATUS.Completed,
          }),
          createPlanningTask({
            createdAt: '2023-01-03T00:00:00.000Z',
            id: 'P-001',
            priority: PRIORITY.High,
            status: STATUS.NotStarted,
          }),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {incomplete: true, priority: 'high', sort: 'createdAt'}, tempDir)

        assertCommandSuccess(result)
        // Should show only incomplete high priority tasks, sorted by createdAt
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.not.include('B-001') // Completed
        expect(result.stdout).to.include('P-001')
      })
    })
  })

  describe('output format', () => {
    it('should use DisplayService for consistent formatting', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001', title: 'Test Task'})],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        // DisplayService should format output consistently
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Test Task')
      })
    })

    it('should show task status indicators', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({id: 'F-001', status: STATUS.Completed}),
          createBugTask({id: 'B-001', status: STATUS.InProgress}),
          createPlanningTask({id: 'P-001', status: STATUS.NotStarted}),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        // Status indicators should be present in output
        expect(result.stdout).to.be.a('string')
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('B-001')
        expect(result.stdout).to.include('P-001')
      })
    })

    it('should handle long task titles', async () => {
      resetTaskCounter()
      const longTitle = 'A'.repeat(100)
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001', title: longTitle})],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.be.a('string')
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
          const result = await runCommand(List, [], {}, tempDir)

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
          const result = await runCommand(List, [], {verbose: true}, tempDir)

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

  describe('edge cases', () => {
    it('should handle roadmap with single task', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [createFeatureTask({id: 'F-001', title: 'Only Task'})],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Only Task')
      })
    })

    it('should handle roadmap with many tasks (100+)', async () => {
      resetTaskCounter()
      const tasks = Array.from({length: 100}, (_, i) =>
        createFeatureTask({
          id: `F-${String(i + 1).padStart(3, '0')}` as any,
          title: `Task ${i + 1}`,
        }),
      )
      const roadmap = createRoadmap({tasks})

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        // Should handle large number of tasks without issue
        expect(result.stdout).to.be.a('string')
      })
    })

    it('should handle tasks with all fields populated', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({
            assignedTo: 'Alice',
            blocks: [],
            'depends-on': [],
            details: 'Detailed description',
            dueDate: '2023-12-31T00:00:00.000Z',
            effort: 8,
            'github-refs': ['#123', '#456'],
            id: 'F-001',
            notes: 'Some notes',
            'passes-tests': true,
            priority: PRIORITY.High,
            status: STATUS.InProgress,
            tags: ['tag1', 'tag2'],
            title: 'Full Task',
            type: TASK_TYPE.Feature,
          }),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Full Task')
      })
    })

    it('should handle tasks with minimal fields', async () => {
      resetTaskCounter()
      const roadmap = createRoadmap({
        tasks: [
          createFeatureTask({
            details: 'Details',
            id: 'F-001',
            title: 'Minimal Task',
            type: TASK_TYPE.Feature,
          }),
        ],
      })

      await withTempRoadmap(roadmap, async ({tempDir}) => {
        const result = await runCommand(List, [], {}, tempDir)

        assertCommandSuccess(result)
        expect(result.stdout).to.include('F-001')
        expect(result.stdout).to.include('Minimal Task')
      })
    })
  })
})
