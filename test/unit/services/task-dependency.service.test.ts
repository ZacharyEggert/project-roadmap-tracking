import {expect} from 'chai'

import {TaskDependencyService} from '../../../src/services/task-dependency.service.js'
import {Task, TaskID} from '../../../src/util/types.js'
import {createBugTask, createFeatureTask, createPlanningTask} from '../../fixtures/task-factory.js'

describe('TaskDependencyService', () => {
  let taskDependencyService: TaskDependencyService

  beforeEach(() => {
    taskDependencyService = new TaskDependencyService()
  })

  describe('buildGraph', () => {
    describe('simple dependencies', () => {
      it('should build graph from tasks with depends-on relationships', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-001',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-002')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
      })

      it('should build graph with multiple depends-on relationships', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-001', 'F-002'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-002',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-003')).to.deep.equal(['F-001', 'F-002'])
        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('F-002')).to.deep.equal([])
      })

      it('should build graph with chain of dependencies', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': [] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-003',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('F-002')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-003')).to.deep.equal(['F-002'])
      })
    })

    describe('tasks with no dependencies', () => {
      it('should handle tasks with empty depends-on arrays', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': [],
            id: 'F-001',
          }),
          createBugTask({
            'depends-on': [],
            id: 'B-001',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('B-001')).to.deep.equal([])
      })

      it('should handle tasks with empty blocks arrays', () => {
        const tasks = [
          createFeatureTask({
            blocks: [],
            id: 'F-001',
          }),
          createBugTask({
            blocks: [],
            id: 'B-001',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.blocks.get('F-001')).to.deep.equal([])
        expect(graph.blocks.get('B-001')).to.deep.equal([])
      })

      it('should initialize empty arrays for tasks with no dependencies', () => {
        const tasks = [
          createFeatureTask({id: 'F-001'}),
          createBugTask({id: 'B-001'}),
          createPlanningTask({id: 'P-001'}),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('B-001')).to.deep.equal([])
        expect(graph.dependsOn.get('P-001')).to.deep.equal([])
        expect(graph.blocks.get('F-001')).to.deep.equal([])
        expect(graph.blocks.get('B-001')).to.deep.equal([])
        expect(graph.blocks.get('P-001')).to.deep.equal([])
      })
    })

    describe('blocks relationships', () => {
      it('should build graph with blocks relationships', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-002', 'F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: [],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: [],
            id: 'F-003',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.blocks.get('F-001')).to.deep.equal(['F-002', 'F-003'])
        expect(graph.blocks.get('F-002')).to.deep.equal([])
        expect(graph.blocks.get('F-003')).to.deep.equal([])
      })

      it('should handle single blocks relationship', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: [],
            id: 'F-002',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.blocks.get('F-001')).to.deep.equal(['F-002'])
        expect(graph.blocks.get('F-002')).to.deep.equal([])
      })

      it('should handle multiple tasks with blocks', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: ['F-003'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: [],
            id: 'F-003',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.blocks.get('F-001')).to.deep.equal(['F-003'])
        expect(graph.blocks.get('F-002')).to.deep.equal(['F-003'])
        expect(graph.blocks.get('F-003')).to.deep.equal([])
      })
    })

    describe('both depends-on and blocks', () => {
      it('should build graph with both relationship types', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-003'] as TaskID[],
            'depends-on': [] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: [] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: [] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-003',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('F-002')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-003')).to.deep.equal(['F-001'])
        expect(graph.blocks.get('F-001')).to.deep.equal(['F-003'])
        expect(graph.blocks.get('F-002')).to.deep.equal([])
        expect(graph.blocks.get('F-003')).to.deep.equal([])
      })

      it('should handle complex dependency and block relationships', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-003', 'F-004'] as TaskID[],
            'depends-on': [] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: ['F-004'] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: [] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            blocks: [] as TaskID[],
            'depends-on': ['F-001', 'F-002'] as TaskID[],
            id: 'F-004',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        // Verify depends-on relationships
        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('F-002')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-003')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-004')).to.deep.equal(['F-001', 'F-002'])

        // Verify blocks relationships
        expect(graph.blocks.get('F-001')).to.deep.equal(['F-003', 'F-004'])
        expect(graph.blocks.get('F-002')).to.deep.equal(['F-004'])
        expect(graph.blocks.get('F-003')).to.deep.equal([])
        expect(graph.blocks.get('F-004')).to.deep.equal([])
      })

      it('should handle tasks with both depends-on and blocks on same task', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-003'] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: [],
            'depends-on': [],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: [],
            'depends-on': [],
            id: 'F-003',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('F-002')).to.deep.equal(['F-001'])
        expect(graph.blocks.get('F-002')).to.deep.equal(['F-003'])
      })
    })

    describe('empty task list', () => {
      it('should handle empty task array', () => {
        const tasks: Task[] = []

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.size).to.equal(0)
        expect(graph.blocks.size).to.equal(0)
      })

      it('should return Maps with no entries for empty array', () => {
        const tasks: Task[] = []

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn).to.be.instanceOf(Map)
        expect(graph.blocks).to.be.instanceOf(Map)
        expect([...graph.dependsOn.keys()]).to.deep.equal([])
        expect([...graph.blocks.keys()]).to.deep.equal([])
      })
    })

    describe('graph structure verification', () => {
      it('should return object with both dependsOn and blocks properties', () => {
        const tasks = [createFeatureTask({id: 'F-001'})]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph).to.have.property('dependsOn')
        expect(graph).to.have.property('blocks')
      })

      it('should return Maps with TaskID keys and TaskID[] values', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-002'] as TaskID[],
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({id: 'F-002'}),
          createFeatureTask({id: 'F-003'}),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn).to.be.instanceOf(Map)
        expect(graph.blocks).to.be.instanceOf(Map)

        // Verify keys are TaskIDs
        const dependsOnKeys = [...graph.dependsOn.keys()]
        expect(dependsOnKeys).to.include('F-001')
        expect(dependsOnKeys).to.include('F-002')
        expect(dependsOnKeys).to.include('F-003')

        // Verify values are TaskID arrays
        expect(graph.dependsOn.get('F-001')).to.be.an('array')
        expect(graph.blocks.get('F-001')).to.be.an('array')
      })

      it('should represent all tasks in both Maps', () => {
        const tasks = [
          createFeatureTask({id: 'F-001'}),
          createBugTask({id: 'B-001'}),
          createPlanningTask({id: 'P-001'}),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        // All tasks should be in dependsOn map
        expect(graph.dependsOn.has('F-001')).to.be.true
        expect(graph.dependsOn.has('B-001')).to.be.true
        expect(graph.dependsOn.has('P-001')).to.be.true

        // All tasks should be in blocks map
        expect(graph.blocks.has('F-001')).to.be.true
        expect(graph.blocks.has('B-001')).to.be.true
        expect(graph.blocks.has('P-001')).to.be.true

        // Maps should have correct size
        expect(graph.dependsOn.size).to.equal(3)
        expect(graph.blocks.size).to.equal(3)
      })

      it('should preserve task order in the Maps', () => {
        const tasks = [
          createFeatureTask({id: 'F-003'}),
          createFeatureTask({id: 'F-001'}),
          createFeatureTask({id: 'F-002'}),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        const dependsOnKeys = [...graph.dependsOn.keys()]
        const blocksKeys = [...graph.blocks.keys()]

        expect(dependsOnKeys).to.deep.equal(['F-003', 'F-001', 'F-002'])
        expect(blocksKeys).to.deep.equal(['F-003', 'F-001', 'F-002'])
      })
    })

    describe('mixed task types', () => {
      it('should handle different task types in dependency relationships', () => {
        const tasks = [
          createBugTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'B-001',
          }),
          createFeatureTask({
            blocks: ['P-001'] as TaskID[],
            id: 'F-001',
          }),
          createPlanningTask({
            'depends-on': ['B-001', 'F-001'] as TaskID[],
            id: 'P-001',
          }),
        ]

        const graph = taskDependencyService.buildGraph(tasks)

        expect(graph.dependsOn.get('B-001')).to.deep.equal(['F-001'])
        expect(graph.dependsOn.get('F-001')).to.deep.equal([])
        expect(graph.dependsOn.get('P-001')).to.deep.equal(['B-001', 'F-001'])
        expect(graph.blocks.get('F-001')).to.deep.equal(['P-001'])
      })
    })
  })
})
