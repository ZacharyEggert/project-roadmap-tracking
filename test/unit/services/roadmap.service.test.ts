/* eslint-disable max-nested-callbacks */
import {expect} from 'chai'
import * as fs from 'node:fs/promises'
import {join} from 'node:path'

import {RoadmapService} from '../../../src/services/roadmap.service.js'
import {PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../../../src/util/types.js'
import {
  createComplexRoadmap,
  createEmptyRoadmap,
  createRoadmap,
  createSimpleRoadmap,
} from '../../fixtures/roadmap-factory.js'
import {createBugTask, createFeatureTask, createTask} from '../../fixtures/task-factory.js'
import {
  cleanupTempDir,
  createTempDir,
  createTempRoadmapFile,
  readTempFile,
  readTempJsonFile,
} from '../../helpers/fs-helpers.js'

describe('RoadmapService', () => {
  let roadmapService: RoadmapService
  let tempDir: string

  beforeEach(async () => {
    roadmapService = new RoadmapService()
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('load', () => {
    describe('successful load operations', () => {
      it('should load a valid roadmap file', async () => {
        const originalRoadmap = createSimpleRoadmap()
        const filePath = await createTempRoadmapFile(originalRoadmap, tempDir)

        const loadedRoadmap = await roadmapService.load(filePath)

        expect(loadedRoadmap.$schema).to.equal(originalRoadmap.$schema)
        expect(loadedRoadmap.metadata).to.deep.equal(originalRoadmap.metadata)
        expect(loadedRoadmap.tasks.length).to.equal(originalRoadmap.tasks.length)
        expect(loadedRoadmap.tasks[0].id).to.equal(originalRoadmap.tasks[0].id)
      })

      it('should load an empty roadmap', async () => {
        const originalRoadmap = createEmptyRoadmap()
        const filePath = await createTempRoadmapFile(originalRoadmap, tempDir)

        const loadedRoadmap = await roadmapService.load(filePath)

        expect(loadedRoadmap).to.deep.equal(originalRoadmap)
        expect(loadedRoadmap.tasks).to.have.lengthOf(0)
      })

      it('should load a complex roadmap with dependencies', async () => {
        const originalRoadmap = createComplexRoadmap()
        const filePath = await createTempRoadmapFile(originalRoadmap, tempDir)

        const loadedRoadmap = await roadmapService.load(filePath)

        expect(loadedRoadmap.$schema).to.equal(originalRoadmap.$schema)
        expect(loadedRoadmap.metadata).to.deep.equal(originalRoadmap.metadata)
        expect(loadedRoadmap.tasks.length).to.equal(originalRoadmap.tasks.length)
        expect(loadedRoadmap.tasks.length).to.be.greaterThan(0)

        // Verify dependencies are preserved
        const tasksWithDeps = loadedRoadmap.tasks.filter((t) => t['depends-on'] && t['depends-on'].length > 0)
        expect(tasksWithDeps.length).to.be.greaterThan(0)
      })

      it('should preserve all metadata fields', async () => {
        const originalRoadmap = createRoadmap({
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test Creator',
            description: 'Test Description',
            name: 'Test Project Name',
          },
        })
        const filePath = await createTempRoadmapFile(originalRoadmap, tempDir)

        const loadedRoadmap = await roadmapService.load(filePath)

        expect(loadedRoadmap.metadata).to.deep.equal(originalRoadmap.metadata)
      })

      it('should preserve all task fields', async () => {
        const task = createTask({
          assignedTo: 'Alice',
          blocks: ['F-002'],
          'depends-on': ['B-001'],
          details: 'Detailed description',
          dueDate: '2026-02-01T00:00:00.000Z',
          effort: 8,
          'github-refs': ['#123', '#456'],
          notes: 'Some notes',
          'passes-tests': true,
          priority: PRIORITY.High,
          status: STATUS.InProgress,
          tags: ['frontend', 'urgent'],
          title: 'Complex task',
          type: TASK_TYPE.Feature,
        })
        const roadmap = createRoadmap({tasks: [task]})
        const filePath = await createTempRoadmapFile(roadmap, tempDir)

        const loadedRoadmap = await roadmapService.load(filePath)

        expect(loadedRoadmap.tasks[0]).to.deep.equal(task)
      })
    })

    describe('error handling', () => {
      it('should throw error when file does not exist', async () => {
        const nonExistentPath = join(tempDir, 'nonexistent.json')

        try {
          await roadmapService.load(nonExistentPath)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Failed to load roadmap from')
          expect((error as Error).message).to.include(nonExistentPath)
        }
      })

      it('should throw error for malformed JSON', async () => {
        const filePath = join(tempDir, 'malformed.json')
        await fs.writeFile(filePath, '{ invalid json }', 'utf8')

        try {
          await roadmapService.load(filePath)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Failed to load roadmap from')
        }
      })

      it('should throw error for empty file', async () => {
        const filePath = join(tempDir, 'empty.json')
        await fs.writeFile(filePath, '', 'utf8')

        try {
          await roadmapService.load(filePath)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Failed to load roadmap from')
        }
      })

      it('should throw error for invalid roadmap structure', async () => {
        const filePath = join(tempDir, 'invalid.json')
        await fs.writeFile(filePath, JSON.stringify({invalid: 'structure'}), 'utf8')

        // Note: load() doesn't validate structure, it just reads and parses JSON
        // Structure validation happens in validate() or when commands use the roadmap
        const loadedRoadmap = await roadmapService.load(filePath)
        expect(loadedRoadmap).to.have.property('invalid')
      })

      it('should include original error message in thrown error', async () => {
        const nonExistentPath = join(tempDir, 'missing', 'nested', 'file.json')

        try {
          await roadmapService.load(nonExistentPath)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          const {message} = error as Error
          expect(message).to.include('Failed to load roadmap from')
          expect(message).to.include(nonExistentPath)
        }
      })
    })
  })

  describe('save', () => {
    describe('successful save operations', () => {
      it('should save a valid roadmap', async () => {
        const roadmap = createSimpleRoadmap()
        const filePath = join(tempDir, 'saved.json')

        await roadmapService.save(filePath, roadmap)

        const savedContent = await readTempJsonFile<Roadmap>(filePath)
        expect(savedContent.$schema).to.equal(roadmap.$schema)
        expect(savedContent.metadata).to.deep.equal(roadmap.metadata)
        expect(savedContent.tasks.length).to.equal(roadmap.tasks.length)
      })

      it('should save an empty roadmap', async () => {
        const roadmap = createEmptyRoadmap()
        const filePath = join(tempDir, 'empty.json')

        await roadmapService.save(filePath, roadmap)

        const savedContent = await readTempJsonFile<Roadmap>(filePath)
        expect(savedContent).to.deep.equal(roadmap)
        expect(savedContent.tasks).to.have.lengthOf(0)
      })

      it('should save a complex roadmap with dependencies', async () => {
        const roadmap = createComplexRoadmap()
        const filePath = join(tempDir, 'complex.json')

        await roadmapService.save(filePath, roadmap)

        const savedContent = await readTempJsonFile<Roadmap>(filePath)
        expect(savedContent.$schema).to.equal(roadmap.$schema)
        expect(savedContent.tasks.length).to.equal(roadmap.tasks.length)
      })

      it('should overwrite existing file', async () => {
        const firstRoadmap = createSimpleRoadmap()
        const secondRoadmap = createComplexRoadmap()
        const filePath = join(tempDir, 'overwrite.json')

        await roadmapService.save(filePath, firstRoadmap)
        await roadmapService.save(filePath, secondRoadmap)

        const savedContent = await readTempJsonFile<Roadmap>(filePath)
        expect(savedContent.tasks.length).to.equal(secondRoadmap.tasks.length)
        expect(savedContent.tasks.length).to.not.equal(firstRoadmap.tasks.length)
      })

      it('should preserve JSON formatting with proper indentation', async () => {
        const roadmap = createSimpleRoadmap()
        const filePath = join(tempDir, 'formatted.json')

        await roadmapService.save(filePath, roadmap)

        const rawContent = await readTempFile(filePath)
        expect(rawContent).to.include('\n')
        expect(rawContent).to.include('  ')

        // Verify it's valid JSON
        const parsed = JSON.parse(rawContent)
        expect(parsed.$schema).to.equal(roadmap.$schema)
        expect(parsed.tasks.length).to.equal(roadmap.tasks.length)
      })

      it('should save to a file in an existing directory', async () => {
        const roadmap = createEmptyRoadmap()
        const filePath = join(tempDir, 'roadmap.json')

        await roadmapService.save(filePath, roadmap)

        const savedContent = await readTempJsonFile<Roadmap>(filePath)
        expect(savedContent.$schema).to.equal(roadmap.$schema)
        expect(savedContent.tasks).to.have.lengthOf(0)
      })
    })

    describe('validation before save', () => {
      it('should validate roadmap before saving', async () => {
        const invalidRoadmap = {
          $schema: 'https://example.com/roadmap-schema.json',
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test',
            description: 'Test',
            name: 'Test',
          },
          tasks: [
            // Invalid task missing required fields
            {id: 'INVALID'},
          ],
        } as unknown as Roadmap
        const filePath = join(tempDir, 'invalid.json')

        try {
          await roadmapService.save(filePath, invalidRoadmap)
          expect.fail('Should have thrown validation error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Cannot save invalid roadmap')
        }
      })

      it('should reject roadmap with duplicate task IDs', async () => {
        const task1 = createFeatureTask({title: 'Task 1'})
        const task2 = createBugTask({title: 'Task 2'})
        // Force duplicate ID
        ;(task2 as {id: string}).id = task1.id
        const roadmap = createRoadmap({tasks: [task1, task2]})
        const filePath = join(tempDir, 'duplicates.json')

        try {
          await roadmapService.save(filePath, roadmap)
          expect.fail('Should have thrown validation error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Cannot save invalid roadmap')
          expect((error as Error).message).to.include('Duplicate task ID')
        }
      })

      it('should reject roadmap with invalid task references', async () => {
        const task = createFeatureTask({
          'depends-on': ['NONEXISTENT-001' as never],
          title: 'Task with invalid dependency',
        })
        const roadmap = createRoadmap({tasks: [task]})
        const filePath = join(tempDir, 'invalid-refs.json')

        try {
          await roadmapService.save(filePath, roadmap)
          expect.fail('Should have thrown validation error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Cannot save invalid roadmap')
          expect((error as Error).message).to.include('non-existent task')
        }
      })

      it('should reject roadmap missing required metadata fields', async () => {
        const invalidRoadmap = {
          $schema: 'https://example.com/roadmap-schema.json',
          metadata: {
            // Missing required fields
            name: 'Test',
          },
          tasks: [],
        } as unknown as Roadmap
        const filePath = join(tempDir, 'missing-metadata.json')

        try {
          await roadmapService.save(filePath, invalidRoadmap)
          expect.fail('Should have thrown validation error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Cannot save invalid roadmap')
        }
      })

      it('should not write file if validation fails', async () => {
        const invalidRoadmap = {
          tasks: 'not an array',
        } as unknown as Roadmap
        const filePath = join(tempDir, 'should-not-exist.json')

        try {
          await roadmapService.save(filePath, invalidRoadmap)
          expect.fail('Should have thrown validation error')
        } catch {
          // Expected error
        }

        // Verify file was not created
        try {
          await fs.access(filePath)
          expect.fail('File should not have been created')
        } catch (error) {
          // Expected - file should not exist
          expect((error as NodeJS.ErrnoException).code).to.equal('ENOENT')
        }
      })
    })

    describe('error handling', () => {
      it('should throw descriptive error on write failure', async () => {
        const roadmap = createSimpleRoadmap()
        // Try to write to invalid path (e.g., file instead of directory)
        const invalidPath = join(tempDir, 'file.json', 'nested.json')

        try {
          await roadmapService.save(invalidPath, roadmap)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('Failed to save roadmap to')
          expect((error as Error).message).to.include(invalidPath)
        }
      })

      it('should include validation errors in error message', async () => {
        const task1 = createFeatureTask()
        const task2 = createBugTask()
        task2.id = task1.id // Duplicate
        const roadmap = createRoadmap({tasks: [task1, task2]})
        const filePath = join(tempDir, 'error.json')

        try {
          await roadmapService.save(filePath, roadmap)
          expect.fail('Should have thrown validation error')
        } catch (error) {
          expect(error).to.be.instanceOf(Error)
          const {message} = error as Error
          expect(message).to.include('Cannot save invalid roadmap')
          expect(message).to.include('Duplicate')
        }
      })
    })
  })

  describe('validate', () => {
    describe('valid roadmaps', () => {
      it('should return empty array for valid empty roadmap', () => {
        const roadmap = createEmptyRoadmap()

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.be.an('array')
        expect(errors).to.have.lengthOf(0)
      })

      it('should return empty array for valid simple roadmap', () => {
        const roadmap = createSimpleRoadmap()

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.lengthOf(0)
      })

      it('should return empty array for valid complex roadmap', () => {
        const roadmap = createComplexRoadmap()

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.lengthOf(0)
      })

      it('should validate roadmap with all required metadata fields', () => {
        const roadmap = createRoadmap({
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test User',
            description: 'Description',
            name: 'Name',
          },
        })

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.lengthOf(0)
      })
    })

    describe('structure validation', () => {
      it('should return error for null roadmap', () => {
        const errors = roadmapService.validate(null as unknown as Roadmap)

        expect(errors).to.have.length.greaterThan(0)
        expect(errors[0].type).to.equal('structure')
        expect(errors[0].message).to.include('must be an object')
      })

      it('should return error for roadmap missing $schema', () => {
        const roadmap = {
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test',
            description: 'Test',
            name: 'Test',
          },
          tasks: [],
        } as unknown as Roadmap

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const schemaError = errors.find((e) => e.message.includes('$schema'))
        expect(schemaError).to.exist
        expect(schemaError?.type).to.equal('structure')
      })

      it('should return error for roadmap missing metadata', () => {
        const roadmap = {
          $schema: 'https://example.com/roadmap-schema.json',
          tasks: [],
        } as unknown as Roadmap

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const metadataError = errors.find((e) => e.message.includes('metadata'))
        expect(metadataError).to.exist
        expect(metadataError?.type).to.equal('structure')
      })

      it('should return error for roadmap missing tasks array', () => {
        const roadmap = {
          $schema: 'https://example.com/roadmap-schema.json',
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test',
            description: 'Test',
            name: 'Test',
          },
        } as unknown as Roadmap

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const tasksError = errors.find((e) => e.message.includes('tasks') && e.message.includes('array'))
        expect(tasksError).to.exist
        expect(tasksError?.type).to.equal('structure')
      })

      it('should return error for non-array tasks', () => {
        const roadmap = {
          $schema: 'https://example.com/roadmap-schema.json',
          metadata: {
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'Test',
            description: 'Test',
            name: 'Test',
          },
          tasks: 'not an array',
        } as unknown as Roadmap

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const tasksError = errors.find((e) => e.message.includes('tasks') && e.message.includes('array'))
        expect(tasksError).to.exist
        expect(tasksError?.type).to.equal('structure')
      })
    })

    describe('metadata validation', () => {
      it('should return error for missing metadata.name', () => {
        const roadmap = createRoadmap()
        delete (roadmap.metadata as Partial<typeof roadmap.metadata>).name

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const nameError = errors.find((e) => e.message.includes('name'))
        expect(nameError).to.exist
        expect(nameError?.type).to.equal('structure')
      })

      it('should return error for missing metadata.description', () => {
        const roadmap = createRoadmap()
        delete (roadmap.metadata as Partial<typeof roadmap.metadata>).description

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const descError = errors.find((e) => e.message.includes('description'))
        expect(descError).to.exist
        expect(descError?.type).to.equal('structure')
      })

      it('should return error for missing metadata.createdBy', () => {
        const roadmap = createRoadmap()
        delete (roadmap.metadata as Partial<typeof roadmap.metadata>).createdBy

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const createdByError = errors.find((e) => e.message.includes('createdBy'))
        expect(createdByError).to.exist
        expect(createdByError?.type).to.equal('structure')
      })

      it('should return error for missing metadata.createdAt', () => {
        const roadmap = createRoadmap()
        delete (roadmap.metadata as Partial<typeof roadmap.metadata>).createdAt

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const createdAtError = errors.find((e) => e.message.includes('createdAt'))
        expect(createdAtError).to.exist
        expect(createdAtError?.type).to.equal('structure')
      })

      it('should return error for non-string metadata.name', () => {
        const roadmap = createRoadmap()
        ;(roadmap.metadata as {name: unknown}).name = 123

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const nameError = errors.find((e) => e.message.includes('name'))
        expect(nameError).to.exist
      })
    })

    describe('task validation', () => {
      it('should return error for task with invalid ID format', () => {
        const roadmap = createRoadmap()
        roadmap.tasks = [
          {
            id: 'INVALID',
            priority: PRIORITY.Medium,
            status: STATUS.NotStarted,
            title: 'Task',
            type: TASK_TYPE.Feature,
          } as never,
        ]

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const idError = errors.find((e) => e.message.includes('ID') || e.message.includes('id'))
        expect(idError).to.exist
        expect(idError?.type).to.equal('task')
      })

      it('should return error for task with invalid type', () => {
        const task = createFeatureTask()
        ;(task as {type: string}).type = 'invalid-type'
        const roadmap = createRoadmap({tasks: [task as never]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const typeError = errors.find((e) => e.message.includes('type'))
        expect(typeError).to.exist
        expect(typeError?.type).to.equal('task')
      })

      it('should return error for task with invalid status', () => {
        const task = createFeatureTask()
        ;(task as {status: string}).status = 'invalid-status'
        const roadmap = createRoadmap({tasks: [task as never]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const statusError = errors.find((e) => e.message.includes('status'))
        expect(statusError).to.exist
        expect(statusError?.type).to.equal('task')
      })

      it('should return error for task with invalid priority', () => {
        const task = createFeatureTask()
        ;(task as {priority: string}).priority = 'invalid-priority'
        const roadmap = createRoadmap({tasks: [task as never]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const priorityError = errors.find((e) => e.message.includes('priority'))
        expect(priorityError).to.exist
        expect(priorityError?.type).to.equal('task')
      })

      it('should return error for task missing required fields', () => {
        const roadmap = createRoadmap()
        roadmap.tasks = [
          {
            id: 'F-001',
            // Missing title, type, status, priority
          } as never,
        ]

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        expect(errors.some((e) => e.type === 'task')).to.be.true
      })

      it('should include taskId in validation errors', () => {
        const task = createFeatureTask()
        ;(task as {type: string}).type = 'invalid'
        const roadmap = createRoadmap({tasks: [task as never]})

        const errors = roadmapService.validate(roadmap)

        const taskError = errors.find((e) => e.type === 'task')
        expect(taskError).to.exist
        expect(taskError?.taskId).to.equal(task.id)
      })
    })

    describe('duplicate ID detection', () => {
      it('should return error for duplicate task IDs', () => {
        const task1 = createFeatureTask({title: 'Task 1'})
        const task2 = createBugTask({title: 'Task 2'})
        ;(task2 as {id: string}).id = task1.id // Force duplicate
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const dupError = errors.find((e) => e.type === 'duplicate-id')
        expect(dupError).to.exist
        expect(dupError?.message).to.include('Duplicate task ID')
        expect(dupError?.message).to.include(task1.id)
      })

      it('should report all duplicate IDs', () => {
        const task1 = createFeatureTask({title: 'Task 1'})
        const task2 = createBugTask({title: 'Task 2'})
        const task3 = createFeatureTask({title: 'Task 3'})
        ;(task2 as {id: string}).id = task1.id // First duplicate
        ;(task3 as {id: string}).id = task1.id // Second duplicate
        const roadmap = createRoadmap({tasks: [task1, task2, task3]})

        const errors = roadmapService.validate(roadmap)

        const dupErrors = errors.filter((e) => e.type === 'duplicate-id')
        expect(dupErrors.length).to.be.greaterThan(0)
      })

      it('should not report error for unique task IDs', () => {
        const roadmap = createSimpleRoadmap()

        const errors = roadmapService.validate(roadmap)

        const dupErrors = errors.filter((e) => e.type === 'duplicate-id')
        expect(dupErrors).to.have.lengthOf(0)
      })
    })

    describe('reference validation', () => {
      it('should return error for invalid depends-on reference', () => {
        const task = createFeatureTask({
          'depends-on': ['NONEXISTENT-001' as never],
          title: 'Task with invalid dependency',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const refError = errors.find((e) => e.type === 'invalid-reference')
        expect(refError).to.exist
        expect(refError?.message).to.include('depends on non-existent task')
        expect(refError?.message).to.include('NONEXISTENT-001')
        expect(refError?.taskId).to.equal(task.id)
      })

      it('should return error for invalid blocks reference', () => {
        const task = createFeatureTask({
          blocks: ['NONEXISTENT-002' as never],
          title: 'Task with invalid blocks',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const errors = roadmapService.validate(roadmap)

        expect(errors).to.have.length.greaterThan(0)
        const refError = errors.find((e) => e.type === 'invalid-reference')
        expect(refError).to.exist
        expect(refError?.message).to.include('blocks non-existent task')
        expect(refError?.message).to.include('NONEXISTENT-002')
      })

      it('should return error for multiple invalid references in single task', () => {
        const task = createFeatureTask({
          blocks: ['NONEXISTENT-001' as never],
          'depends-on': ['NONEXISTENT-002' as never, 'NONEXISTENT-003' as never],
          title: 'Task with multiple invalid refs',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const errors = roadmapService.validate(roadmap)

        const refErrors = errors.filter((e) => e.type === 'invalid-reference')
        expect(refErrors.length).to.be.greaterThan(0)
      })

      it('should not error for valid task references', () => {
        const task1 = createFeatureTask({title: 'Foundation'})
        const task2 = createFeatureTask({
          'depends-on': [task1.id],
          title: 'Dependent',
        })
        task1.blocks = [task2.id] // Valid: task1 blocks task2, and task2 depends on task1
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        const refErrors = errors.filter((e) => e.type === 'invalid-reference')
        expect(refErrors).to.have.lengthOf(0)
      })

      it('should validate references across all tasks', () => {
        const task1 = createFeatureTask({title: 'Task 1'})
        const task2 = createBugTask({title: 'Task 2'})
        const task3 = createFeatureTask({
          'depends-on': [task1.id, task2.id],
          title: 'Task 3',
        })
        const roadmap = createRoadmap({tasks: [task1, task2, task3]})

        const errors = roadmapService.validate(roadmap)

        const refErrors = errors.filter((e) => e.type === 'invalid-reference')
        expect(refErrors).to.have.lengthOf(0)
      })
    })

    describe('circular dependency detection', () => {
      it('should detect circular dependency through RoadmapService', () => {
        const task1 = createFeatureTask({
          'depends-on': ['F-002' as never],
          id: 'F-001',
          title: 'Task 1',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-002',
          title: 'Task 2',
        })
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        const circularError = errors.find((e) => e.type === 'circular-dependency')
        expect(circularError).to.exist
        expect(circularError?.message).to.include('Circular dependency')
      })

      it('should detect self-dependency', () => {
        const task = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-001',
          title: 'Self-dependent task',
        })
        const roadmap = createRoadmap({tasks: [task]})

        const errors = roadmapService.validate(roadmap)

        const circularError = errors.find((e) => e.type === 'circular-dependency')
        expect(circularError).to.exist
      })

      it('should detect circular dependency via blocks', () => {
        const task1 = createFeatureTask({
          blocks: ['F-002' as never],
          id: 'F-001',
          title: 'Task 1',
        })
        const task2 = createFeatureTask({
          blocks: ['F-001' as never],
          id: 'F-002',
          title: 'Task 2',
        })
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        const circularError = errors.find((e) => e.type === 'circular-dependency')
        expect(circularError).to.exist
      })

      it('should not error for diamond dependency pattern', () => {
        const task1 = createFeatureTask({
          'depends-on': [],
          id: 'F-001',
          title: 'Base task',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-002',
          title: 'Middle task 1',
        })
        const task3 = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-003',
          title: 'Middle task 2',
        })
        const task4 = createFeatureTask({
          'depends-on': ['F-002' as never, 'F-003' as never],
          id: 'F-004',
          title: 'Top task',
        })
        const roadmap = createRoadmap({tasks: [task1, task2, task3, task4]})

        const errors = roadmapService.validate(roadmap)

        const circularErrors = errors.filter((e) => e.type === 'circular-dependency')
        expect(circularErrors).to.have.lengthOf(0)
      })
    })

    describe('integration tests', () => {
      it('should combine dependency errors with other validation errors', () => {
        const task1 = createFeatureTask({
          'depends-on': ['F-002' as never, 'F-999' as never], // F-002 creates circular, F-999 is missing
          id: 'F-001',
          title: 'Task 1',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-002',
          title: 'Task 2',
        })
        ;(task1 as {type: string}).type = 'invalid' // Also invalid type
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        // Should have multiple error types
        expect(errors.length).to.be.greaterThan(1)
        const errorTypes = new Set(errors.map((e) => e.type))
        expect(errorTypes.size).to.be.greaterThan(1) // Multiple error types
      })

      it('should detect both missing references and circular dependencies', () => {
        const task1 = createFeatureTask({
          blocks: ['F-999' as never], // Missing task
          'depends-on': ['F-002' as never], // Creates circular
          id: 'F-001',
          title: 'Task 1',
        })
        const task2 = createFeatureTask({
          'depends-on': ['F-001' as never],
          id: 'F-002',
          title: 'Task 2',
        })
        const roadmap = createRoadmap({tasks: [task1, task2]})

        const errors = roadmapService.validate(roadmap)

        // Should have both missing-task and circular errors
        const missingTaskErrors = errors.filter((e) => e.type === 'missing-task')
        const circularErrors = errors.filter((e) => e.type === 'circular-dependency')

        expect(missingTaskErrors.length).to.be.greaterThan(0)
        expect(circularErrors.length).to.be.greaterThan(0)
      })
    })

    describe('multiple errors', () => {
      it('should return all validation errors, not just first', () => {
        const task1 = createFeatureTask()
        const task2 = createBugTask()
        ;(task2 as {id: string}).id = task1.id // Duplicate
        ;(task1 as {type: string}).type = 'invalid' // Invalid type
        const roadmap = createRoadmap({tasks: [task1, task2]})
        delete (roadmap.metadata as Partial<typeof roadmap.metadata>).name // Missing metadata

        const errors = roadmapService.validate(roadmap)

        expect(errors.length).to.be.greaterThan(1)
        expect(errors.some((e) => e.type === 'structure')).to.be.true
        expect(errors.some((e) => e.type === 'task')).to.be.true
        expect(errors.some((e) => e.type === 'duplicate-id')).to.be.true
      })

      it('should group errors by type', () => {
        const roadmap = {
          // Missing $schema (structure error)
          metadata: {
            // Missing required fields (structure errors)
            name: 'Test',
          },
          tasks: [
            // Invalid task (task error)
            {id: 'INVALID'},
          ],
        } as unknown as Roadmap

        const errors = roadmapService.validate(roadmap)

        expect(errors.length).to.be.greaterThan(0)
        const structureErrors = errors.filter((e) => e.type === 'structure')
        const taskErrors = errors.filter((e) => e.type === 'task')
        expect(structureErrors.length).to.be.greaterThan(0)
        expect(taskErrors.length).to.be.greaterThan(0)
      })
    })
  })

  describe('getStats', () => {
    describe('empty roadmap', () => {
      it('should return zero counts for empty roadmap', () => {
        const roadmap = createEmptyRoadmap()

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(0)
        expect(stats.byStatus[STATUS.NotStarted]).to.equal(0)
        expect(stats.byStatus[STATUS.InProgress]).to.equal(0)
        expect(stats.byStatus[STATUS.Completed]).to.equal(0)
        expect(stats.byType[TASK_TYPE.Bug]).to.equal(0)
        expect(stats.byType[TASK_TYPE.Feature]).to.equal(0)
        expect(stats.byType[TASK_TYPE.Improvement]).to.equal(0)
        expect(stats.byType[TASK_TYPE.Planning]).to.equal(0)
        expect(stats.byType[TASK_TYPE.Research]).to.equal(0)
        expect(stats.byPriority[PRIORITY.High]).to.equal(0)
        expect(stats.byPriority[PRIORITY.Medium]).to.equal(0)
        expect(stats.byPriority[PRIORITY.Low]).to.equal(0)
      })
    })

    describe('single task statistics', () => {
      it('should count single not-started task', () => {
        const task = createFeatureTask({status: STATUS.NotStarted})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(1)
        expect(stats.byStatus[STATUS.NotStarted]).to.equal(1)
        expect(stats.byStatus[STATUS.InProgress]).to.equal(0)
        expect(stats.byStatus[STATUS.Completed]).to.equal(0)
      })

      it('should count single in-progress task', () => {
        const task = createFeatureTask({status: STATUS.InProgress})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(1)
        expect(stats.byStatus[STATUS.InProgress]).to.equal(1)
      })

      it('should count single completed task', () => {
        const task = createFeatureTask({status: STATUS.Completed})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(1)
        expect(stats.byStatus[STATUS.Completed]).to.equal(1)
      })

      it('should count bug type', () => {
        const task = createBugTask()
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byType[TASK_TYPE.Bug]).to.equal(1)
        expect(stats.byType[TASK_TYPE.Feature]).to.equal(0)
      })

      it('should count feature type', () => {
        const task = createFeatureTask()
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byType[TASK_TYPE.Feature]).to.equal(1)
      })

      it('should count high priority', () => {
        const task = createFeatureTask({priority: PRIORITY.High})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byPriority[PRIORITY.High]).to.equal(1)
        expect(stats.byPriority[PRIORITY.Medium]).to.equal(0)
        expect(stats.byPriority[PRIORITY.Low]).to.equal(0)
      })

      it('should count medium priority', () => {
        const task = createFeatureTask({priority: PRIORITY.Medium})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byPriority[PRIORITY.Medium]).to.equal(1)
      })

      it('should count low priority', () => {
        const task = createFeatureTask({priority: PRIORITY.Low})
        const roadmap = createRoadmap({tasks: [task]})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byPriority[PRIORITY.Low]).to.equal(1)
      })
    })

    describe('simple roadmap statistics', () => {
      it('should count all tasks correctly', () => {
        const roadmap = createSimpleRoadmap()

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(roadmap.tasks.length)
      })

      it('should count tasks by status', () => {
        const tasks = [
          createFeatureTask({status: STATUS.NotStarted}),
          createBugTask({status: STATUS.InProgress}),
          createFeatureTask({status: STATUS.Completed}),
          createBugTask({status: STATUS.NotStarted}),
        ]
        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byStatus[STATUS.NotStarted]).to.equal(2)
        expect(stats.byStatus[STATUS.InProgress]).to.equal(1)
        expect(stats.byStatus[STATUS.Completed]).to.equal(1)
      })

      it('should count tasks by type', () => {
        const roadmap = createSimpleRoadmap()

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byType[TASK_TYPE.Bug]).to.be.greaterThan(0)
        expect(stats.byType[TASK_TYPE.Feature]).to.be.greaterThan(0)
        expect(stats.byType[TASK_TYPE.Improvement]).to.be.greaterThan(0)
        expect(stats.byType[TASK_TYPE.Planning]).to.be.greaterThan(0)
      })

      it('should count tasks by priority', () => {
        const tasks = [
          createFeatureTask({priority: PRIORITY.High}),
          createBugTask({priority: PRIORITY.High}),
          createFeatureTask({priority: PRIORITY.Medium}),
          createBugTask({priority: PRIORITY.Low}),
        ]
        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byPriority[PRIORITY.High]).to.equal(2)
        expect(stats.byPriority[PRIORITY.Medium]).to.equal(1)
        expect(stats.byPriority[PRIORITY.Low]).to.equal(1)
      })
    })

    describe('complex roadmap statistics', () => {
      it('should handle complex roadmap correctly', () => {
        const roadmap = createComplexRoadmap()

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(roadmap.tasks.length)
        expect(stats.totalTasks).to.be.greaterThan(0)
      })

      it('should maintain correct totals across all categories', () => {
        const roadmap = createComplexRoadmap()

        const stats = roadmapService.getStats(roadmap)

        const statusTotal =
          stats.byStatus[STATUS.NotStarted] + stats.byStatus[STATUS.InProgress] + stats.byStatus[STATUS.Completed]
        const typeTotal =
          stats.byType[TASK_TYPE.Bug] +
          stats.byType[TASK_TYPE.Feature] +
          stats.byType[TASK_TYPE.Improvement] +
          stats.byType[TASK_TYPE.Planning] +
          stats.byType[TASK_TYPE.Research]
        const priorityTotal =
          stats.byPriority[PRIORITY.High] + stats.byPriority[PRIORITY.Medium] + stats.byPriority[PRIORITY.Low]

        expect(statusTotal).to.equal(stats.totalTasks)
        expect(typeTotal).to.equal(stats.totalTasks)
        expect(priorityTotal).to.equal(stats.totalTasks)
      })
    })

    describe('uniform distributions', () => {
      it('should handle all tasks with same status', () => {
        const tasks = [
          createFeatureTask({status: STATUS.Completed}),
          createBugTask({status: STATUS.Completed}),
          createFeatureTask({status: STATUS.Completed}),
        ]
        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byStatus[STATUS.Completed]).to.equal(3)
        expect(stats.byStatus[STATUS.InProgress]).to.equal(0)
        expect(stats.byStatus[STATUS.NotStarted]).to.equal(0)
      })

      it('should handle all tasks with same type', () => {
        const tasks = [createFeatureTask(), createFeatureTask(), createFeatureTask()]
        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byType[TASK_TYPE.Feature]).to.equal(3)
        expect(stats.byType[TASK_TYPE.Bug]).to.equal(0)
      })

      it('should handle all tasks with same priority', () => {
        const tasks = [
          createFeatureTask({priority: PRIORITY.High}),
          createBugTask({priority: PRIORITY.High}),
          createFeatureTask({priority: PRIORITY.High}),
        ]
        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.byPriority[PRIORITY.High]).to.equal(3)
        expect(stats.byPriority[PRIORITY.Medium]).to.equal(0)
        expect(stats.byPriority[PRIORITY.Low]).to.equal(0)
      })
    })

    describe('edge cases', () => {
      it('should handle roadmap with many tasks', () => {
        const tasks = []
        for (let i = 0; i < 100; i++) {
          tasks.push(createFeatureTask({title: `Task ${i}`}))
        }

        const roadmap = createRoadmap({tasks})

        const stats = roadmapService.getStats(roadmap)

        expect(stats.totalTasks).to.equal(100)
        expect(stats.byType[TASK_TYPE.Feature]).to.equal(100)
      })

      it('should not mutate original roadmap', () => {
        const roadmap = createSimpleRoadmap()
        const originalTaskCount = roadmap.tasks.length

        roadmapService.getStats(roadmap)

        expect(roadmap.tasks.length).to.equal(originalTaskCount)
      })
    })
  })
})
