/* eslint-disable max-nested-callbacks */
import {expect} from 'chai'

import {DisplayService} from '../../../src/services/display.service.js'
import {RoadmapStats} from '../../../src/services/roadmap.service.js'
import {DependencyValidationError} from '../../../src/services/task-dependency.service.js'
import {PRIORITY, STATUS, Task, TASK_TYPE} from '../../../src/util/types.js'
import {createSimpleRoadmap} from '../../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, createTask} from '../../fixtures/task-factory.js'

describe('DisplayService', () => {
  let displayService: DisplayService

  beforeEach(() => {
    displayService = new DisplayService()
  })

  describe('formatPriorityLabel', () => {
    it('should format high priority', () => {
      expect(displayService.formatPriorityLabel(PRIORITY.High)).to.equal('High')
    })

    it('should format medium priority', () => {
      expect(displayService.formatPriorityLabel(PRIORITY.Medium)).to.equal('Medium')
    })

    it('should format low priority', () => {
      expect(displayService.formatPriorityLabel(PRIORITY.Low)).to.equal('Low')
    })
  })

  describe('formatPrioritySymbol', () => {
    it('should format high priority as H', () => {
      expect(displayService.formatPrioritySymbol(PRIORITY.High)).to.equal('H')
    })

    it('should format medium priority as M', () => {
      expect(displayService.formatPrioritySymbol(PRIORITY.Medium)).to.equal('M')
    })

    it('should format low priority as L', () => {
      expect(displayService.formatPrioritySymbol(PRIORITY.Low)).to.equal('L')
    })
  })

  describe('formatStatusSymbol', () => {
    it('should format completed status as checkmark', () => {
      expect(displayService.formatStatusSymbol(STATUS.Completed)).to.equal('✓')
    })

    it('should format in-progress status as tilde', () => {
      expect(displayService.formatStatusSymbol(STATUS.InProgress)).to.equal('~')
    })

    it('should format not-started status as circle', () => {
      expect(displayService.formatStatusSymbol(STATUS.NotStarted)).to.equal('○')
    })
  })

  describe('formatStatusText', () => {
    it('should format completed status', () => {
      expect(displayService.formatStatusText(STATUS.Completed)).to.equal('Completed')
    })

    it('should format in-progress status with title case', () => {
      expect(displayService.formatStatusText(STATUS.InProgress)).to.equal('In Progress')
    })

    it('should format not-started status with title case', () => {
      expect(displayService.formatStatusText(STATUS.NotStarted)).to.equal('Not Started')
    })
  })

  describe('formatTestStatus', () => {
    it('should format passing tests as checkmark', () => {
      expect(displayService.formatTestStatus(true)).to.equal('✓')
    })

    it('should format failing tests as X', () => {
      expect(displayService.formatTestStatus(false)).to.equal('✗')
    })
  })

  describe('formatTaskDetails', () => {
    describe('basic formatting', () => {
      it('should format task with all basic fields', () => {
        const task = createFeatureTask({
          details: 'Task description here',
          id: 'F-001',
          priority: PRIORITY.High,
          status: STATUS.InProgress,
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines).to.be.an('array')
        expect(lines.join('\n')).to.include('Task: F-001')
        expect(lines.join('\n')).to.include('Title:')
        expect(lines.join('\n')).to.include('Type: feature')
        expect(lines.join('\n')).to.include('Priority: High')
        expect(lines.join('\n')).to.include('Status: ~ In Progress')
        expect(lines.join('\n')).to.include('Task description here')
      })

      it('should include test status in status line', () => {
        const task = createFeatureTask({'passes-tests': true})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('✓ Tests Passing')
      })

      it('should show failing tests', () => {
        const task = createFeatureTask({'passes-tests': false})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('✗ Tests Passing')
      })

      it('should include timestamps', () => {
        const createdAt = '2026-01-01T00:00:00.000Z'
        const updatedAt = '2026-01-15T12:30:00.000Z'
        const task = createFeatureTask({createdAt, updatedAt})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include(`Created: ${createdAt}`)
        expect(lines.join('\n')).to.include(`Updated: ${updatedAt}`)
      })

      it('should start with blank line', () => {
        const task = createFeatureTask()

        const lines = displayService.formatTaskDetails(task)

        expect(lines[0]).to.equal('')
      })

      it('should end with blank line', () => {
        const task = createFeatureTask()

        const lines = displayService.formatTaskDetails(task)

        expect(lines.at(-1)).to.equal('')
      })
    })

    describe('dependency formatting', () => {
      it('should show "None" when no dependencies', () => {
        const task = createFeatureTask({'depends-on': []})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Depends On: None')
      })

      it('should show comma-separated dependencies', () => {
        const task = createFeatureTask({
          'depends-on': ['F-001' as never, 'F-002' as never, 'B-003' as never],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Depends On: F-001, F-002, B-003')
      })

      it('should show single dependency', () => {
        const task = createFeatureTask({
          'depends-on': ['F-001' as never],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Depends On: F-001')
      })

      it('should not show blocks when empty', () => {
        const task = createFeatureTask({blocks: []})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('Blocks:')
      })

      it('should show blocks when present', () => {
        const task = createFeatureTask({
          blocks: ['F-005' as never, 'F-006' as never],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Blocks: F-005, F-006')
      })

      it('should show both dependencies and blocks', () => {
        const task = createFeatureTask({
          blocks: ['F-005' as never],
          'depends-on': ['F-001' as never],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Depends On: F-001')
        expect(lines.join('\n')).to.include('Blocks: F-005')
      })
    })

    describe('optional field formatting', () => {
      it('should show tags when present', () => {
        const task = createFeatureTask({
          tags: ['frontend', 'urgent', 'api'],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Tags: frontend, urgent, api')
      })

      it('should not show tags when empty', () => {
        const task = createFeatureTask({tags: []})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('Tags:')
      })

      it('should show effort when present', () => {
        const task = createFeatureTask({effort: 8})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Effort: 8')
      })

      it('should not show effort when undefined', () => {
        const task = createFeatureTask({effort: undefined})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('Effort:')
      })

      it('should show github-refs when present', () => {
        const task = createFeatureTask({
          'github-refs': ['#123', '#456', 'PR-789'],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('GitHub Refs: #123, #456, PR-789')
      })

      it('should not show github-refs when undefined', () => {
        const task = createFeatureTask({'github-refs': undefined})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('GitHub Refs:')
      })

      it('should not show github-refs when empty', () => {
        const task = createFeatureTask({'github-refs': []})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('GitHub Refs:')
      })

      it('should show notes when present', () => {
        const task = createFeatureTask({
          notes: 'This is a note about the task',
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Notes:')
        expect(lines.join('\n')).to.include('This is a note about the task')
      })

      it('should not show notes when null', () => {
        const task = createFeatureTask({notes: null})

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.not.include('Notes:')
      })
    })

    describe('edge cases', () => {
      it('should handle task with all optional fields populated', () => {
        const task = createFeatureTask({
          assignedTo: 'Alice',
          blocks: ['F-010' as never],
          'depends-on': ['F-001' as never],
          dueDate: '2026-02-01T00:00:00.000Z',
          effort: 13,
          'github-refs': ['#999'],
          notes: 'Important notes here',
          tags: ['critical'],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Depends On: F-001')
        expect(lines.join('\n')).to.include('Blocks: F-010')
        expect(lines.join('\n')).to.include('Tags: critical')
        expect(lines.join('\n')).to.include('Effort: 13')
        expect(lines.join('\n')).to.include('GitHub Refs: #999')
        expect(lines.join('\n')).to.include('Notes:')
        expect(lines.join('\n')).to.include('Important notes here')
      })

      it('should handle task with no optional fields', () => {
        const task = createFeatureTask({
          blocks: [],
          'depends-on': [],
          effort: undefined,
          'github-refs': undefined,
          notes: null,
          tags: [],
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines).to.be.an('array')
        expect(lines.join('\n')).to.include('Depends On: None')
        expect(lines.join('\n')).to.not.include('Blocks:')
        expect(lines.join('\n')).to.not.include('Tags:')
        expect(lines.join('\n')).to.not.include('Effort:')
        expect(lines.join('\n')).to.not.include('GitHub Refs:')
        expect(lines.join('\n')).to.not.include('Notes:')
      })

      it('should handle special characters in title', () => {
        const task = createFeatureTask({
          title: 'Feature with "quotes" and \'apostrophes\' & symbols',
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Feature with "quotes" and \'apostrophes\' & symbols')
      })

      it('should handle special characters in details', () => {
        const task = createFeatureTask({
          details: 'Details with <brackets> and {braces} and [arrays]',
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Details with <brackets> and {braces} and [arrays]')
      })

      it('should handle multi-line notes', () => {
        const task = createFeatureTask({
          notes: 'Line 1\nLine 2\nLine 3',
        })

        const lines = displayService.formatTaskDetails(task)

        expect(lines.join('\n')).to.include('Line 1\nLine 2\nLine 3')
      })
    })
  })

  describe('formatTaskSummary', () => {
    it('should format completed high priority feature', () => {
      const task = createFeatureTask({
        id: 'F-001',
        priority: PRIORITY.High,
        status: STATUS.Completed,
        title: 'User Authentication',
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[0]).to.include('✓ [H] [F-001]')
      expect(lines[0]).to.include('User Authentication')
    })

    it('should format in-progress medium priority bug', () => {
      const task = createBugTask({
        id: 'B-042',
        priority: PRIORITY.Medium,
        status: STATUS.InProgress,
        title: 'Login Issue',
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[0]).to.include('~ [M] [B-042]')
      expect(lines[0]).to.include('Login Issue')
    })

    it('should format not-started low priority task', () => {
      const task = createTask({
        id: 'I-003',
        priority: PRIORITY.Low,
        status: STATUS.NotStarted,
        title: 'Performance Optimization',
        type: TASK_TYPE.Improvement,
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[0]).to.equal('○ [L] [I-003] Performance Optimization')
    })

    it('should include type, tests, and deps count on second line', () => {
      const task = createFeatureTask({
        'depends-on': ['F-001' as never, 'F-002' as never],
        'passes-tests': true,
        type: TASK_TYPE.Feature,
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[1]).to.include('Type: feature')
      expect(lines[1]).to.include('Tests: ✓')
      expect(lines[1]).to.include('Deps: 2')
    })

    it('should show failing tests symbol', () => {
      const task = createFeatureTask({'passes-tests': false})

      const lines = displayService.formatTaskSummary(task)

      expect(lines[1]).to.include('Tests: ✗')
    })

    it('should show zero dependencies', () => {
      const task = createFeatureTask({'depends-on': []})

      const lines = displayService.formatTaskSummary(task)

      expect(lines[1]).to.include('Deps: 0')
    })

    it('should show third line with dependency list when dependencies exist', () => {
      const task = createFeatureTask({
        'depends-on': ['F-001' as never, 'F-002' as never, 'F-003' as never],
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[2]).to.equal('   Depends on: F-001, F-002, F-003')
    })

    it('should not show third line when no dependencies', () => {
      const task = createFeatureTask({'depends-on': []})

      const lines = displayService.formatTaskSummary(task)

      // Lines should be: [title line, info line, blank line]
      expect(lines).to.have.lengthOf(3)
      expect(lines[2]).to.equal('')
    })

    it('should end with blank line', () => {
      const task = createFeatureTask()

      const lines = displayService.formatTaskSummary(task)

      expect(lines.at(-1)).to.equal('')
    })

    it('should format task with single dependency', () => {
      const task = createFeatureTask({
        'depends-on': ['F-999' as never],
      })

      const lines = displayService.formatTaskSummary(task)

      expect(lines[1]).to.include('Deps: 1')
      expect(lines[2]).to.equal('   Depends on: F-999')
    })

    it('should properly indent all lines', () => {
      const task = createFeatureTask({
        'depends-on': ['F-001' as never],
      })

      const lines = displayService.formatTaskSummary(task)

      // Second line should have 3 space indent
      expect(lines[1]).to.match(/^ {3}Type:/)
      // Third line (deps) should have 3 space indent
      expect(lines[2]).to.match(/^ {3}Depends on:/)
    })

    it('should handle all task types correctly', () => {
      const bugTask = createTask({type: TASK_TYPE.Bug})
      const featureTask = createTask({type: TASK_TYPE.Feature})
      const improvementTask = createTask({type: TASK_TYPE.Improvement})

      expect(displayService.formatTaskSummary(bugTask)[1]).to.include('Type: bug')
      expect(displayService.formatTaskSummary(featureTask)[1]).to.include('Type: feature')
      expect(displayService.formatTaskSummary(improvementTask)[1]).to.include('Type: improvement')
    })
  })

  describe('formatTaskList', () => {
    it('should format empty task list', () => {
      const lines = displayService.formatTaskList([])

      expect(lines[0]).to.equal('')
      expect(lines[1]).to.equal('Tasks (0 total):')
      expect(lines[2]).to.equal('')
    })

    it('should format single task', () => {
      const task = createFeatureTask({id: 'F-001', title: 'Test'})
      const lines = displayService.formatTaskList([task])

      expect(lines.join('\n')).to.include('Tasks (1 total):')
      expect(lines.join('\n')).to.include('[F-001]')
    })

    it('should format multiple tasks', () => {
      const tasks = [createFeatureTask({id: 'F-001'}), createBugTask({id: 'B-001'}), createFeatureTask({id: 'F-002'})]

      const lines = displayService.formatTaskList(tasks)

      expect(lines.join('\n')).to.include('Tasks (3 total):')
      expect(lines.join('\n')).to.include('[F-001]')
      expect(lines.join('\n')).to.include('[B-001]')
      expect(lines.join('\n')).to.include('[F-002]')
    })

    it('should include header with task count', () => {
      const tasks = [createFeatureTask(), createBugTask()]
      const lines = displayService.formatTaskList(tasks)

      expect(lines).to.satisfy((arr: string[]) => arr.some((line) => line.includes('Tasks (2 total):')))
    })

    it('should start with blank line', () => {
      const lines = displayService.formatTaskList([])

      expect(lines[0]).to.equal('')
    })

    it('should include all task summaries', () => {
      const task1 = createFeatureTask({id: 'F-001', title: 'First'})
      const task2 = createBugTask({id: 'B-001', title: 'Second'})

      const lines = displayService.formatTaskList([task1, task2])

      expect(lines.join('\n')).to.include('First')
      expect(lines.join('\n')).to.include('Second')
    })

    it('should handle default format option', () => {
      const tasks = [createFeatureTask()]
      const lines = displayService.formatTaskList(tasks, {format: 'default'})

      expect(lines).to.be.an('array')
      expect(lines.join('\n')).to.include('Tasks (1 total):')
    })

    it('should use default format when no options provided', () => {
      const tasks = [createFeatureTask()]
      const lines = displayService.formatTaskList(tasks)

      expect(lines).to.be.an('array')
      expect(lines.join('\n')).to.include('Tasks (1 total):')
    })

    it('should maintain task order', () => {
      const task1 = createFeatureTask({id: 'F-001', title: 'First Task'})
      const task2 = createFeatureTask({id: 'F-002', title: 'Second Task'})
      const task3 = createFeatureTask({id: 'F-003', title: 'Third Task'})

      const lines = displayService.formatTaskList([task1, task2, task3])
      const fullText = lines.join('\n')

      const firstIndex = fullText.indexOf('First Task')
      const secondIndex = fullText.indexOf('Second Task')
      const thirdIndex = fullText.indexOf('Third Task')

      expect(firstIndex).to.be.lessThan(secondIndex)
      expect(secondIndex).to.be.lessThan(thirdIndex)
    })

    it('should handle large task lists', () => {
      const tasks: Task[] = []
      for (let i = 0; i < 50; i++) {
        tasks.push(createFeatureTask({title: `Task ${i}`}))
      }

      const lines = displayService.formatTaskList(tasks)

      expect(lines.join('\n')).to.include('Tasks (50 total):')
    })
  })

  describe('formatRoadmapStats', () => {
    it('should format stats from empty roadmap', () => {
      const stats: RoadmapStats = {
        byPriority: {
          [PRIORITY.High]: 0,
          [PRIORITY.Low]: 0,
          [PRIORITY.Medium]: 0,
        },
        byStatus: {
          [STATUS.Completed]: 0,
          [STATUS.InProgress]: 0,
          [STATUS.NotStarted]: 0,
        },
        byType: {
          bug: 0,
          feature: 0,
          improvement: 0,
          planning: 0,
          research: 0,
        },
        totalTasks: 0,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines.join('\n')).to.include('Total Tasks: 0')
      expect(lines.join('\n')).to.include('Completed: 0')
      expect(lines.join('\n')).to.include('Features: 0')
      expect(lines.join('\n')).to.include('High: 0')
    })

    it('should include main header', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 0,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines[0]).to.equal('Roadmap Statistics:')
    })

    it('should include total tasks count', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 1, [PRIORITY.Low]: 1, [PRIORITY.Medium]: 1},
        byStatus: {[STATUS.Completed]: 1, [STATUS.InProgress]: 1, [STATUS.NotStarted]: 1},
        byType: {bug: 0, feature: 1, improvement: 1, planning: 1, research: 0},
        totalTasks: 3,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.satisfy((arr: string[]) => arr.includes('Total Tasks: 3'))
    })

    it('should include "By Status" section', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 5, [STATUS.InProgress]: 3, [STATUS.NotStarted]: 2},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 10,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.include('By Status:')
      expect(lines).to.include('  Completed: 5')
      expect(lines).to.include('  In Progress: 3')
      expect(lines).to.include('  Not Started: 2')
    })

    it('should include "By Type" section', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 3, feature: 5, improvement: 2, planning: 1, research: 0},
        totalTasks: 11,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.include('By Type:')
      expect(lines).to.include('  Features: 5')
      expect(lines).to.include('  Bugs: 3')
      expect(lines).to.include('  Improvements: 2')
      expect(lines).to.include('  Planning: 1')
      expect(lines).to.include('  Research: 0')
    })

    it('should include "By Priority" section', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 7, [PRIORITY.Low]: 2, [PRIORITY.Medium]: 4},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 13,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.include('By Priority:')
      expect(lines).to.include('  High: 7')
      expect(lines).to.include('  Medium: 4')
      expect(lines).to.include('  Low: 2')
    })

    it('should include blank lines between sections', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 0,
      }

      const lines = displayService.formatRoadmapStats(stats)

      // Check for blank lines between sections
      const headerIndex = lines.indexOf('Roadmap Statistics:')
      const totalIndex = lines.indexOf('Total Tasks: 0')
      const statusIndex = lines.indexOf('By Status:')
      const typeIndex = lines.indexOf('By Type:')
      const priorityIndex = lines.indexOf('By Priority:')

      expect(lines[headerIndex + 1]).to.equal('')
      expect(lines[totalIndex + 1]).to.equal('')
      expect(lines[statusIndex - 1]).to.equal('')
      expect(lines[typeIndex - 1]).to.equal('')
      expect(lines[priorityIndex - 1]).to.equal('')
    })

    it('should properly indent sub-items', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 1, [PRIORITY.Low]: 1, [PRIORITY.Medium]: 1},
        byStatus: {[STATUS.Completed]: 1, [STATUS.InProgress]: 1, [STATUS.NotStarted]: 1},
        byType: {bug: 1, feature: 1, improvement: 1, planning: 1, research: 1},
        totalTasks: 3,
      }

      const lines = displayService.formatRoadmapStats(stats)

      // All sub-items should start with 2 spaces
      expect(lines.join('\n')).to.match(/ {2}Completed: \d+/)
      expect(lines.join('\n')).to.match(/ {2}Features: \d+/)
      expect(lines.join('\n')).to.match(/ {2}High: \d+/)
    })

    it('should format stats from simple roadmap', () => {
      const roadmap = createSimpleRoadmap()
      const stats: RoadmapStats = {
        byPriority: {
          [PRIORITY.High]: roadmap.tasks.filter((t) => t.priority === PRIORITY.High).length,
          [PRIORITY.Low]: roadmap.tasks.filter((t) => t.priority === PRIORITY.Low).length,
          [PRIORITY.Medium]: roadmap.tasks.filter((t) => t.priority === PRIORITY.Medium).length,
        },
        byStatus: {
          [STATUS.Completed]: roadmap.tasks.filter((t) => t.status === STATUS.Completed).length,
          [STATUS.InProgress]: roadmap.tasks.filter((t) => t.status === STATUS.InProgress).length,
          [STATUS.NotStarted]: roadmap.tasks.filter((t) => t.status === STATUS.NotStarted).length,
        },
        byType: {
          bug: roadmap.tasks.filter((t) => t.type === TASK_TYPE.Bug).length,
          feature: roadmap.tasks.filter((t) => t.type === TASK_TYPE.Feature).length,
          improvement: roadmap.tasks.filter((t) => t.type === TASK_TYPE.Improvement).length,
          planning: roadmap.tasks.filter((t) => t.type === TASK_TYPE.Planning).length,
          research: roadmap.tasks.filter((t) => t.type === TASK_TYPE.Research).length,
        },
        totalTasks: roadmap.tasks.length,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.be.an('array')
      expect(lines.join('\n')).to.include('Roadmap Statistics:')
      expect(lines.join('\n')).to.include(`Total Tasks: ${roadmap.tasks.length}`)
    })

    it('should handle all zero counts', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 0,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines.join('\n')).to.include('Total Tasks: 0')
      expect(lines.join('\n')).to.include('Completed: 0')
      expect(lines.join('\n')).to.include('Bugs: 0')
      expect(lines.join('\n')).to.include('High: 0')
    })

    it('should handle large counts', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 999, [PRIORITY.Low]: 999, [PRIORITY.Medium]: 999},
        byStatus: {[STATUS.Completed]: 999, [STATUS.InProgress]: 999, [STATUS.NotStarted]: 999},
        byType: {bug: 999, feature: 999, improvement: 999, planning: 999, research: 999},
        totalTasks: 2997,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines.join('\n')).to.include('Total Tasks: 2997')
      expect(lines.join('\n')).to.include('High: 999')
    })

    it('should return array of strings', () => {
      const stats: RoadmapStats = {
        byPriority: {[PRIORITY.High]: 0, [PRIORITY.Low]: 0, [PRIORITY.Medium]: 0},
        byStatus: {[STATUS.Completed]: 0, [STATUS.InProgress]: 0, [STATUS.NotStarted]: 0},
        byType: {bug: 0, feature: 0, improvement: 0, planning: 0, research: 0},
        totalTasks: 0,
      }

      const lines = displayService.formatRoadmapStats(stats)

      expect(lines).to.be.an('array')
      expect(lines.every((line) => typeof line === 'string')).to.be.true
    })
  })

  describe('formatValidationErrors', () => {
    it('should format empty error list', () => {
      const errors: DependencyValidationError[] = []

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('Found 0 dependency errors:')
    })

    it('should use singular "error" for single error', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Task F-001 depends on non-existent task F-999',
          relatedTaskIds: ['F-001', 'F-999'],
          taskId: 'F-001',
          type: 'invalid-reference',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('Found 1 dependency error:')
    })

    it('should use plural "errors" for multiple errors', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Task F-001 depends on non-existent task F-999',
          relatedTaskIds: ['F-001', 'F-999'],
          taskId: 'F-001',
          type: 'invalid-reference',
        },
        {
          message: 'Task F-002 blocks non-existent task F-888',
          relatedTaskIds: ['F-002', 'F-888'],
          taskId: 'F-002',
          type: 'invalid-reference',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('Found 2 dependency errors:')
    })

    it('should format circular dependency error with symbol', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          relatedTaskIds: ['F-001', 'F-002', 'F-001'],
          taskId: 'F-001',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('❌ CIRCULAR DEPENDENCY DETECTED')
      expect(lines.join('\n')).to.include('Circular dependency detected')
    })

    it('should include cycle path for circular dependency', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          relatedTaskIds: ['F-001', 'F-002', 'F-003', 'F-001'],
          taskId: 'F-001',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('Cycle path: F-001 -> F-002 -> F-003 -> F-001')
    })

    it('should handle circular error without relatedTaskIds', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          taskId: 'F-001',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('❌ CIRCULAR DEPENDENCY DETECTED')
      expect(lines.join('\n')).to.not.include('Cycle path:')
    })

    it('should format invalid-reference error with warning symbol', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Task F-001 depends on non-existent task F-999',
          relatedTaskIds: ['F-001', 'F-999'],
          taskId: 'F-001',
          type: 'invalid-reference',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('⚠️  Task F-001 depends on non-existent task F-999')
    })

    it('should format missing-task error with X symbol', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Task F-999 is referenced but does not exist',
          relatedTaskIds: ['F-999'],
          taskId: 'F-999',
          type: 'missing-task',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('❌ Task F-999 is referenced but does not exist')
    })

    it('should format multiple errors of different types', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          relatedTaskIds: ['F-001', 'F-002', 'F-001'],
          taskId: 'F-001',
          type: 'circular',
        },
        {
          message: 'Task F-003 depends on non-existent task F-999',
          relatedTaskIds: ['F-003', 'F-999'],
          taskId: 'F-003',
          type: 'invalid-reference',
        },
        {
          message: 'Task F-888 is referenced but does not exist',
          relatedTaskIds: ['F-888'],
          taskId: 'F-888',
          type: 'missing-task',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('Found 3 dependency errors:')
      expect(lines.join('\n')).to.include('❌ CIRCULAR DEPENDENCY DETECTED')
      expect(lines.join('\n')).to.include('⚠️  Task F-003 depends on non-existent task F-999')
      expect(lines.join('\n')).to.include('❌ Task F-888 is referenced but does not exist')
    })

    it('should include blank line after circular error', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          relatedTaskIds: ['F-001', 'F-002', 'F-001'],
          taskId: 'F-001',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      const circularIndex = lines.findIndex((line) => line.includes('CIRCULAR DEPENDENCY'))
      const messageIndex = circularIndex + 1
      const cyclePathIndex = messageIndex + 1
      const blankLineIndex = cyclePathIndex + 1

      expect(lines[blankLineIndex]).to.equal('')
    })

    it('should start with newline character', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Error message',
          taskId: 'F-001',
          type: 'invalid-reference',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines[0]).to.match(/^\n/)
    })

    it('should maintain error order', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'First error',
          taskId: 'F-001',
          type: 'invalid-reference',
        },
        {
          message: 'Second error',
          taskId: 'F-002',
          type: 'missing-task',
        },
        {
          message: 'Third error',
          taskId: 'F-003',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)
      const fullText = lines.join('\n')

      const firstIndex = fullText.indexOf('First error')
      const secondIndex = fullText.indexOf('Second error')
      const thirdIndex = fullText.indexOf('Third error')

      expect(firstIndex).to.be.lessThan(secondIndex)
      expect(secondIndex).to.be.lessThan(thirdIndex)
    })

    it('should handle empty relatedTaskIds array for circular error', () => {
      const errors: DependencyValidationError[] = [
        {
          message: 'Circular dependency detected',
          relatedTaskIds: [],
          taskId: 'F-001',
          type: 'circular',
        },
      ]

      const lines = displayService.formatValidationErrors(errors)

      expect(lines.join('\n')).to.include('❌ CIRCULAR DEPENDENCY DETECTED')
      expect(lines.join('\n')).to.not.include('Cycle path:')
    })
  })
})
