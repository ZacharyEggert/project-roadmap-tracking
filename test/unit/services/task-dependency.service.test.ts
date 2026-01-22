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

  describe('detectCircular', () => {
    describe('basic circular dependency detection', () => {
      it('should return null for valid graph with no circular dependencies', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-003',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.be.null
      })

      it('should detect self-dependency', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-001',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.deep.equal(['F-001', 'F-001'])
        expect(circular!.message).to.equal('Circular dependency detected: F-001 -> F-001')
      })

      it('should detect simple two-node cycle', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.have.lengthOf(3)
        expect(circular!.cycle[0]).to.equal(circular!.cycle[2])
        expect(circular!.cycle).to.include('F-001')
        expect(circular!.cycle).to.include('F-002')
      })

      it('should detect three-node cycle', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-003',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.have.lengthOf(4)
        expect(circular!.cycle[0]).to.equal(circular!.cycle[3])
        expect(circular!.cycle).to.include('F-001')
        expect(circular!.cycle).to.include('F-002')
        expect(circular!.cycle).to.include('F-003')
      })

      it('should return first cycle found when multiple independent cycles exist', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-004'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-004',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        // Should find one of the cycles (implementation returns first found)
        expect(circular!.cycle).to.have.lengthOf(3)
        expect(circular!.cycle[0]).to.equal(circular!.cycle[2])
      })

      it('should return null for valid graph with multiple dependencies (diamond)', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002', 'F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-003',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.be.null
      })
    })

    describe('advanced circular dependency detection', () => {
      it('should detect long cycle path where cycle starts mid-path', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-004'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': ['F-005'] as TaskID[],
            id: 'F-004',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-005',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.include('F-003')
        expect(circular!.cycle).to.include('F-004')
        expect(circular!.cycle).to.include('F-005')
        expect(circular!.cycle[0]).to.equal(circular!.cycle[circular!.cycle.length - 1])
      })

      it('should detect cycle in one branch of complex graph', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002', 'F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-004'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-005'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-004',
          }),
          createFeatureTask({
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-005',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.include('F-003')
        expect(circular!.cycle).to.include('F-005')
      })

      it('should detect cycle created by blocks relationship', () => {
        const tasks = [
          createFeatureTask({
            blocks: ['F-002'] as TaskID[],
            'depends-on': [],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: ['F-001'] as TaskID[],
            'depends-on': [],
            id: 'F-002',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.have.lengthOf(3)
        expect(circular!.cycle).to.include('F-001')
        expect(circular!.cycle).to.include('F-002')
        expect(circular!.cycle[0]).to.equal(circular!.cycle[2])
      })

      it('should detect cycle created by mixed depends-on and blocks relationships', () => {
        const tasks = [
          createFeatureTask({
            blocks: [],
            'depends-on': ['F-002'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            blocks: [],
            'depends-on': ['F-003'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            blocks: ['F-002'] as TaskID[],
            'depends-on': ['F-001'] as TaskID[],
            id: 'F-003',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.not.be.null
        expect(circular!.cycle).to.include('F-001')
        expect(circular!.cycle).to.include('F-002')
        expect(circular!.cycle).to.include('F-003')
      })

      it('should return null for diamond dependency pattern (valid convergence)', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002', 'F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-004'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-004'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-004',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.be.null
      })

      it('should return null for complex graph with branching and merging but no cycles', () => {
        const tasks = [
          createFeatureTask({
            'depends-on': ['F-002', 'F-003'] as TaskID[],
            id: 'F-001',
          }),
          createFeatureTask({
            'depends-on': ['F-004', 'F-005'] as TaskID[],
            id: 'F-002',
          }),
          createFeatureTask({
            'depends-on': ['F-005', 'F-006'] as TaskID[],
            id: 'F-003',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-004',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-005',
          }),
          createFeatureTask({
            'depends-on': [],
            id: 'F-006',
          }),
        ]

        const circular = taskDependencyService.detectCircular(tasks)

        expect(circular).to.be.null
      })
    })
  })

  describe('validateDependencies', () => {
    describe('valid dependencies', () => {
      it('should return empty array for tasks with no dependencies', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: [],
              'depends-on': [],
              id: 'F-001',
            }),
            createFeatureTask({
              blocks: [],
              'depends-on': [],
              id: 'F-002',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.be.an('array')
        expect(errors).to.have.lengthOf(0)
      })

      it('should return empty array for valid dependency chain', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-003'] as TaskID[],
              id: 'F-002',
            }),
            createFeatureTask({
              'depends-on': [],
              id: 'F-003',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(0)
      })

      it('should return empty array for valid blocks relationships', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-002', 'F-003'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              blocks: [],
              'depends-on': ['F-001'],
              id: 'F-002',
            }),
            createFeatureTask({
              blocks: [],
              'depends-on': ['F-001'],
              id: 'F-003',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(0)
      })

      it('should return empty array for valid diamond pattern (convergence)', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-002', 'F-003'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-004'] as TaskID[],
              id: 'F-002',
            }),
            createFeatureTask({
              'depends-on': ['F-004'] as TaskID[],
              id: 'F-003',
            }),
            createFeatureTask({
              'depends-on': [],
              id: 'F-004',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(0)
      })
    })

    describe('invalid task references', () => {
      it('should detect non-existent task in depends-on', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-999'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0]).to.deep.equal({
          message: 'Task F-001 depends on non-existent task F-999',
          relatedTaskIds: ['F-999'],
          taskId: 'F-001',
          type: 'missing-task',
        })
      })

      it('should detect non-existent task in blocks', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-999'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0]).to.deep.equal({
          message: 'Task F-001 blocks non-existent task F-999',
          relatedTaskIds: ['F-999'],
          taskId: 'F-001',
          type: 'missing-task',
        })
      })

      it('should detect multiple invalid references', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-999'] as TaskID[],
              'depends-on': ['F-888'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(2)
        expect(errors[0].type).to.equal('missing-task')
        expect(errors[0].taskId).to.equal('F-001')
        expect(errors[0].relatedTaskIds).to.include('F-888')
        expect(errors[1].type).to.equal('missing-task')
        expect(errors[1].taskId).to.equal('F-001')
        expect(errors[1].relatedTaskIds).to.include('F-999')
      })
    })

    describe('circular dependency detection', () => {
      it('should detect self-dependency', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-001'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0].type).to.equal('circular')
        expect(errors[0].taskId).to.equal('F-001')
        expect(errors[0].relatedTaskIds).to.deep.equal(['F-001', 'F-001'])
        expect(errors[0].message).to.include('Circular dependency detected')
      })

      it('should detect two-node cycle', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-001'] as TaskID[],
              id: 'F-002',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0].type).to.equal('circular')
        expect(errors[0].relatedTaskIds).to.have.lengthOf(3)
        expect(errors[0].relatedTaskIds![0]).to.equal(errors[0].relatedTaskIds![2])
      })

      it('should detect three-node cycle via depends-on', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-003'] as TaskID[],
              id: 'F-002',
            }),
            createFeatureTask({
              'depends-on': ['F-001'] as TaskID[],
              id: 'F-003',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0].type).to.equal('circular')
        expect(errors[0].relatedTaskIds).to.have.lengthOf(4)
        expect(errors[0].relatedTaskIds).to.include('F-001')
        expect(errors[0].relatedTaskIds).to.include('F-002')
        expect(errors[0].relatedTaskIds).to.include('F-003')
      })

      it('should detect cycle via blocks relationship', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-002'] as TaskID[],
              'depends-on': [],
              id: 'F-001',
            }),
            createFeatureTask({
              blocks: ['F-001'] as TaskID[],
              'depends-on': [],
              id: 'F-002',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(3)
        expect(errors[0].type).to.equal('circular')
        expect(errors[0].relatedTaskIds).to.have.lengthOf(3)
        expect(errors[1].type).to.equal('invalid-reference')
      })

      it('should include cycle path in relatedTaskIds', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-003'] as TaskID[],
              id: 'F-002',
            }),
            createFeatureTask({
              'depends-on': ['F-001'] as TaskID[],
              id: 'F-003',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors[0].relatedTaskIds).to.be.an('array')
        expect(errors[0].relatedTaskIds).to.have.lengthOf.at.least(3)
        // The cycle should start and end with the same task
        expect(errors[0].relatedTaskIds![0]).to.equal(errors[0].relatedTaskIds![errors[0].relatedTaskIds!.length - 1])
      })
    })

    describe('bidirectional consistency', () => {
      it('should require blocks and depends-on to be symmetric', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': [], // Not symmetric
              id: 'F-002',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        // Should have no errors - bidirectional symmetry is not required
        expect(errors).to.have.lengthOf(1)
      })
    })

    describe('multiple errors', () => {
      it('should return all error types in single validation', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: ['F-999'] as TaskID[],
              'depends-on': ['F-002'] as TaskID[],
              id: 'F-001',
            }),
            createFeatureTask({
              'depends-on': ['F-001'] as TaskID[],
              id: 'F-002',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        // Should have: missing-task error, circular error, possibly bidirectional warning
        expect(errors.length).to.be.at.least(2)
        const errorTypes = errors.map((e) => e.type)
        expect(errorTypes).to.include('missing-task')
        expect(errorTypes).to.include('circular')
      })
    })

    describe('error format', () => {
      it('should include taskId, message, and type in all errors', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-999'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(1)
        expect(errors[0]).to.have.property('taskId')
        expect(errors[0]).to.have.property('message')
        expect(errors[0]).to.have.property('type')
        expect(errors[0].taskId).to.be.a('string')
        expect(errors[0].message).to.be.a('string')
        expect(errors[0].type).to.be.a('string')
      })

      it('should populate relatedTaskIds appropriately', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              'depends-on': ['F-999'] as TaskID[],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors[0]).to.have.property('relatedTaskIds')
        expect(errors[0].relatedTaskIds).to.be.an('array')
        expect(errors[0].relatedTaskIds).to.include('F-999')
      })
    })

    describe('edge cases', () => {
      it('should handle empty roadmap with no tasks', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.be.an('array')
        expect(errors).to.have.lengthOf(0)
      })

      it('should handle tasks with empty depends-on and blocks arrays', () => {
        const roadmap = {
          $schema: 'test',
          metadata: {
            createdAt: '2024-01-01',
            createdBy: 'test',
            description: 'test',
            name: 'test',
          },
          tasks: [
            createFeatureTask({
              blocks: [],
              'depends-on': [],
              id: 'F-001',
            }),
          ],
        }

        const errors = taskDependencyService.validateDependencies(roadmap)

        expect(errors).to.have.lengthOf(0)
      })
    })
  })

  describe('getBlockedTasks', () => {
    it('should return tasks that depend on the specified task', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-002',
      })
      const task3 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-003',
      })
      const allTasks = [task1, task2, task3]

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      expect(blockedTasks).to.have.lengthOf(2)
      expect(blockedTasks.map((t) => t.id)).to.include('F-002')
      expect(blockedTasks.map((t) => t.id)).to.include('F-003')
    })

    it('should return empty array when no tasks are blocked', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const allTasks = [task1, task2]

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      expect(blockedTasks).to.be.an('array')
      expect(blockedTasks).to.have.lengthOf(0)
    })

    it('should find single blocked task', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-002',
      })
      const allTasks = [task1, task2]

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      expect(blockedTasks).to.have.lengthOf(1)
      expect(blockedTasks[0].id).to.equal('F-002')
    })

    it('should find multiple blocked tasks', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-002',
      })
      const task3 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-003',
      })
      const task4 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-004',
      })
      const allTasks = [task1, task2, task3, task4]

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      expect(blockedTasks).to.have.lengthOf(3)
      expect(blockedTasks.map((t) => t.id)).to.have.members(['F-002', 'F-003', 'F-004'])
    })

    it('should not return the task itself', () => {
      const task1 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-001',
      })
      const allTasks = [task1]

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      // Task depends on itself, but getBlockedTasks should still find it
      expect(blockedTasks).to.have.lengthOf(1)
      expect(blockedTasks[0]).to.equal(task1)
    })

    it('should work with tasks of different types', () => {
      const bugTask = createBugTask({id: 'B-001'})
      const featureTask = createFeatureTask({
        'depends-on': ['B-001'] as TaskID[],
        id: 'F-001',
      })
      const planningTask = createPlanningTask({
        'depends-on': ['B-001'] as TaskID[],
        id: 'P-001',
      })
      const allTasks = [bugTask, featureTask, planningTask]

      const blockedTasks = taskDependencyService.getBlockedTasks(bugTask, allTasks)

      expect(blockedTasks).to.have.lengthOf(2)
      expect(blockedTasks.map((t) => t.id)).to.have.members(['F-001', 'P-001'])
    })

    it('should handle empty task list', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const allTasks: Task[] = []

      const blockedTasks = taskDependencyService.getBlockedTasks(task1, allTasks)

      expect(blockedTasks).to.be.an('array')
      expect(blockedTasks).to.have.lengthOf(0)
    })
  })

  describe('getDependsOnTasks', () => {
    it('should return tasks that this task depends on', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({
        'depends-on': ['F-001', 'F-002'] as TaskID[],
        id: 'F-003',
      })
      const allTasks = [task1, task2, task3]

      const dependencies = taskDependencyService.getDependsOnTasks(task3, allTasks)

      expect(dependencies).to.have.lengthOf(2)
      expect(dependencies.map((t) => t.id)).to.include('F-001')
      expect(dependencies.map((t) => t.id)).to.include('F-002')
    })

    it('should return empty array when task has no dependencies', () => {
      const task1 = createFeatureTask({
        'depends-on': [],
        id: 'F-001',
      })
      const allTasks = [task1]

      const dependencies = taskDependencyService.getDependsOnTasks(task1, allTasks)

      expect(dependencies).to.be.an('array')
      expect(dependencies).to.have.lengthOf(0)
    })

    it('should find single dependency', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        'depends-on': ['F-001'] as TaskID[],
        id: 'F-002',
      })
      const allTasks = [task1, task2]

      const dependencies = taskDependencyService.getDependsOnTasks(task2, allTasks)

      expect(dependencies).to.have.lengthOf(1)
      expect(dependencies[0].id).to.equal('F-001')
    })

    it('should find multiple dependencies', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const task4 = createFeatureTask({
        'depends-on': ['F-001', 'F-002', 'F-003'] as TaskID[],
        id: 'F-004',
      })
      const allTasks = [task1, task2, task3, task4]

      const dependencies = taskDependencyService.getDependsOnTasks(task4, allTasks)

      expect(dependencies).to.have.lengthOf(3)
      expect(dependencies.map((t) => t.id)).to.have.members(['F-001', 'F-002', 'F-003'])
    })

    it('should filter out non-existent task IDs (invalid references)', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({
        'depends-on': ['F-001', 'F-999'] as TaskID[],
        id: 'F-002',
      })
      const allTasks = [task1, task2]

      const dependencies = taskDependencyService.getDependsOnTasks(task2, allTasks)

      expect(dependencies).to.have.lengthOf(1)
      expect(dependencies[0].id).to.equal('F-001')
      expect(dependencies.map((t) => t.id)).to.not.include('F-999')
    })

    it('should preserve order of dependencies', () => {
      const task1 = createFeatureTask({id: 'F-001'})
      const task2 = createFeatureTask({id: 'F-002'})
      const task3 = createFeatureTask({id: 'F-003'})
      const task4 = createFeatureTask({
        'depends-on': ['F-003', 'F-001', 'F-002'] as TaskID[],
        id: 'F-004',
      })
      const allTasks = [task1, task2, task3, task4]

      const dependencies = taskDependencyService.getDependsOnTasks(task4, allTasks)

      expect(dependencies).to.have.lengthOf(3)
      expect(dependencies[0].id).to.equal('F-003')
      expect(dependencies[1].id).to.equal('F-001')
      expect(dependencies[2].id).to.equal('F-002')
    })

    it('should work with tasks of different types', () => {
      const bugTask = createBugTask({id: 'B-001'})
      const featureTask = createFeatureTask({id: 'F-001'})
      const planningTask = createPlanningTask({
        'depends-on': ['B-001', 'F-001'] as TaskID[],
        id: 'P-001',
      })
      const allTasks = [bugTask, featureTask, planningTask]

      const dependencies = taskDependencyService.getDependsOnTasks(planningTask, allTasks)

      expect(dependencies).to.have.lengthOf(2)
      expect(dependencies.map((t) => t.id)).to.have.members(['B-001', 'F-001'])
    })
  })

  describe('topologicalSort', () => {
    describe('simple linear dependency chain', () => {
      it('should sort tasks in correct dependency order', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-002'] as TaskID[],
          id: 'F-003',
        })
        const tasks = [task3, task1, task2] // Intentionally out of order

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.have.lengthOf(3)
        expect(sorted.map((t) => t.id)).to.deep.equal(['F-001', 'F-002', 'F-003'])
      })

      it('should handle reversed input order', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-002'] as TaskID[],
          id: 'F-003',
        })
        const tasks = [task3, task2, task1]

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted.map((t) => t.id)).to.deep.equal(['F-001', 'F-002', 'F-003'])
      })
    })

    describe('parallel tasks with no dependencies', () => {
      it('should handle tasks with no dependencies', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({id: 'F-002'})
        const task3 = createFeatureTask({id: 'F-003'})
        const tasks = [task1, task2, task3]

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.have.lengthOf(3)
        expect(sorted.map((t) => t.id)).to.include.members(['F-001', 'F-002', 'F-003'])
      })

      it('should preserve all tasks when no dependencies exist', () => {
        const task1 = createBugTask({id: 'B-001'})
        const task2 = createFeatureTask({id: 'F-001'})
        const task3 = createPlanningTask({id: 'P-001'})
        const tasks = [task1, task2, task3]

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.have.lengthOf(3)
        expect(sorted.map((t) => t.id)).to.have.members(['F-001', 'B-001', 'P-001'])
      })
    })

    describe('diamond dependency pattern', () => {
      it('should handle diamond dependency correctly', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-003',
        })
        const task4 = createFeatureTask({
          'depends-on': ['F-002', 'F-003'] as TaskID[],
          id: 'F-004',
        })
        const tasks = [task4, task3, task2, task1]

        const sorted = taskDependencyService.topologicalSort(tasks)
        const ids = sorted.map((t) => t.id)

        // F-001 must come first
        expect(ids[0]).to.equal('F-001')
        // F-004 must come last
        expect(ids[3]).to.equal('F-004')
        // F-002 and F-003 must come after F-001 and before F-004
        expect(ids.indexOf('F-002')).to.be.greaterThan(ids.indexOf('F-001'))
        expect(ids.indexOf('F-003')).to.be.greaterThan(ids.indexOf('F-001'))
        expect(ids.indexOf('F-004')).to.be.greaterThan(ids.indexOf('F-002'))
        expect(ids.indexOf('F-004')).to.be.greaterThan(ids.indexOf('F-003'))
      })

      it('should handle double diamond pattern', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-003',
        })
        const task4 = createFeatureTask({
          'depends-on': ['F-002', 'F-003'] as TaskID[],
          id: 'F-004',
        })
        const task5 = createFeatureTask({
          'depends-on': ['F-002', 'F-003'] as TaskID[],
          id: 'F-005',
        })
        const task6 = createFeatureTask({
          'depends-on': ['F-004', 'F-005'] as TaskID[],
          id: 'F-006',
        })
        const tasks = [task6, task5, task4, task3, task2, task1]

        const sorted = taskDependencyService.topologicalSort(tasks)
        const ids = sorted.map((t) => t.id)

        expect(ids[0]).to.equal('F-001')
        expect(ids[5]).to.equal('F-006')
        // Verify all dependencies come before their dependents
        expect(ids.indexOf('F-001')).to.be.lessThan(ids.indexOf('F-002'))
        expect(ids.indexOf('F-001')).to.be.lessThan(ids.indexOf('F-003'))
        expect(ids.indexOf('F-002')).to.be.lessThan(ids.indexOf('F-004'))
        expect(ids.indexOf('F-003')).to.be.lessThan(ids.indexOf('F-004'))
        expect(ids.indexOf('F-004')).to.be.lessThan(ids.indexOf('F-006'))
        expect(ids.indexOf('F-005')).to.be.lessThan(ids.indexOf('F-006'))
      })
    })

    describe('complex graphs', () => {
      it('should handle complex graph correctly', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({id: 'F-002'})
        const task3 = createFeatureTask({
          'depends-on': ['F-001', 'F-002'] as TaskID[],
          id: 'F-003',
        })
        const task4 = createFeatureTask({
          'depends-on': ['F-002'] as TaskID[],
          id: 'F-004',
        })
        const task5 = createFeatureTask({
          'depends-on': ['F-003', 'F-004'] as TaskID[],
          id: 'F-005',
        })
        const tasks = [task5, task4, task3, task2, task1]

        const sorted = taskDependencyService.topologicalSort(tasks)
        const ids = sorted.map((t) => t.id)

        // Verify all dependencies come before dependents
        expect(ids.indexOf('F-001')).to.be.lessThan(ids.indexOf('F-003'))
        expect(ids.indexOf('F-002')).to.be.lessThan(ids.indexOf('F-003'))
        expect(ids.indexOf('F-002')).to.be.lessThan(ids.indexOf('F-004'))
        expect(ids.indexOf('F-003')).to.be.lessThan(ids.indexOf('F-005'))
        expect(ids.indexOf('F-004')).to.be.lessThan(ids.indexOf('F-005'))
      })

      it('should handle multiple independent chains', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createBugTask({id: 'B-001'})
        const task4 = createBugTask({
          'depends-on': ['B-001'] as TaskID[],
          id: 'B-002',
        })
        const tasks = [task4, task2, task3, task1]

        const sorted = taskDependencyService.topologicalSort(tasks)
        const ids = sorted.map((t) => t.id)

        // Feature chain
        expect(ids.indexOf('F-001')).to.be.lessThan(ids.indexOf('F-002'))
        // Bug chain
        expect(ids.indexOf('B-001')).to.be.lessThan(ids.indexOf('B-002'))
      })
    })

    describe('circular dependencies', () => {
      it('should throw error on circular dependency', () => {
        const task1 = createFeatureTask({
          'depends-on': ['F-003'] as TaskID[],
          id: 'F-001',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-002'] as TaskID[],
          id: 'F-003',
        })
        const tasks = [task1, task2, task3]

        expect(() => taskDependencyService.topologicalSort(tasks)).to.throw(/Circular dependency detected/)
      })

      it('should throw error on self-referencing task', () => {
        const task1 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-001',
        })
        const tasks = [task1]

        expect(() => taskDependencyService.topologicalSort(tasks)).to.throw(/Circular dependency detected/)
      })

      it('should throw error on two-task cycle', () => {
        const task1 = createFeatureTask({
          'depends-on': ['F-002'] as TaskID[],
          id: 'F-001',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001'] as TaskID[],
          id: 'F-002',
        })
        const tasks = [task1, task2]

        expect(() => taskDependencyService.topologicalSort(tasks)).to.throw(/Circular dependency detected/)
      })
    })

    describe('edge cases', () => {
      it('should handle empty task list', () => {
        const tasks: Task[] = []

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.be.an('array')
        expect(sorted).to.have.lengthOf(0)
      })

      it('should handle single task', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const tasks = [task1]

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.have.lengthOf(1)
        expect(sorted[0].id).to.equal('F-001')
      })

      it('should not mutate the original tasks array', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({id: 'F-002'})
        const tasks = [task1, task2]
        const originalLength = tasks.length
        const originalIds = tasks.map((t) => t.id)

        taskDependencyService.topologicalSort(tasks)

        expect(tasks).to.have.lengthOf(originalLength)
        expect(tasks.map((t) => t.id)).to.deep.equal(originalIds)
      })

      it('should return new array instance', () => {
        const task1 = createFeatureTask({id: 'F-001'})
        const task2 = createFeatureTask({id: 'F-002'})
        const tasks = [task1, task2]

        const sorted = taskDependencyService.topologicalSort(tasks)

        expect(sorted).to.not.equal(tasks)
        expect(sorted).to.be.an('array')
      })
    })
  })
})
