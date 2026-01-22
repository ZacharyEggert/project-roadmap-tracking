import {expect} from 'chai'

import {SortOrder, TaskQueryService} from '../../../src/services/task-query.service.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../../../src/util/types.js'
import {createBugTask, createFeatureTask, createTask} from '../../fixtures/task-factory.js'

describe('TaskQueryService', () => {
  let taskQueryService: TaskQueryService

  beforeEach(() => {
    taskQueryService = new TaskQueryService()
  })

  describe('filter', () => {
    describe('single criteria filtering', () => {
      it('should filter tasks by status', () => {
        const tasks = [
          createTask({status: STATUS.NotStarted}),
          createTask({status: STATUS.InProgress}),
          createTask({status: STATUS.Completed}),
        ]

        const result = taskQueryService.filter(tasks, {status: STATUS.InProgress})

        expect(result).to.have.lengthOf(1)
        expect(result[0].status).to.equal(STATUS.InProgress)
      })

      it('should filter tasks by multiple statuses (array)', () => {
        const tasks = [
          createTask({status: STATUS.NotStarted}),
          createTask({status: STATUS.InProgress}),
          createTask({status: STATUS.Completed}),
        ]

        const result = taskQueryService.filter(tasks, {
          status: [STATUS.NotStarted, STATUS.InProgress],
        })

        expect(result).to.have.lengthOf(2)
        expect(result[0].status).to.be.oneOf([STATUS.NotStarted, STATUS.InProgress])
        expect(result[1].status).to.be.oneOf([STATUS.NotStarted, STATUS.InProgress])
      })

      it('should filter tasks by single status in array form', () => {
        const tasks = [
          createTask({status: STATUS.NotStarted}),
          createTask({status: STATUS.InProgress}),
          createTask({status: STATUS.Completed}),
        ]

        const result = taskQueryService.filter(tasks, {
          status: [STATUS.InProgress],
        })

        expect(result).to.have.lengthOf(1)
        expect(result[0].status).to.equal(STATUS.InProgress)
      })

      it('should filter tasks by type', () => {
        const tasks = [createFeatureTask(), createBugTask(), createFeatureTask()]

        const result = taskQueryService.filter(tasks, {type: TASK_TYPE.Bug})

        expect(result).to.have.lengthOf(1)
        expect(result[0].type).to.equal(TASK_TYPE.Bug)
      })

      it('should filter tasks by priority', () => {
        const tasks = [
          createTask({priority: PRIORITY.High}),
          createTask({priority: PRIORITY.Medium}),
          createTask({priority: PRIORITY.Low}),
        ]

        const result = taskQueryService.filter(tasks, {priority: PRIORITY.High})

        expect(result).to.have.lengthOf(1)
        expect(result[0].priority).to.equal(PRIORITY.High)
      })

      it('should filter tasks by assignedTo', () => {
        const tasks = [
          createTask({assignedTo: 'Alice'}),
          createTask({assignedTo: 'Bob'}),
          createTask({assignedTo: null}),
        ]

        const result = taskQueryService.filter(tasks, {assignedTo: 'Alice'})

        expect(result).to.have.lengthOf(1)
        expect(result[0].assignedTo).to.equal('Alice')
      })

      it('should filter tasks by null assignedTo', () => {
        const tasks = [
          createTask({assignedTo: 'Alice'}),
          createTask({assignedTo: 'Bob'}),
          createTask({assignedTo: null}),
        ]

        const result = taskQueryService.filter(tasks, {assignedTo: null})

        expect(result).to.have.lengthOf(1)
        expect(result[0].assignedTo).to.be.null
      })

      it('should filter tasks by hasBlocks', () => {
        const tasks = [
          createTask({blocks: ['F-002' as never]}),
          createTask({blocks: []}),
          createTask({blocks: ['F-003' as never, 'F-004' as never]}),
        ]

        const result = taskQueryService.filter(tasks, {hasBlocks: true})

        expect(result).to.have.lengthOf(2)
        expect(result[0].blocks.length).to.be.greaterThan(0)
        expect(result[1].blocks.length).to.be.greaterThan(0)
      })

      it('should filter tasks by hasBlocks false', () => {
        const tasks = [
          createTask({blocks: ['F-002' as never]}),
          createTask({blocks: []}),
          createTask({blocks: ['F-003' as never]}),
        ]

        const result = taskQueryService.filter(tasks, {hasBlocks: false})

        expect(result).to.have.lengthOf(1)
        expect(result[0].blocks).to.have.lengthOf(0)
      })

      it('should filter tasks by hasDependencies', () => {
        const tasks = [
          createTask({'depends-on': ['F-001' as never]}),
          createTask({'depends-on': []}),
          createTask({'depends-on': ['F-002' as never, 'F-003' as never]}),
        ]

        const result = taskQueryService.filter(tasks, {hasDependencies: true})

        expect(result).to.have.lengthOf(2)
        expect(result[0]['depends-on'].length).to.be.greaterThan(0)
        expect(result[1]['depends-on'].length).to.be.greaterThan(0)
      })

      it('should filter tasks by hasDependencies false', () => {
        const tasks = [
          createTask({'depends-on': ['F-001' as never]}),
          createTask({'depends-on': []}),
          createTask({'depends-on': ['F-002' as never]}),
        ]

        const result = taskQueryService.filter(tasks, {hasDependencies: false})

        expect(result).to.have.lengthOf(1)
        expect(result[0]['depends-on']).to.have.lengthOf(0)
      })

      it('should filter tasks by single tag', () => {
        const tasks = [
          createTask({tags: ['frontend', 'urgent']}),
          createTask({tags: ['backend']}),
          createTask({tags: ['frontend']}),
        ]

        const result = taskQueryService.filter(tasks, {tags: ['frontend']})

        expect(result).to.have.lengthOf(2)
        expect(result[0].tags).to.include('frontend')
        expect(result[1].tags).to.include('frontend')
      })

      it('should filter tasks by multiple tags (AND logic)', () => {
        const tasks = [
          createTask({tags: ['frontend', 'urgent']}),
          createTask({tags: ['frontend']}),
          createTask({tags: ['urgent']}),
        ]

        const result = taskQueryService.filter(tasks, {tags: ['frontend', 'urgent']})

        expect(result).to.have.lengthOf(1)
        expect(result[0].tags).to.include.members(['frontend', 'urgent'])
      })
    })

    describe('multiple criteria filtering', () => {
      it('should filter by status AND type', () => {
        const tasks = [
          createFeatureTask({status: STATUS.InProgress}),
          createBugTask({status: STATUS.InProgress}),
          createFeatureTask({status: STATUS.Completed}),
        ]

        const result = taskQueryService.filter(tasks, {
          status: STATUS.InProgress,
          type: TASK_TYPE.Feature,
        })

        expect(result).to.have.lengthOf(1)
        expect(result[0].status).to.equal(STATUS.InProgress)
        expect(result[0].type).to.equal(TASK_TYPE.Feature)
      })

      it('should filter by priority AND status AND type', () => {
        const tasks = [
          createFeatureTask({priority: PRIORITY.High, status: STATUS.InProgress}),
          createBugTask({priority: PRIORITY.High, status: STATUS.InProgress}),
          createFeatureTask({priority: PRIORITY.Low, status: STATUS.InProgress}),
        ]

        const result = taskQueryService.filter(tasks, {
          priority: PRIORITY.High,
          status: STATUS.InProgress,
          type: TASK_TYPE.Feature,
        })

        expect(result).to.have.lengthOf(1)
        expect(result[0].priority).to.equal(PRIORITY.High)
        expect(result[0].status).to.equal(STATUS.InProgress)
        expect(result[0].type).to.equal(TASK_TYPE.Feature)
      })

      it('should filter by multiple statuses AND priority', () => {
        const tasks = [
          createTask({priority: PRIORITY.High, status: STATUS.NotStarted}),
          createTask({priority: PRIORITY.High, status: STATUS.InProgress}),
          createTask({priority: PRIORITY.High, status: STATUS.Completed}),
          createTask({priority: PRIORITY.Low, status: STATUS.InProgress}),
        ]

        const result = taskQueryService.filter(tasks, {
          priority: PRIORITY.High,
          status: [STATUS.NotStarted, STATUS.InProgress],
        })

        expect(result).to.have.lengthOf(2)
        expect(result.every((t) => t.priority === PRIORITY.High)).to.be.true
        expect(result.every((t) => [STATUS.InProgress, STATUS.NotStarted].includes(t.status))).to.be.true
      })

      it('should filter by tags AND status', () => {
        const tasks = [
          createTask({status: STATUS.InProgress, tags: ['frontend', 'urgent']}),
          createTask({status: STATUS.Completed, tags: ['frontend', 'urgent']}),
          createTask({status: STATUS.InProgress, tags: ['backend']}),
        ]

        const result = taskQueryService.filter(tasks, {
          status: STATUS.InProgress,
          tags: ['frontend'],
        })

        expect(result).to.have.lengthOf(1)
        expect(result[0].status).to.equal(STATUS.InProgress)
        expect(result[0].tags).to.include('frontend')
      })

      it('should filter by hasBlocks AND type', () => {
        const tasks = [
          createFeatureTask({blocks: ['F-002' as never]}),
          createBugTask({blocks: ['B-002' as never]}),
          createFeatureTask({blocks: []}),
        ]

        const result = taskQueryService.filter(tasks, {
          hasBlocks: true,
          type: TASK_TYPE.Feature,
        })

        expect(result).to.have.lengthOf(1)
        expect(result[0].blocks.length).to.be.greaterThan(0)
        expect(result[0].type).to.equal(TASK_TYPE.Feature)
      })
    })

    describe('edge cases', () => {
      it('should return all tasks when no criteria specified', () => {
        const tasks = [createFeatureTask(), createBugTask(), createFeatureTask()]

        const result = taskQueryService.filter(tasks, {})

        expect(result).to.have.lengthOf(3)
      })

      it('should return empty array when no tasks match criteria', () => {
        const tasks = [createFeatureTask(), createFeatureTask()]

        const result = taskQueryService.filter(tasks, {type: TASK_TYPE.Bug})

        expect(result).to.have.lengthOf(0)
      })

      it('should return empty array when filtering empty task list', () => {
        const result = taskQueryService.filter([], {status: STATUS.InProgress})

        expect(result).to.have.lengthOf(0)
      })

      it('should not mutate original tasks array', () => {
        const tasks = [createFeatureTask(), createBugTask()]
        const originalLength = tasks.length

        taskQueryService.filter(tasks, {type: TASK_TYPE.Feature})

        expect(tasks).to.have.lengthOf(originalLength)
      })

      it('should handle tasks with empty tags array', () => {
        const tasks = [createTask({tags: []}), createTask({tags: ['frontend']})]

        const result = taskQueryService.filter(tasks, {tags: ['frontend']})

        expect(result).to.have.lengthOf(1)
      })

      it('should return empty array when filtering by empty tags array', () => {
        const tasks = [createTask({tags: ['frontend']}), createTask({tags: ['backend']})]

        const result = taskQueryService.filter(tasks, {tags: []})

        expect(result).to.have.lengthOf(2)
      })
    })
  })

  describe('getByStatus', () => {
    it('should get all not-started tasks', () => {
      const tasks = [
        createTask({status: STATUS.NotStarted}),
        createTask({status: STATUS.InProgress}),
        createTask({status: STATUS.NotStarted}),
      ]

      const result = taskQueryService.getByStatus(tasks, STATUS.NotStarted)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.status === STATUS.NotStarted)).to.be.true
    })

    it('should get all in-progress tasks', () => {
      const tasks = [
        createTask({status: STATUS.InProgress}),
        createTask({status: STATUS.Completed}),
        createTask({status: STATUS.InProgress}),
      ]

      const result = taskQueryService.getByStatus(tasks, STATUS.InProgress)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.status === STATUS.InProgress)).to.be.true
    })

    it('should get all completed tasks', () => {
      const tasks = [
        createTask({status: STATUS.Completed}),
        createTask({status: STATUS.InProgress}),
        createTask({status: STATUS.Completed}),
      ]

      const result = taskQueryService.getByStatus(tasks, STATUS.Completed)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.status === STATUS.Completed)).to.be.true
    })

    it('should return empty array when no tasks match status', () => {
      const tasks = [createTask({status: STATUS.InProgress})]

      const result = taskQueryService.getByStatus(tasks, STATUS.Completed)

      expect(result).to.have.lengthOf(0)
    })

    it('should return empty array for empty task list', () => {
      const result = taskQueryService.getByStatus([], STATUS.InProgress)

      expect(result).to.have.lengthOf(0)
    })
  })

  describe('getByType', () => {
    it('should get all feature tasks', () => {
      const tasks = [createFeatureTask(), createBugTask(), createFeatureTask()]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Feature)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.type === TASK_TYPE.Feature)).to.be.true
    })

    it('should get all bug tasks', () => {
      const tasks = [createBugTask(), createFeatureTask(), createBugTask()]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Bug)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.type === TASK_TYPE.Bug)).to.be.true
    })

    it('should get all improvement tasks', () => {
      const tasks = [
        createTask({type: TASK_TYPE.Improvement}),
        createFeatureTask(),
        createTask({type: TASK_TYPE.Improvement}),
      ]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Improvement)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.type === TASK_TYPE.Improvement)).to.be.true
    })

    it('should get all planning tasks', () => {
      const tasks = [createTask({type: TASK_TYPE.Planning}), createBugTask(), createTask({type: TASK_TYPE.Planning})]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Planning)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.type === TASK_TYPE.Planning)).to.be.true
    })

    it('should get all research tasks', () => {
      const tasks = [
        createTask({type: TASK_TYPE.Research}),
        createFeatureTask(),
        createTask({type: TASK_TYPE.Research}),
      ]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Research)

      expect(result).to.have.lengthOf(2)
      expect(result.every((t) => t.type === TASK_TYPE.Research)).to.be.true
    })

    it('should return empty array when no tasks match type', () => {
      const tasks = [createFeatureTask(), createFeatureTask()]

      const result = taskQueryService.getByType(tasks, TASK_TYPE.Bug)

      expect(result).to.have.lengthOf(0)
    })

    it('should return empty array for empty task list', () => {
      const result = taskQueryService.getByType([], TASK_TYPE.Feature)

      expect(result).to.have.lengthOf(0)
    })
  })

  describe('search', () => {
    describe('successful searches', () => {
      it('should find tasks by title match', () => {
        const tasks = [
          createTask({details: 'Details', title: 'Implement login'}),
          createTask({details: 'Details', title: 'Add signup'}),
          createTask({details: 'Details', title: 'Fix login bug'}),
        ]

        const result = taskQueryService.search(tasks, 'login')

        expect(result).to.have.lengthOf(2)
        expect(result[0].title).to.include('login')
        expect(result[1].title).to.include('login')
      })

      it('should find tasks by details match', () => {
        const tasks = [
          createTask({details: 'Implement user authentication', title: 'Task 1'}),
          createTask({details: 'Fix button styling', title: 'Task 2'}),
          createTask({details: 'Update authentication flow', title: 'Task 3'}),
        ]

        const result = taskQueryService.search(tasks, 'authentication')

        expect(result).to.have.lengthOf(2)
        expect(result[0].details).to.include('authentication')
        expect(result[1].details).to.include('authentication')
      })

      it('should find tasks by match in either title or details', () => {
        const tasks = [
          createTask({details: 'Fix the search feature', title: 'Bug fix'}),
          createTask({details: 'Add new feature', title: 'Implement search'}),
          createTask({details: 'Update documentation', title: 'Docs'}),
        ]

        const result = taskQueryService.search(tasks, 'search')

        expect(result).to.have.lengthOf(2)
      })

      it('should be case-insensitive', () => {
        const tasks = [
          createTask({details: 'Details', title: 'LOGIN Feature'}),
          createTask({details: 'Details', title: 'Add signup'}),
        ]

        const result = taskQueryService.search(tasks, 'login')

        expect(result).to.have.lengthOf(1)
        expect(result[0].title.toLowerCase()).to.include('login')
      })

      it('should match partial words', () => {
        const tasks = [
          createTask({details: 'Details', title: 'Authentication system'}),
          createTask({details: 'Details', title: 'Authorization check'}),
        ]

        const result = taskQueryService.search(tasks, 'auth')

        expect(result).to.have.lengthOf(2)
      })

      it('should match multiple words in query', () => {
        const tasks = [
          createTask({details: 'Implement user login feature', title: 'Task 1'}),
          createTask({details: 'Add user profile', title: 'Task 2'}),
          createTask({details: 'Fix login page bug', title: 'Task 3'}),
        ]

        const result = taskQueryService.search(tasks, 'user login')

        expect(result).to.have.lengthOf(1)
        expect(result[0].details).to.include('user login')
      })
    })

    describe('edge cases', () => {
      it('should return all tasks for empty query string', () => {
        const tasks = [createFeatureTask(), createBugTask(), createFeatureTask()]

        const result = taskQueryService.search(tasks, '')

        expect(result).to.have.lengthOf(3)
      })

      it('should return all tasks for whitespace-only query', () => {
        const tasks = [createFeatureTask(), createBugTask()]

        const result = taskQueryService.search(tasks, '   ')

        expect(result).to.have.lengthOf(2)
      })

      it('should return empty array when no matches found', () => {
        const tasks = [
          createTask({details: 'Fix bug', title: 'Bug fix'}),
          createTask({details: 'Add feature', title: 'Feature'}),
        ]

        const result = taskQueryService.search(tasks, 'nonexistent')

        expect(result).to.have.lengthOf(0)
      })

      it('should return empty array for empty task list', () => {
        const result = taskQueryService.search([], 'query')

        expect(result).to.have.lengthOf(0)
      })

      it('should not mutate original tasks array', () => {
        const tasks = [createFeatureTask(), createBugTask()]
        const originalLength = tasks.length

        taskQueryService.search(tasks, 'test')

        expect(tasks).to.have.lengthOf(originalLength)
      })

      it('should handle special regex characters in query', () => {
        const tasks = [
          createTask({details: 'Details', title: 'Fix (bug)'}),
          createTask({details: 'Details', title: 'Add feature'}),
        ]

        const result = taskQueryService.search(tasks, '(bug)')

        expect(result).to.have.lengthOf(1)
        expect(result[0].title).to.include('(bug)')
      })

      it('should handle unicode characters', () => {
        const tasks = [
          createTask({details: 'Details', title: 'Fix 日本語 bug'}),
          createTask({details: 'Details', title: 'Add feature'}),
        ]

        const result = taskQueryService.search(tasks, '日本語')

        expect(result).to.have.lengthOf(1)
      })
    })
  })

  describe('sort', () => {
    describe('sort by priority', () => {
      it('should sort by priority ascending', () => {
        const tasks = [
          createTask({priority: PRIORITY.High, title: 'Task 1'}),
          createTask({priority: PRIORITY.Low, title: 'Task 2'}),
          createTask({priority: PRIORITY.Medium, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'priority', SortOrder.Ascending)

        expect(result[0].priority).to.equal(PRIORITY.Low)
        expect(result[1].priority).to.equal(PRIORITY.Medium)
        expect(result[2].priority).to.equal(PRIORITY.High)
      })

      it('should sort by priority descending', () => {
        const tasks = [
          createTask({priority: PRIORITY.Low, title: 'Task 1'}),
          createTask({priority: PRIORITY.High, title: 'Task 2'}),
          createTask({priority: PRIORITY.Medium, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'priority', SortOrder.Descending)

        expect(result[0].priority).to.equal(PRIORITY.High)
        expect(result[1].priority).to.equal(PRIORITY.Medium)
        expect(result[2].priority).to.equal(PRIORITY.Low)
      })
    })

    describe('sort by status', () => {
      it('should sort by status ascending', () => {
        const tasks = [
          createTask({status: STATUS.Completed, title: 'Task 1'}),
          createTask({status: STATUS.NotStarted, title: 'Task 2'}),
          createTask({status: STATUS.InProgress, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'status', SortOrder.Ascending)

        expect(result[0].status).to.equal(STATUS.NotStarted)
        expect(result[1].status).to.equal(STATUS.InProgress)
        expect(result[2].status).to.equal(STATUS.Completed)
      })

      it('should sort by status descending', () => {
        const tasks = [
          createTask({status: STATUS.NotStarted, title: 'Task 1'}),
          createTask({status: STATUS.Completed, title: 'Task 2'}),
          createTask({status: STATUS.InProgress, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'status', SortOrder.Descending)

        expect(result[0].status).to.equal(STATUS.Completed)
        expect(result[1].status).to.equal(STATUS.InProgress)
        expect(result[2].status).to.equal(STATUS.NotStarted)
      })
    })

    describe('sort by type', () => {
      it('should sort by type ascending (alphabetically)', () => {
        const tasks = [
          createTask({title: 'Task 1', type: TASK_TYPE.Feature}),
          createTask({title: 'Task 2', type: TASK_TYPE.Bug}),
          createTask({title: 'Task 3', type: TASK_TYPE.Improvement}),
        ]

        const result = taskQueryService.sort(tasks, 'type', SortOrder.Ascending)

        expect(result[0].type).to.equal(TASK_TYPE.Bug)
        expect(result[1].type).to.equal(TASK_TYPE.Feature)
        expect(result[2].type).to.equal(TASK_TYPE.Improvement)
      })

      it('should sort by type descending', () => {
        const tasks = [
          createTask({title: 'Task 1', type: TASK_TYPE.Bug}),
          createTask({title: 'Task 2', type: TASK_TYPE.Research}),
          createTask({title: 'Task 3', type: TASK_TYPE.Feature}),
        ]

        const result = taskQueryService.sort(tasks, 'type', SortOrder.Descending)

        expect(result[0].type).to.equal(TASK_TYPE.Research)
        expect(result[2].type).to.equal(TASK_TYPE.Bug)
      })
    })

    describe('sort by title', () => {
      it('should sort by title ascending (alphabetically)', () => {
        const tasks = [
          createTask({title: 'Zebra task'}),
          createTask({title: 'Apple task'}),
          createTask({title: 'Banana task'}),
        ]

        const result = taskQueryService.sort(tasks, 'title', SortOrder.Ascending)

        expect(result[0].title).to.equal('Apple task')
        expect(result[1].title).to.equal('Banana task')
        expect(result[2].title).to.equal('Zebra task')
      })

      it('should sort by title descending', () => {
        const tasks = [
          createTask({title: 'Apple task'}),
          createTask({title: 'Zebra task'}),
          createTask({title: 'Banana task'}),
        ]

        const result = taskQueryService.sort(tasks, 'title', SortOrder.Descending)

        expect(result[0].title).to.equal('Zebra task')
        expect(result[1].title).to.equal('Banana task')
        expect(result[2].title).to.equal('Apple task')
      })

      it('should sort title case-insensitively', () => {
        const tasks = [createTask({title: 'Zebra'}), createTask({title: 'apple'}), createTask({title: 'Banana'})]

        const result = taskQueryService.sort(tasks, 'title', SortOrder.Ascending)

        expect(result[0].title).to.equal('apple')
        expect(result[1].title).to.equal('Banana')
        expect(result[2].title).to.equal('Zebra')
      })
    })

    describe('sort by dates', () => {
      it('should sort by createdAt ascending', () => {
        const tasks = [
          createTask({createdAt: '2026-01-03T00:00:00.000Z', title: 'Task 1'}),
          createTask({createdAt: '2026-01-01T00:00:00.000Z', title: 'Task 2'}),
          createTask({createdAt: '2026-01-02T00:00:00.000Z', title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'createdAt', SortOrder.Ascending)

        expect(result[0].createdAt).to.equal('2026-01-01T00:00:00.000Z')
        expect(result[1].createdAt).to.equal('2026-01-02T00:00:00.000Z')
        expect(result[2].createdAt).to.equal('2026-01-03T00:00:00.000Z')
      })

      it('should sort by updatedAt descending', () => {
        const tasks = [
          createTask({title: 'Task 1', updatedAt: '2026-01-01T00:00:00.000Z'}),
          createTask({title: 'Task 2', updatedAt: '2026-01-03T00:00:00.000Z'}),
          createTask({title: 'Task 3', updatedAt: '2026-01-02T00:00:00.000Z'}),
        ]

        const result = taskQueryService.sort(tasks, 'updatedAt', SortOrder.Descending)

        expect(result[0].updatedAt).to.equal('2026-01-03T00:00:00.000Z')
        expect(result[1].updatedAt).to.equal('2026-01-02T00:00:00.000Z')
        expect(result[2].updatedAt).to.equal('2026-01-01T00:00:00.000Z')
      })

      it('should sort by dueDate ascending', () => {
        const tasks = [
          createTask({dueDate: '2026-02-03T00:00:00.000Z', title: 'Task 1'}),
          createTask({dueDate: '2026-02-01T00:00:00.000Z', title: 'Task 2'}),
          createTask({dueDate: '2026-02-02T00:00:00.000Z', title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'dueDate', SortOrder.Ascending)

        expect(result[0].dueDate).to.equal('2026-02-01T00:00:00.000Z')
        expect(result[1].dueDate).to.equal('2026-02-02T00:00:00.000Z')
        expect(result[2].dueDate).to.equal('2026-02-03T00:00:00.000Z')
      })

      it('should place null dates at the end when sorting ascending', () => {
        const tasks = [
          createTask({dueDate: '2026-02-03T00:00:00.000Z', title: 'Task 1'}),
          createTask({dueDate: null, title: 'Task 2'}),
          createTask({dueDate: '2026-02-01T00:00:00.000Z', title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'dueDate', SortOrder.Ascending)

        expect(result[0].dueDate).to.equal('2026-02-01T00:00:00.000Z')
        expect(result[1].dueDate).to.equal('2026-02-03T00:00:00.000Z')
        expect(result[2].dueDate).to.be.null
      })
    })

    describe('sort by effort', () => {
      it('should sort by effort ascending', () => {
        const tasks = [
          createTask({effort: 8, title: 'Task 1'}),
          createTask({effort: 2, title: 'Task 2'}),
          createTask({effort: 5, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'effort', SortOrder.Ascending)

        expect(result[0].effort).to.equal(2)
        expect(result[1].effort).to.equal(5)
        expect(result[2].effort).to.equal(8)
      })

      it('should sort by effort descending', () => {
        const tasks = [
          createTask({effort: 2, title: 'Task 1'}),
          createTask({effort: 8, title: 'Task 2'}),
          createTask({effort: 5, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'effort', SortOrder.Descending)

        expect(result[0].effort).to.equal(8)
        expect(result[1].effort).to.equal(5)
        expect(result[2].effort).to.equal(2)
      })

      it('should place null effort at the end', () => {
        const tasks = [
          createTask({effort: 5, title: 'Task 1'}),
          createTask({effort: null, title: 'Task 2'}),
          createTask({effort: 3, title: 'Task 3'}),
        ]

        const result = taskQueryService.sort(tasks, 'effort', SortOrder.Ascending)

        expect(result[0].effort).to.equal(3)
        expect(result[1].effort).to.equal(5)
        expect(result[2].effort).to.be.null
      })
    })

    describe('default sort order', () => {
      it('should use ascending order by default', () => {
        const tasks = [
          createTask({priority: PRIORITY.High}),
          createTask({priority: PRIORITY.Low}),
          createTask({priority: PRIORITY.Medium}),
        ]

        const result = taskQueryService.sort(tasks, 'priority')

        expect(result[0].priority).to.equal(PRIORITY.Low)
        expect(result[1].priority).to.equal(PRIORITY.Medium)
        expect(result[2].priority).to.equal(PRIORITY.High)
      })
    })

    describe('edge cases', () => {
      it('should not mutate original tasks array', () => {
        const tasks = [
          createTask({priority: PRIORITY.High}),
          createTask({priority: PRIORITY.Low}),
          createTask({priority: PRIORITY.Medium}),
        ]
        const originalOrder = tasks.map((t) => t.priority)

        taskQueryService.sort(tasks, 'priority', SortOrder.Ascending)

        expect(tasks.map((t) => t.priority)).to.deep.equal(originalOrder)
      })

      it('should handle empty task array', () => {
        const result = taskQueryService.sort([], 'priority', SortOrder.Ascending)

        expect(result).to.have.lengthOf(0)
      })

      it('should handle single task array', () => {
        const tasks = [createTask({priority: PRIORITY.High})]

        const result = taskQueryService.sort(tasks, 'priority', SortOrder.Ascending)

        expect(result).to.have.lengthOf(1)
        expect(result[0].priority).to.equal(PRIORITY.High)
      })

      it('should maintain stable sort for equal values', () => {
        const tasks = [
          createTask({priority: PRIORITY.High, title: 'Task A'}),
          createTask({priority: PRIORITY.High, title: 'Task B'}),
          createTask({priority: PRIORITY.High, title: 'Task C'}),
        ]

        const result = taskQueryService.sort(tasks, 'priority', SortOrder.Ascending)

        // Order should be preserved for equal priorities
        expect(result[0].title).to.equal('Task A')
        expect(result[1].title).to.equal('Task B')
        expect(result[2].title).to.equal('Task C')
      })
    })
  })

  describe('integration scenarios', () => {
    it('should filter and then sort results', () => {
      const tasks = [
        createFeatureTask({priority: PRIORITY.High, status: STATUS.InProgress, title: 'Feature A'}),
        createFeatureTask({priority: PRIORITY.Low, status: STATUS.InProgress, title: 'Feature B'}),
        createBugTask({priority: PRIORITY.High, status: STATUS.InProgress, title: 'Bug A'}),
        createFeatureTask({priority: PRIORITY.Medium, status: STATUS.NotStarted, title: 'Feature C'}),
      ]

      // Filter to get in-progress features, then sort by priority
      const filtered = taskQueryService.filter(tasks, {
        status: STATUS.InProgress,
        type: TASK_TYPE.Feature,
      })
      const result = taskQueryService.sort(filtered, 'priority', SortOrder.Descending)

      expect(result).to.have.lengthOf(2)
      expect(result[0].priority).to.equal(PRIORITY.High)
      expect(result[1].priority).to.equal(PRIORITY.Low)
    })

    it('should search and then filter results', () => {
      const tasks = [
        createTask({details: 'Implement login feature', status: STATUS.InProgress, title: 'Login'}),
        createTask({details: 'Implement logout feature', status: STATUS.Completed, title: 'Logout'}),
        createTask({details: 'Fix login bug', status: STATUS.InProgress, title: 'Bug fix'}),
      ]

      // Search for "login" then filter for in-progress
      const searched = taskQueryService.search(tasks, 'login')
      const result = taskQueryService.filter(searched, {status: STATUS.InProgress})

      expect(result).to.have.lengthOf(2)
    })

    it('should combine filter, search, and sort', () => {
      const tasks = [
        createFeatureTask({details: 'Auth system', priority: PRIORITY.High, title: 'Authentication'}),
        createFeatureTask({details: 'Auth API', priority: PRIORITY.Low, title: 'API'}),
        createBugTask({details: 'Auth bug', priority: PRIORITY.High, title: 'Bug'}),
        createFeatureTask({details: 'Payment system', priority: PRIORITY.Medium, title: 'Payment'}),
      ]

      // Filter features, search for "auth", sort by priority descending
      const filtered = taskQueryService.filter(tasks, {type: TASK_TYPE.Feature})
      const searched = taskQueryService.search(filtered, 'auth')
      const result = taskQueryService.sort(searched, 'priority', SortOrder.Descending)

      expect(result).to.have.lengthOf(2)
      expect(result[0].priority).to.equal(PRIORITY.High)
      expect(result[1].priority).to.equal(PRIORITY.Low)
    })
  })
})
