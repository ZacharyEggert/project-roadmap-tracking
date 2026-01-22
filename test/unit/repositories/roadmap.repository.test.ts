import {expect} from 'chai'
import {mkdir, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {setTimeout} from 'node:timers/promises'

import {
  getDefaultRepository,
  resetDefaultRepository,
  RoadmapRepository,
} from '../../../src/repositories/roadmap.repository.js'
import {Config, PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../../../src/util/types.js'
import {createRoadmap} from '../../fixtures/roadmap-factory.js'

describe('RoadmapRepository', () => {
  let tempDir: string
  let testRoadmapPath: string
  let repository: RoadmapRepository

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = join(process.cwd(), 'test', 'tmp', `repo-test-${Date.now()}`)
    await mkdir(tempDir, {recursive: true})
    testRoadmapPath = join(tempDir, 'prt.json')

    // Create a test roadmap file
    const roadmap = createRoadmap()
    await writeFile(testRoadmapPath, JSON.stringify(roadmap, null, 2), 'utf8')

    // Create a new repository for each test
    repository = new RoadmapRepository()
  })

  afterEach(async () => {
    // Clean up
    await repository.dispose()
    await rm(tempDir, {force: true, recursive: true})
    resetDefaultRepository()
  })

  describe('constructor', () => {
    it('should create repository with default configuration', () => {
      const repo = new RoadmapRepository()
      expect(repo).to.be.instanceOf(RoadmapRepository)
      expect(repo.getCacheSize()).to.equal(0)
    })

    it('should create repository with custom configuration', () => {
      const repo = new RoadmapRepository({
        cacheEnabled: false,
        maxCacheSize: 5,
        watchFiles: false,
      })
      expect(repo).to.be.instanceOf(RoadmapRepository)
    })
  })

  describe('fromConfig', () => {
    it('should create repository from Config object with cache settings', () => {
      const config: Config = {
        $schema: 'https://example.com/schema.json',
        cache: {
          enabled: true,
          maxSize: 20,
          watchFiles: false,
        },
        metadata: {
          description: 'Test',
          name: 'Test',
        },
        path: './prt.json',
      }

      const repo = RoadmapRepository.fromConfig(config)
      expect(repo).to.be.instanceOf(RoadmapRepository)
    })

    it('should use default values when cache config is missing', () => {
      const config: Config = {
        $schema: 'https://example.com/schema.json',
        metadata: {
          description: 'Test',
          name: 'Test',
        },
        path: './prt.json',
      }

      const repo = RoadmapRepository.fromConfig(config)
      expect(repo).to.be.instanceOf(RoadmapRepository)
    })
  })

  describe('load', () => {
    it('should load roadmap from disk', async () => {
      const roadmap = await repository.load(testRoadmapPath)

      expect(roadmap).to.be.an('object')
      expect(roadmap).to.have.property('$schema')
      expect(roadmap).to.have.property('metadata')
      expect(roadmap).to.have.property('tasks')
    })

    it('should cache roadmap after first load', async () => {
      expect(repository.getCacheSize()).to.equal(0)

      await repository.load(testRoadmapPath)
      expect(repository.getCacheSize()).to.equal(1)
      expect(repository.isCached(testRoadmapPath)).to.be.true
    })

    it('should return cached roadmap on second load (cache hit)', async () => {
      const firstLoad = await repository.load(testRoadmapPath)
      const secondLoad = await repository.load(testRoadmapPath)

      // Should be the same object reference (from cache)
      expect(secondLoad).to.equal(firstLoad)
      expect(repository.getCacheSize()).to.equal(1)
    })

    it('should reload from disk if file has been modified', async () => {
      // First load
      const firstLoad = await repository.load(testRoadmapPath)

      // Wait a bit to ensure mtime changes
      await setTimeout(10)

      // Modify the file
      const modifiedRoadmap = createRoadmap({
        metadata: {
          ...firstLoad.metadata,
          description: 'Modified description',
        },
      })
      await writeFile(testRoadmapPath, JSON.stringify(modifiedRoadmap, null, 2), 'utf8')

      // Second load should get new data
      const secondLoad = await repository.load(testRoadmapPath)
      expect(secondLoad.metadata.description).to.equal('Modified description')
      expect(secondLoad).to.not.equal(firstLoad)
    })

    it('should not cache when caching is disabled', async () => {
      const noCacheRepo = new RoadmapRepository({cacheEnabled: false})

      await noCacheRepo.load(testRoadmapPath)
      expect(noCacheRepo.getCacheSize()).to.equal(0)

      await noCacheRepo.dispose()
    })

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.json')

      try {
        await repository.load(nonExistentPath)
        expect.fail('Expected load to throw an error')
      } catch (error) {
        expect(error).to.exist
      }
    })

    it('should throw error for invalid JSON', async () => {
      const invalidPath = join(tempDir, 'invalid.json')
      await writeFile(invalidPath, 'not valid json', 'utf8')

      try {
        await repository.load(invalidPath)
        expect.fail('Expected load to throw an error')
      } catch (error) {
        expect(error).to.be.instanceOf(SyntaxError)
      }
    })
  })

  describe('save', () => {
    it('should save roadmap to disk', async () => {
      const roadmap = createRoadmap({
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'test',
          description: 'New roadmap',
          name: 'Test Save',
        },
      })

      const newPath = join(tempDir, 'new-roadmap.json')
      await repository.save(newPath, roadmap)

      // Verify file was created
      const loaded = await repository.load(newPath)
      expect(loaded.metadata.name).to.equal('Test Save')
    })

    it('should update cache after save', async () => {
      // Load first
      await repository.load(testRoadmapPath)
      expect(repository.getCacheSize()).to.equal(1)

      // Modify and save
      const roadmap = await repository.load(testRoadmapPath)
      roadmap.metadata.description = 'Updated via save'
      await repository.save(testRoadmapPath, roadmap)

      // Cache should still have it
      expect(repository.getCacheSize()).to.equal(1)
      const cached = await repository.load(testRoadmapPath)
      expect(cached.metadata.description).to.equal('Updated via save')
    })

    it('should not cache when caching is disabled', async () => {
      const noCacheRepo = new RoadmapRepository({cacheEnabled: false})
      const roadmap = createRoadmap()

      await noCacheRepo.save(testRoadmapPath, roadmap)
      expect(noCacheRepo.getCacheSize()).to.equal(0)

      await noCacheRepo.dispose()
    })
  })

  describe('LRU cache eviction', () => {
    it('should evict oldest entry when cache is full', async () => {
      const smallCacheRepo = new RoadmapRepository({maxCacheSize: 2})

      // Create 3 roadmap files
      const path1 = join(tempDir, 'roadmap1.json')
      const path2 = join(tempDir, 'roadmap2.json')
      const path3 = join(tempDir, 'roadmap3.json')

      await writeFile(path1, JSON.stringify(createRoadmap(), null, 2), 'utf8')
      await writeFile(path2, JSON.stringify(createRoadmap(), null, 2), 'utf8')
      await writeFile(path3, JSON.stringify(createRoadmap(), null, 2), 'utf8')

      // Load first two (cache should be full)
      await smallCacheRepo.load(path1)
      await smallCacheRepo.load(path2)
      expect(smallCacheRepo.getCacheSize()).to.equal(2)
      expect(smallCacheRepo.isCached(path1)).to.be.true
      expect(smallCacheRepo.isCached(path2)).to.be.true

      // Load third (should evict first)
      await smallCacheRepo.load(path3)
      expect(smallCacheRepo.getCacheSize()).to.equal(2)
      expect(smallCacheRepo.isCached(path1)).to.be.false
      expect(smallCacheRepo.isCached(path2)).to.be.true
      expect(smallCacheRepo.isCached(path3)).to.be.true

      await smallCacheRepo.dispose()
    })

    it('should move accessed entry to end (most recently used)', async () => {
      const smallCacheRepo = new RoadmapRepository({maxCacheSize: 2})

      const path1 = join(tempDir, 'roadmap1.json')
      const path2 = join(tempDir, 'roadmap2.json')
      const path3 = join(tempDir, 'roadmap3.json')

      await writeFile(path1, JSON.stringify(createRoadmap(), null, 2), 'utf8')
      await writeFile(path2, JSON.stringify(createRoadmap(), null, 2), 'utf8')
      await writeFile(path3, JSON.stringify(createRoadmap(), null, 2), 'utf8')

      // Load 1 and 2
      await smallCacheRepo.load(path1)
      await smallCacheRepo.load(path2)

      // Access 1 again (moves it to end)
      await smallCacheRepo.load(path1)

      // Load 3 (should evict 2, not 1)
      await smallCacheRepo.load(path3)
      expect(smallCacheRepo.isCached(path1)).to.be.true
      expect(smallCacheRepo.isCached(path2)).to.be.false
      expect(smallCacheRepo.isCached(path3)).to.be.true

      await smallCacheRepo.dispose()
    })
  })

  describe('invalidate', () => {
    it('should remove entry from cache', async () => {
      await repository.load(testRoadmapPath)
      expect(repository.isCached(testRoadmapPath)).to.be.true

      repository.invalidate(testRoadmapPath)
      expect(repository.isCached(testRoadmapPath)).to.be.false
      expect(repository.getCacheSize()).to.equal(0)
    })

    it('should not throw error when invalidating non-cached path', () => {
      const nonExistentPath = join(tempDir, 'not-cached.json')
      expect(() => repository.invalidate(nonExistentPath)).to.not.throw()
    })
  })

  describe('invalidateAll', () => {
    it('should clear all cached entries', async () => {
      const path1 = join(tempDir, 'roadmap1.json')
      const path2 = join(tempDir, 'roadmap2.json')

      await writeFile(path1, JSON.stringify(createRoadmap(), null, 2), 'utf8')
      await writeFile(path2, JSON.stringify(createRoadmap(), null, 2), 'utf8')

      await repository.load(path1)
      await repository.load(path2)
      expect(repository.getCacheSize()).to.equal(2)

      repository.invalidateAll()
      expect(repository.getCacheSize()).to.equal(0)
    })
  })

  describe('file watching', () => {
    it('should set up watcher when watchFiles is enabled', async () => {
      const watchRepo = new RoadmapRepository({watchFiles: true})

      await watchRepo.load(testRoadmapPath)

      // File watching is enabled by default, but we can't easily test
      // the watcher behavior without waiting for file system events
      expect(watchRepo.getCacheSize()).to.equal(1)

      await watchRepo.dispose()
    })

    it('should invalidate cache when file is modified (with watcher)', async function () {
      // This test might be flaky due to timing, so we increase timeout
      this.timeout(5000)

      const watchRepo = new RoadmapRepository({watchFiles: true})

      // Initial load
      await watchRepo.load(testRoadmapPath)
      expect(watchRepo.isCached(testRoadmapPath)).to.be.true

      // Wait for watcher to be ready
      await setTimeout(500)

      // Modify file
      const modified = createRoadmap({
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'test',
          description: 'Modified by watcher test',
          name: 'Modified',
        },
      })
      await writeFile(testRoadmapPath, JSON.stringify(modified, null, 2), 'utf8')

      // Wait for watcher to detect change and invalidate
      await setTimeout(1000)

      // Cache should be invalidated
      expect(watchRepo.isCached(testRoadmapPath)).to.be.false

      await watchRepo.dispose()
    })

    it('should not set up watcher when watchFiles is disabled', async () => {
      const noWatchRepo = new RoadmapRepository({watchFiles: false})

      await noWatchRepo.load(testRoadmapPath)
      expect(noWatchRepo.getCacheSize()).to.equal(1)

      // Modify file
      await setTimeout(100)
      const modified = createRoadmap()
      await writeFile(testRoadmapPath, JSON.stringify(modified, null, 2), 'utf8')

      await setTimeout(500)

      // Cache should still be valid (no watcher to invalidate)
      expect(noWatchRepo.isCached(testRoadmapPath)).to.be.true

      await noWatchRepo.dispose()
    })
  })

  describe('dispose', () => {
    it('should close all watchers and clear cache', async () => {
      await repository.load(testRoadmapPath)
      expect(repository.getCacheSize()).to.equal(1)

      await repository.dispose()
      expect(repository.getCacheSize()).to.equal(0)
    })

    it('should not throw error when called multiple times', async () => {
      await repository.load(testRoadmapPath)
      await repository.dispose()
      await repository.dispose()
    })
  })

  describe('singleton pattern', () => {
    it('should return default repository instance', () => {
      const repo1 = getDefaultRepository()
      const repo2 = getDefaultRepository()

      expect(repo1).to.equal(repo2)
    })

    it('should reset default repository', async () => {
      const repo1 = getDefaultRepository()
      await repo1.load(testRoadmapPath)
      expect(repo1.getCacheSize()).to.equal(1)

      resetDefaultRepository()

      const repo2 = getDefaultRepository()
      expect(repo2).to.not.equal(repo1)
      expect(repo2.getCacheSize()).to.equal(0)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent loads of same file', async () => {
      const [result1, result2, result3] = await Promise.all([
        repository.load(testRoadmapPath),
        repository.load(testRoadmapPath),
        repository.load(testRoadmapPath),
      ])

      expect(result1).to.be.an('object')
      expect(result2).to.be.an('object')
      expect(result3).to.be.an('object')
      expect(repository.getCacheSize()).to.be.at.most(1)
    })

    it('should handle paths with special characters', async () => {
      const specialPath = join(tempDir, 'roadmap with spaces & symbols.json')
      await writeFile(specialPath, JSON.stringify(createRoadmap(), null, 2), 'utf8')

      const loaded = await repository.load(specialPath)
      expect(loaded).to.be.an('object')
      expect(repository.isCached(specialPath)).to.be.true
    })

    it('should handle very large roadmaps', async () => {
      const largeTasks = Array.from({length: 1000}, (_, i) => ({
        assignedTo: null,
        blocks: [],
        createdAt: new Date().toISOString(),
        'depends-on': [],
        details: `Task ${i} details`,
        dueDate: null,
        id: `F-${String(i + 1).padStart(3, '0')}` as Roadmap['tasks'][number]['id'],
        'passes-tests': false,
        priority: PRIORITY.Medium,
        status: STATUS.NotStarted,
        tags: [],
        title: `Task ${i}`,
        type: TASK_TYPE.Feature,
        updatedAt: new Date().toISOString(),
      })) satisfies Roadmap['tasks']

      const largeRoadmap = createRoadmap({tasks: largeTasks})
      const largePath = join(tempDir, 'large-roadmap.json')
      await writeFile(largePath, JSON.stringify(largeRoadmap, null, 2), 'utf8')

      const loaded = await repository.load(largePath)
      expect(loaded.tasks).to.have.lengthOf(1000)
    })
  })
})
