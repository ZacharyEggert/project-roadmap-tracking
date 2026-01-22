import {expect} from 'chai'
import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import {readConfigFile} from '../../../src/util/read-config.js'
import {createConfig} from '../../fixtures/config-factory.js'
import {cleanupTempDir, createTempConfigFile, createTempDir} from '../../helpers/fs-helpers.js'

describe('readConfigFile', () => {
  let tempDir: string
  let originalCwd: string

  beforeEach(async () => {
    tempDir = await createTempDir('read-config-test-')
    originalCwd = process.cwd()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await cleanupTempDir(tempDir)
  })

  describe('valid file operations', () => {
    it('should read valid .prtrc.json file', async () => {
      const config = createConfig()
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result).to.be.an('object')
      expect(result).to.have.property('$schema')
      expect(result).to.have.property('metadata')
      expect(result).to.have.property('path')
    })

    it('should parse config correctly', async () => {
      const config = createConfig({
        metadata: {
          description: 'Test description',
          name: 'Test Project Name',
        },
        path: './custom-path.json',
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.$schema).to.be.a('string')
      expect(result.metadata).to.be.an('object')
      expect(result.metadata.name).to.equal('Test Project Name')
      expect(result.metadata.description).to.equal('Test description')
      expect(result.path).to.equal('./custom-path.json')
    })

    it('should read config with all required fields', async () => {
      const config = createConfig()
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result).to.have.all.keys('$schema', 'metadata', 'path')
      expect(result.metadata).to.have.all.keys('name', 'description')
    })

    it('should handle config with special characters in metadata', async () => {
      const config = createConfig({
        metadata: {
          description: 'Special chars: <>&"\'\n\t with émojis 🚀',
          name: 'Project™ "Name"',
        },
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.metadata.name).to.equal('Project™ "Name"')
      expect(result.metadata.description).to.equal('Special chars: <>&"\'\n\t with émojis 🚀')
    })

    it('should handle config with relative path', async () => {
      const config = createConfig({
        path: './prt.json',
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.path).to.equal('./prt.json')
    })

    it('should handle config with absolute path', async () => {
      const absolutePath = '/absolute/path/to/prt.json'
      const config = createConfig({
        path: absolutePath,
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.path).to.equal(absolutePath)
    })
  })

  describe('error handling', () => {
    it('should throw error when config file does not exist', async () => {
      process.chdir(tempDir)

      try {
        await readConfigFile()
        expect.fail('Expected readConfigFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect((error as NodeJS.ErrnoException).code).to.equal('ENOENT')
      }
    })

    it('should throw error for malformed config JSON', async () => {
      const configPath = join(tempDir, '.prtrc.json')
      await writeFile(configPath, '{"invalid": json}', 'utf8')
      process.chdir(tempDir)

      try {
        await readConfigFile()
        expect.fail('Expected readConfigFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error for empty config file', async () => {
      const configPath = join(tempDir, '.prtrc.json')
      await writeFile(configPath, '', 'utf8')
      process.chdir(tempDir)

      try {
        await readConfigFile()
        expect.fail('Expected readConfigFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw error for file with only whitespace', async () => {
      const configPath = join(tempDir, '.prtrc.json')
      await writeFile(configPath, '   \n\t  ', 'utf8')
      process.chdir(tempDir)

      try {
        await readConfigFile()
        expect.fail('Expected readConfigFile to throw an error')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle config with missing optional fields', async () => {
      const minimalConfig = {
        $schema:
          'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
        metadata: {
          description: 'Minimal config',
          name: 'Minimal',
        },
        path: './prt.json',
      }
      await createTempConfigFile(minimalConfig, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result).to.deep.equal(minimalConfig)
    })

    it('should handle config with additional unknown fields', async () => {
      const configWithExtras = {
        ...createConfig(),
        extraField: 'should be preserved' as any,
      }
      await createTempConfigFile(configWithExtras, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      // Type assertion to check if extra field is preserved
      expect((result as any).extraField).to.equal('should be preserved')
    })

    it('should handle nested directory structure', async () => {
      const nestedDir = join(tempDir, 'nested', 'path')
      await mkdir(nestedDir, {recursive: true})
      const config = createConfig()
      await createTempConfigFile(config, nestedDir)
      process.chdir(nestedDir)

      const result = await readConfigFile()

      expect(result).to.be.an('object')
      expect(result).to.have.property('$schema')
      expect(result).to.have.property('metadata')
      expect(result).to.have.property('path')
    })

    it('should parse JSON and return properly typed object', async () => {
      const config = createConfig()
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.$schema).to.be.a('string')
      expect(result.metadata).to.be.an('object')
      expect(result.metadata.name).to.be.a('string')
      expect(result.metadata.description).to.be.a('string')
      expect(result.path).to.be.a('string')
    })

    it('should handle config with very long string values', async () => {
      const longString = 'a'.repeat(10_000)
      const config = createConfig({
        metadata: {
          description: longString,
          name: 'Test',
        },
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.metadata.description).to.equal(longString)
      expect(result.metadata.description.length).to.equal(10_000)
    })

    it('should handle config with unicode characters', async () => {
      const config = createConfig({
        metadata: {
          description: '测试 テスト 테스트 тест',
          name: '项目 プロジェクト 프로젝트 проект',
        },
      })
      await createTempConfigFile(config, tempDir)
      process.chdir(tempDir)

      const result = await readConfigFile()

      expect(result.metadata.name).to.equal('项目 プロジェクト 프로젝트 проект')
      expect(result.metadata.description).to.equal('测试 テスト 테스트 тест')
    })
  })
})
