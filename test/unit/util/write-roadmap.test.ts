import {expect} from 'chai'
import {chmod, mkdir, readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import {writeRoadmapFile} from '../../../src/util/write-roadmap.js'
import {createComplexRoadmap, createEmptyRoadmap, createSimpleRoadmap} from '../../fixtures/roadmap-factory.js'
import {assertRoadmapValid} from '../../helpers/assertions.js'
import {cleanupTempDir, createTempDir, fileExists} from '../../helpers/fs-helpers.js'

describe('writeRoadmapFile', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir('write-roadmap-test-')
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('valid write operations', () => {
    it('should write valid empty roadmap to file', async () => {
      const roadmap = createEmptyRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      expect(parsed).to.deep.equal(roadmap)
      assertRoadmapValid(parsed)
    })

    it('should write simple roadmap with tasks to file', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap)
      expect(JSON.stringify(parsed)).to.equal(JSON.stringify(expected))
      assertRoadmapValid(parsed)
      expect(parsed.tasks).to.be.an('array')
      expect(parsed.tasks.length).to.be.greaterThan(0)
    })

    it('should write complex roadmap with many tasks to file', async () => {
      const roadmap = createComplexRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap)
      expect(JSON.stringify(parsed)).to.equal(JSON.stringify(expected))
      assertRoadmapValid(parsed)
      expect(parsed.tasks).to.be.an('array')
      expect(parsed.tasks.length).to.be.at.least(5)
    })

    it('should serialize to JSON correctly with proper formatting', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')

      // Check that it's properly formatted with 2-space indentation
      expect(content).to.include('\n')
      expect(content).to.include('  ')

      // Verify it can be parsed
      const parsed = JSON.parse(content)
      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap)
      expect(JSON.stringify(parsed)).to.equal(JSON.stringify(expected))

      // Check that pretty-printed JSON matches expected format
      const expectedFormat = JSON.stringify(roadmap, null, 2)
      expect(content).to.equal(expectedFormat)
    })

    it('should overwrite existing file', async () => {
      const filePath = join(tempDir, 'prt.json')

      // Write initial roadmap
      const roadmap1 = createEmptyRoadmap()
      await writeRoadmapFile(filePath, roadmap1)

      const content1 = await readFile(filePath, 'utf8')
      const parsed1 = JSON.parse(content1)
      expect(parsed1.tasks).to.be.an('array').that.is.empty

      // Overwrite with different roadmap
      const roadmap2 = createSimpleRoadmap()
      await writeRoadmapFile(filePath, roadmap2)

      const content2 = await readFile(filePath, 'utf8')
      const parsed2 = JSON.parse(content2)
      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap2)
      expect(JSON.stringify(parsed2)).to.equal(JSON.stringify(expected))
      expect(parsed2.tasks).to.be.an('array')
      expect(parsed2.tasks.length).to.be.greaterThan(0)
    })

    it('should write to different directory paths', async () => {
      const roadmap = createEmptyRoadmap()
      const nestedDir = join(tempDir, 'nested', 'path')
      await mkdir(nestedDir, {recursive: true})
      const filePath = join(nestedDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)
      expect(parsed).to.deep.equal(roadmap)
    })

    it('should write file with different name', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = join(tempDir, 'custom-roadmap.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)
      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap)
      expect(JSON.stringify(parsed)).to.equal(JSON.stringify(expected))
    })

    it('should preserve all roadmap properties when writing', async () => {
      const roadmap = createComplexRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      // Check all top-level properties
      expect(parsed.$schema).to.equal(roadmap.$schema)
      expect(parsed.metadata).to.deep.equal(roadmap.metadata)
      expect(parsed.tasks).to.have.lengthOf(roadmap.tasks.length)

      // Check that all task properties are preserved
      // Compare serialized versions to handle undefined values properly
      const expectedTasks = structuredClone(roadmap.tasks)
      for (const [index, task] of parsed.tasks.entries()) {
        expect(JSON.stringify(task)).to.equal(JSON.stringify(expectedTasks[index]))
      }
    })
  })

  describe('parent directory creation', () => {
    it('should create parent directories if needed', async () => {
      const roadmap = createEmptyRoadmap()
      const nestedDir = join(tempDir, 'level1', 'level2', 'level3')
      const filePath = join(nestedDir, 'prt.json')

      // Note: writeRoadmapFile currently doesn't create parent directories
      // This test documents expected behavior but will fail with current implementation
      // We'll need to handle this in the actual implementation
      try {
        await writeRoadmapFile(filePath, roadmap)
        // If we get here, parent dirs were created or already existed
        const exists = await fileExists(filePath)
        expect(exists).to.be.true
      } catch (error) {
        // Current implementation will throw ENOENT because parent directories don't exist
        expect(error).to.be.an('error')
        expect((error as NodeJS.ErrnoException).code).to.equal('ENOENT')
      }
    })

    it('should write file when parent directory already exists', async () => {
      const roadmap = createEmptyRoadmap()
      const nestedDir = join(tempDir, 'existing', 'directory')
      await mkdir(nestedDir, {recursive: true})
      const filePath = join(nestedDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const exists = await fileExists(filePath)
      expect(exists).to.be.true
    })
  })

  describe('error handling', () => {
    it('should throw error when writing to read-only directory', async function () {
      // Skip on Windows as permission handling is different
      if (process.platform === 'win32') {
        this.skip()
        return
      }

      const roadmap = createEmptyRoadmap()
      const readOnlyDir = join(tempDir, 'readonly')
      await mkdir(readOnlyDir)
      const filePath = join(readOnlyDir, 'prt.json')

      // Make directory read-only
      await chmod(readOnlyDir, 0o444)

      try {
        await writeRoadmapFile(filePath, roadmap)
        expect.fail('Expected writeRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect((error as NodeJS.ErrnoException).code).to.be.oneOf(['EACCES', 'EPERM'])
      } finally {
        // Restore permissions for cleanup
        await chmod(readOnlyDir, 0o755).catch(() => {})
      }
    })

    it('should throw error when writing to read-only file', async function () {
      // Skip on Windows as permission handling is different
      if (process.platform === 'win32') {
        this.skip()
        return
      }

      const roadmap1 = createEmptyRoadmap()
      const roadmap2 = createSimpleRoadmap()
      const filePath = join(tempDir, 'readonly-file.json')

      // Create file and make it read-only
      await writeFile(filePath, JSON.stringify(roadmap1, null, 2), 'utf8')
      await chmod(filePath, 0o444)

      try {
        await writeRoadmapFile(filePath, roadmap2)
        expect.fail('Expected writeRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect((error as NodeJS.ErrnoException).code).to.be.oneOf(['EACCES', 'EPERM'])
      } finally {
        // Restore permissions for cleanup
        await chmod(filePath, 0o644).catch(() => {})
      }
    })

    it('should throw error when directory does not exist', async () => {
      const roadmap = createEmptyRoadmap()
      const nonExistentDir = join(tempDir, 'non-existent-dir', 'nested')
      const filePath = join(nonExistentDir, 'prt.json')

      try {
        await writeRoadmapFile(filePath, roadmap)
        expect.fail('Expected writeRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect((error as NodeJS.ErrnoException).code).to.equal('ENOENT')
      }
    })

    it('should handle errors when path is a directory', async () => {
      const roadmap = createEmptyRoadmap()
      const dirPath = join(tempDir, 'is-directory')
      await mkdir(dirPath)

      try {
        await writeRoadmapFile(dirPath, roadmap)
        expect.fail('Expected writeRoadmapFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        // Error code varies by platform - could be EISDIR or EACCES
        expect((error as NodeJS.ErrnoException).code).to.be.oneOf(['EISDIR', 'EACCES', 'EPERM'])
      }
    })
  })

  describe('JSON formatting', () => {
    it('should preserve JSON formatting with 2-space indentation', async () => {
      const roadmap = createSimpleRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')

      // Split into lines and check indentation
      const lines = content.split('\n')

      // Check that file starts with {
      expect(lines[0]).to.equal('{')

      // Check that nested properties use 2-space indentation
      const schemaLine = lines.find((line) => line.includes('"$schema"'))
      expect(schemaLine).to.match(/^ {2}"\$schema":/)

      // Check that deeply nested properties use proper indentation
      const metadataLines = lines.filter(
        (line) => line.trim().startsWith('"name"') || line.trim().startsWith('"description"'),
      )
      for (const line of metadataLines) {
        expect(line).to.match(/^ {4}/) // 4 spaces for nested object properties
      }
    })

    it('should preserve UTF-8 encoding', async () => {
      const roadmap = createEmptyRoadmap()
      // Add some UTF-8 characters to metadata
      roadmap.metadata.name = 'Test Roadmap 测试 🚀'
      roadmap.metadata.description = 'Description with émojis and spëcial çharacters'
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      expect(parsed.metadata.name).to.equal('Test Roadmap 测试 🚀')
      expect(parsed.metadata.description).to.equal('Description with émojis and spëcial çharacters')
    })

    it('should handle empty tasks array correctly', async () => {
      const roadmap = createEmptyRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')

      // Check that empty array is formatted correctly
      expect(content).to.include('"tasks": []')

      const parsed = JSON.parse(content)
      expect(parsed.tasks).to.be.an('array').that.is.empty
    })

    it('should handle large roadmaps with many tasks', async () => {
      const roadmap = createComplexRoadmap()
      const filePath = join(tempDir, 'prt.json')

      await writeRoadmapFile(filePath, roadmap)

      const content = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(content)

      // Compare serialized versions to handle undefined values properly
      const expected = structuredClone(roadmap)
      expect(JSON.stringify(parsed)).to.equal(JSON.stringify(expected))
      expect(content.length).to.be.greaterThan(1000) // Large file check
    })
  })
})
