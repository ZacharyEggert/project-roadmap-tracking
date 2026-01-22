import {expect} from 'chai'
import {mkdir, rm, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {setTimeout} from 'node:timers/promises'

import {ConfigNotFoundError, ValidationError} from '../../../src/errors/index.js'
import {
  ConfigRepository,
  getDefaultConfigRepository,
  resetDefaultConfigRepository,
} from '../../../src/repositories/config.repository.js'
import {Config} from '../../../src/util/types.js'

const createValidConfig = (overrides?: Partial<Config>): Config => ({
  $schema: 'https://project-roadmap-tracking.com/schemas/config/v1.1.json',
  metadata: {
    description: 'Test project',
    name: 'Test',
  },
  path: './prt.json',
  ...overrides,
})

describe('ConfigRepository', () => {
  let tempDir: string
  let testConfigPath: string
  let repository: ConfigRepository
  let originalCwd: string

  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd()

    // Create temp directory for tests
    tempDir = join(process.cwd(), 'test', 'tmp', `config-repo-test-${Date.now()}`)
    await mkdir(tempDir, {recursive: true})
    testConfigPath = join(tempDir, '.prtrc.json')

    // Create a test config file
    const config = createValidConfig()
    await writeFile(testConfigPath, JSON.stringify(config, null, 2), 'utf8')

    // Change to temp directory so relative paths work
    process.chdir(tempDir)

    // Create a new repository for each test
    repository = new ConfigRepository({
      searchPaths: [testConfigPath], // Override search paths for testing
    })
  })

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd)

    // Clean up
    repository.invalidateCache()
    await rm(tempDir, {force: true, recursive: true})
    resetDefaultConfigRepository()
  })

  describe('constructor', () => {
    it('should create repository with default configuration', () => {
      const repo = new ConfigRepository()
      expect(repo).to.be.instanceOf(ConfigRepository)
      expect(repo.getCachedConfig()).to.be.null
    })

    it('should create repository with custom configuration', () => {
      const repo = new ConfigRepository({
        cacheEnabled: false,
        searchPaths: ['/custom/path/.prtrc.json'],
      })
      expect(repo).to.be.instanceOf(ConfigRepository)
    })

    it('should use default search paths when not provided', () => {
      const repo = new ConfigRepository()
      expect(repo).to.be.instanceOf(ConfigRepository)
    })
  })

  describe('load', () => {
    it('should load config from disk', async () => {
      const config = await repository.load()

      expect(config).to.be.an('object')
      expect(config).to.have.property('$schema')
      expect(config).to.have.property('metadata')
      expect(config).to.have.property('path')
      expect(config.metadata.name).to.equal('Test')
    })

    it('should cache config after first load', async () => {
      expect(repository.getCachedConfig()).to.be.null

      await repository.load()
      expect(repository.getCachedConfig()).to.not.be.null
    })

    it('should return cached config on second load (cache hit)', async () => {
      const firstLoad = await repository.load()
      const secondLoad = await repository.load()

      // Should be the same object reference (from cache)
      expect(secondLoad).to.equal(firstLoad)
    })

    it('should reload from disk if file has been modified', async () => {
      // First load
      await repository.load()

      // Wait a bit to ensure mtime changes
      await setTimeout(10)

      // Modify the file
      const modifiedConfig = createValidConfig({
        metadata: {
          description: 'Modified description',
          name: 'Modified',
        },
      })
      await writeFile(testConfigPath, JSON.stringify(modifiedConfig, null, 2), 'utf8')

      // Second load should get new data
      const secondLoad = await repository.load()
      expect(secondLoad.metadata.name).to.equal('Modified')
    })

    it('should not cache when caching is disabled', async () => {
      const noCacheRepo = new ConfigRepository({
        cacheEnabled: false,
        searchPaths: [testConfigPath],
      })

      await noCacheRepo.load()
      expect(noCacheRepo.getCachedConfig()).to.be.null
    })

    it('should throw ConfigNotFoundError when no config files exist', async () => {
      const emptyRepo = new ConfigRepository({
        searchPaths: [join(tempDir, 'does-not-exist.json')],
      })

      try {
        await emptyRepo.load()
        expect.fail('Expected load to throw ConfigNotFoundError')
      } catch (error) {
        expect(error).to.be.instanceOf(ConfigNotFoundError)
      }
    })

    it('should throw SyntaxError for invalid JSON', async () => {
      const invalidPath = join(tempDir, 'invalid.json')
      await writeFile(invalidPath, 'not valid json', 'utf8')

      const invalidRepo = new ConfigRepository({
        searchPaths: [invalidPath],
      })

      try {
        await invalidRepo.load()
        expect.fail('Expected load to throw SyntaxError')
      } catch (error) {
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })

    it('should throw ValidationError for invalid config structure', async () => {
      const invalidConfig = {
        $schema: 'https://project-roadmap-tracking.com/schemas/config/v1.1.json',
        // Missing required 'path' field
        metadata: {
          description: 'Test',
          name: 'Test',
        },
      }
      await writeFile(testConfigPath, JSON.stringify(invalidConfig, null, 2), 'utf8')

      try {
        await repository.load()
        expect.fail('Expected load to throw ValidationError')
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError)
        expect((error as ValidationError).message).to.include('Validation failed')
      }
    })

    it('should validate cache settings against schema', async () => {
      const configWithInvalidCache = {
        $schema: 'https://project-roadmap-tracking.com/schemas/config/v1.1.json',
        cache: {
          enabled: true,
          maxSize: -5, // Invalid: minimum is 1
        },
        metadata: {
          description: 'Test',
          name: 'Test',
        },
        path: './prt.json',
      }
      await writeFile(testConfigPath, JSON.stringify(configWithInvalidCache, null, 2), 'utf8')

      try {
        await repository.load()
        expect.fail('Expected load to throw ValidationError')
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError)
      }
    })
  })

  describe('config inheritance', () => {
    it('should load only project config when others do not exist', async () => {
      const config = await repository.load()
      expect(config.metadata.name).to.equal('Test')
    })

    it('should merge user-level config with project-level config', async () => {
      const userConfigPath = join(tempDir, 'user.prtrc.json')
      const projectConfigPath = join(tempDir, 'project.prtrc.json')

      // User-level config (lower precedence)
      const userConfig = createValidConfig({
        cache: {
          enabled: true,
          maxSize: 20,
        },
        metadata: {
          description: 'User description',
          name: 'User Config',
        },
        path: './user-prt.json',
      })
      await writeFile(userConfigPath, JSON.stringify(userConfig, null, 2), 'utf8')

      // Project-level config (higher precedence, overrides user)
      const projectConfig = createValidConfig({
        metadata: {
          description: 'Project description',
          name: 'Project Config',
        },
        path: './project-prt.json',
      })
      await writeFile(projectConfigPath, JSON.stringify(projectConfig, null, 2), 'utf8')

      const mergeRepo = new ConfigRepository({
        searchPaths: [projectConfigPath, userConfigPath],
      })

      const merged = await mergeRepo.load()

      // Project config should override user config
      expect(merged.metadata.name).to.equal('Project Config')
      expect(merged.path).to.equal('./project-prt.json')

      // Cache settings from user config should be inherited
      expect(merged.cache?.maxSize).to.equal(20)
    })

    it('should merge global, user, and project configs with correct precedence', async () => {
      const globalConfigPath = join(tempDir, 'global.prtrc.json')
      const userConfigPath = join(tempDir, 'user.prtrc.json')
      const projectConfigPath = join(tempDir, 'project.prtrc.json')

      // Global config (lowest precedence)
      const globalConfig = createValidConfig({
        cache: {
          enabled: true,
          maxSize: 10,
          watchFiles: false,
        },
        metadata: {
          description: 'Global description',
          name: 'Global Config',
        },
        path: './global-prt.json',
      })
      await writeFile(globalConfigPath, JSON.stringify(globalConfig, null, 2), 'utf8')

      // User config (medium precedence)
      const userConfig = createValidConfig({
        cache: {
          maxSize: 20,
        },
        metadata: {
          description: 'User description',
          name: 'User Config',
        },
        path: './user-prt.json',
      })
      await writeFile(userConfigPath, JSON.stringify(userConfig, null, 2), 'utf8')

      // Project config (highest precedence)
      const projectConfig = createValidConfig({
        metadata: {
          description: 'Project description',
          name: 'Project Config',
        },
        path: './project-prt.json',
      })
      await writeFile(projectConfigPath, JSON.stringify(projectConfig, null, 2), 'utf8')

      const mergeRepo = new ConfigRepository({
        searchPaths: [projectConfigPath, userConfigPath, globalConfigPath],
      })

      const merged = await mergeRepo.load()

      // Project config overrides all
      expect(merged.metadata.name).to.equal('Project Config')
      expect(merged.path).to.equal('./project-prt.json')

      // User cache.maxSize overrides global
      expect(merged.cache?.maxSize).to.equal(20)

      // Global cache.enabled and watchFiles are inherited
      expect(merged.cache?.enabled).to.equal(true)
      expect(merged.cache?.watchFiles).to.equal(false)
    })

    it('should handle partial cache config inheritance', async () => {
      const userConfigPath = join(tempDir, 'user.prtrc.json')
      const projectConfigPath = join(tempDir, 'project.prtrc.json')

      const userConfig = createValidConfig({
        cache: {
          enabled: false,
          maxSize: 15,
          watchFiles: true,
        },
      })
      await writeFile(userConfigPath, JSON.stringify(userConfig, null, 2), 'utf8')

      const projectConfig = createValidConfig({
        cache: {
          maxSize: 25,
        },
      })
      await writeFile(projectConfigPath, JSON.stringify(projectConfig, null, 2), 'utf8')

      const mergeRepo = new ConfigRepository({
        searchPaths: [projectConfigPath, userConfigPath],
      })

      const merged = await mergeRepo.load()

      // Project maxSize overrides user
      expect(merged.cache?.maxSize).to.equal(25)

      // User enabled and watchFiles are inherited
      expect(merged.cache?.enabled).to.equal(false)
      expect(merged.cache?.watchFiles).to.equal(true)
    })
  })

  describe('reload', () => {
    it('should invalidate cache and reload from disk', async () => {
      // First load
      const firstLoad = await repository.load()
      expect(firstLoad.metadata.name).to.equal('Test')

      // Modify the file
      const modifiedConfig = createValidConfig({
        metadata: {
          description: 'Reloaded description',
          name: 'Reloaded',
        },
      })
      await writeFile(testConfigPath, JSON.stringify(modifiedConfig, null, 2), 'utf8')

      // Reload should get new data even without mtime change wait
      const reloaded = await repository.reload()
      expect(reloaded.metadata.name).to.equal('Reloaded')
      expect(reloaded).to.not.equal(firstLoad)
    })
  })

  describe('invalidateCache', () => {
    it('should clear cached config', async () => {
      await repository.load()
      expect(repository.getCachedConfig()).to.not.be.null

      repository.invalidateCache()
      expect(repository.getCachedConfig()).to.be.null
    })

    it('should not throw error when invalidating empty cache', () => {
      expect(() => repository.invalidateCache()).to.not.throw()
    })
  })

  describe('getCachedConfig', () => {
    it('should return null when no config is cached', () => {
      expect(repository.getCachedConfig()).to.be.null
    })

    it('should return cached config after load', async () => {
      const loaded = await repository.load()
      const cached = repository.getCachedConfig()

      expect(cached).to.equal(loaded)
      expect(cached?.metadata.name).to.equal('Test')
    })
  })

  describe('getDefaultConfigRepository singleton', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = getDefaultConfigRepository()
      const instance2 = getDefaultConfigRepository()

      expect(instance1).to.equal(instance2)
    })

    it('should create new instance after reset', () => {
      const instance1 = getDefaultConfigRepository()
      resetDefaultConfigRepository()
      const instance2 = getDefaultConfigRepository()

      expect(instance1).to.not.equal(instance2)
    })
  })

  describe('edge cases', () => {
    it('should handle config with all optional fields populated', async () => {
      const fullConfig = createValidConfig({
        cache: {
          enabled: true,
          maxSize: 50,
          watchFiles: false,
        },
      })
      await writeFile(testConfigPath, JSON.stringify(fullConfig, null, 2), 'utf8')

      const config = await repository.load()
      expect(config.cache?.enabled).to.equal(true)
      expect(config.cache?.maxSize).to.equal(50)
      expect(config.cache?.watchFiles).to.equal(false)
    })

    it('should handle config with minimal required fields', async () => {
      const minimalConfig = {
        $schema: 'https://project-roadmap-tracking.com/schemas/config/v1.1.json',
        path: './prt.json',
      }
      await writeFile(testConfigPath, JSON.stringify(minimalConfig, null, 2), 'utf8')

      const config = await repository.load()
      expect(config.path).to.equal('./prt.json')
    })

    it('should handle empty cache object in config', async () => {
      const configWithEmptyCache = createValidConfig({
        cache: {},
      })
      await writeFile(testConfigPath, JSON.stringify(configWithEmptyCache, null, 2), 'utf8')

      const config = await repository.load()
      expect(config).to.have.property('cache')
    })
  })
})
