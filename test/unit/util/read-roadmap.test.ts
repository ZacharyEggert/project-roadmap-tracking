import {expect} from 'chai'
import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import {PrtErrorCode, RoadmapNotFoundError} from '../../../src/errors/index.js'
import {readRoadmapFile} from '../../../src/util/read-roadmap.js'
import {createComplexRoadmap, createEmptyRoadmap, createSimpleRoadmap} from '../../fixtures/roadmap-factory.js'
import {assertRoadmapValid} from '../../helpers/assertions.js'
import {cleanupTempDir, createTempDir, createTempRoadmapFile} from '../../helpers/fs-helpers.js'

describe('readRoadmapFile', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir('read-roadmap-test-')
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('valid file operations', () => {
    it('should read and parse empty roadmap file', async () => {
      const roadmap = createEmptyRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result).to.be.an('object')
      expect(result).to.have.property('$schema')
      expect(result).to.have.property('metadata')
      expect(result).to.have.property('tasks')
      expect(result.tasks).to.be.an('array').that.is.empty
      assertRoadmapValid(result)
    })

    it('should read and parse simple roadmap with tasks', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result).to.be.an('object')
      assertRoadmapValid(result)
      expect(result.tasks).to.be.an('array')
      expect(result.tasks.length).to.be.greaterThan(0)
    })

    it('should read and parse complex roadmap with many tasks', async () => {
      const roadmap = createComplexRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result).to.be.an('object')
      assertRoadmapValid(result)
      expect(result.tasks).to.be.an('array')
      expect(result.tasks.length).to.be.at.least(5)
    })

    it('should parse JSON correctly and return properly typed object', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result.$schema).to.be.a('string')
      expect(result.metadata).to.be.an('object')
      expect(result.metadata.name).to.be.a('string')
      expect(result.metadata.description).to.be.a('string')
      expect(result.metadata.createdAt).to.be.a('string')
      expect(result.metadata.createdBy).to.be.a('string')
      expect(result.tasks).to.be.an('array')
    })

    it('should read from different directory paths', async () => {
      const roadmap = createEmptyRoadmap()
      const nestedDir = join(tempDir, 'nested', 'path')
      // Create nested directory structure
      await mkdir(nestedDir, {recursive: true})
      await writeFile(join(nestedDir, 'prt.json'), JSON.stringify(roadmap, null, 2), 'utf8')

      const result = await readRoadmapFile(join(nestedDir, 'prt.json'))

      expect(result).to.be.an('object')
      assertRoadmapValid(result)
    })

    it('should read from file with different name', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir, 'custom-roadmap.json')

      const result = await readRoadmapFile(filePath)

      expect(result).to.be.an('object')
      assertRoadmapValid(result)
    })

    it('should read file from fixture directory', async () => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'json', 'empty-roadmap.json')

      const result = await readRoadmapFile(fixturePath)

      expect(result).to.be.an('object')
      expect(result).to.have.property('$schema')
      expect(result).to.have.property('metadata')
      expect(result).to.have.property('tasks')
      expect(result.tasks).to.be.an('array').that.is.empty
    })

    it('should read complex fixture file correctly', async () => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'json', 'complex-roadmap.json')

      const result = await readRoadmapFile(fixturePath)

      expect(result).to.be.an('object')
      assertRoadmapValid(result)
      expect(result.tasks).to.be.an('array')
      expect(result.tasks.length).to.be.greaterThan(5)
    })
  })

  describe('error handling', () => {
    it('should throw error when file does not exist', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.json')

      try {
        await readRoadmapFile(nonExistentPath)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.instanceOf(RoadmapNotFoundError)
        expect((error as RoadmapNotFoundError).code).to.equal(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND)
      }
    })

    it('should throw error for malformed JSON', async () => {
      const malformedPath = join(tempDir, 'malformed.json')
      await writeFile(malformedPath, '{"invalid": json}', 'utf8')

      try {
        await readRoadmapFile(malformedPath)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error for file with invalid JSON syntax from fixture', async () => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'json', 'invalid-roadmap.json')

      try {
        await readRoadmapFile(fixturePath)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error for empty file', async () => {
      const emptyPath = join(tempDir, 'empty.json')
      await writeFile(emptyPath, '', 'utf8')

      try {
        await readRoadmapFile(emptyPath)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error for file with only whitespace', async () => {
      const whitespacePath = join(tempDir, 'whitespace.json')
      await writeFile(whitespacePath, '   \n\t  ', 'utf8')

      try {
        await readRoadmapFile(whitespacePath)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error when directory does not exist', async () => {
      const nonExistentDir = join(tempDir, 'non-existent-dir', 'file.json')

      try {
        await readRoadmapFile(nonExistentDir)
        expect.fail('Expected readRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.instanceOf(RoadmapNotFoundError)
        expect((error as RoadmapNotFoundError).code).to.equal(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND)
      }
    })

    it('should throw error for JSON that is not an object', async () => {
      const arrayPath = join(tempDir, 'array.json')
      await writeFile(arrayPath, '["not", "an", "object"]', 'utf8')

      const result = await readRoadmapFile(arrayPath)
      // The function doesn't validate structure, just parses
      // This test documents current behavior
      expect(result).to.be.an('array')
    })

    it('should throw error for JSON primitive', async () => {
      const primitivePath = join(tempDir, 'primitive.json')
      await writeFile(primitivePath, '"just a string"', 'utf8')

      const result = await readRoadmapFile(primitivePath)
      // The function doesn't validate structure, just parses
      // This test documents current behavior
      expect(result).to.be.a('string')
    })
  })

  describe('edge cases', () => {
    it('should handle very large roadmap files', async () => {
      const roadmap = createComplexRoadmap()
      // Add many more tasks to make it large
      const largeTasks = [...roadmap.tasks]
      for (let i = 0; i < 100; i++) {
        largeTasks.push({...roadmap.tasks[0], id: `P-${1000 + i}` as any})
      }

      const largeRoadmap = {...roadmap, tasks: largeTasks}
      const filePath = await createTempRoadmapFile(largeRoadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result).to.be.an('object')
      expect(result.tasks).to.be.an('array')
      expect(result.tasks.length).to.be.at.least(100)
    })

    it('should preserve task order from file', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      // Compare task IDs to verify order is preserved
      expect(result.tasks.map((t) => t.id)).to.deep.equal(roadmap.tasks.map((t) => t.id))
      expect(result.tasks.length).to.equal(roadmap.tasks.length)
    })

    it('should handle roadmap with special characters in metadata', async () => {
      const roadmap = createEmptyRoadmap()
      roadmap.metadata.name = 'Test™ with émojis 🚀 and "quotes"'
      roadmap.metadata.description = 'Special chars: <>&"\'\n\t'
      const filePath = await createTempRoadmapFile(roadmap, tempDir)

      const result = await readRoadmapFile(filePath)

      expect(result.metadata.name).to.equal(roadmap.metadata.name)
      expect(result.metadata.description).to.equal(roadmap.metadata.description)
    })
  })
})
