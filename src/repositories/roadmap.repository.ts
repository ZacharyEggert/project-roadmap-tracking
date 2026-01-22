import {FSWatcher, watch} from 'chokidar'
import {readFile, stat, writeFile} from 'node:fs/promises'

import {Config, Roadmap} from '../util/types.js'

/**
 * LRU Cache entry with metadata
 */
interface CacheEntry {
  data: Roadmap
  mtime: number
  path: string
}

/**
 * Configuration for RoadmapRepository
 */
export interface RepositoryConfig {
  cacheEnabled?: boolean
  maxCacheSize?: number
  watchFiles?: boolean
}

/**
 * RoadmapRepository provides caching and file watching for roadmap data.
 * Features:
 * - In-memory LRU cache with configurable size
 * - Automatic cache invalidation on writes
 * - File system watching for external changes (using chokidar)
 * - Configuration via .prtrc.json cache settings
 */
export class RoadmapRepository {
  private cache: Map<string, CacheEntry> = new Map()
  private config: RepositoryConfig
  private watchers: Map<string, FSWatcher> = new Map()

  constructor(config?: RepositoryConfig) {
    this.config = {
      cacheEnabled: config?.cacheEnabled ?? true,
      maxCacheSize: config?.maxCacheSize ?? 10,
      watchFiles: config?.watchFiles ?? true,
    }
  }

  /**
   * Create a repository instance from a Config object
   */
  static fromConfig(config: Config): RoadmapRepository {
    return new RoadmapRepository({
      cacheEnabled: config.cache?.enabled ?? true,
      maxCacheSize: config.cache?.maxSize ?? 10,
      watchFiles: config.cache?.watchFiles ?? true,
    })
  }

  /**
   * Stop all file watchers and clear cache
   */
  async dispose(): Promise<void> {
    // Close all watchers
    await Promise.all([...this.watchers.values()].map((watcher) => watcher.close()))

    this.watchers.clear()
    this.cache.clear()
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Invalidate cache for a specific path
   * @param path - Path to invalidate
   */
  invalidate(path: string): void {
    this.cache.delete(path)
  }

  /**
   * Invalidate all cached roadmaps
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Check if a path is cached
   */
  isCached(path: string): boolean {
    return this.cache.has(path)
  }

  /**
   * Load a roadmap from the file system with caching
   * @param path - Path to the roadmap file
   * @returns The loaded roadmap
   */
  async load(path: string): Promise<Roadmap> {
    // Check if caching is disabled
    if (!this.config.cacheEnabled) {
      return this.loadFromDisk(path)
    }

    // Check if we have a cached version
    const cached = this.cache.get(path)
    if (cached) {
      // Verify cache is still valid by checking mtime
      try {
        const stats = await stat(path)
        const currentMtime = stats.mtimeMs

        if (currentMtime === cached.mtime) {
          // Cache hit - move to end for LRU
          this.cache.delete(path)
          this.cache.set(path, cached)
          return cached.data
        }
      } catch {
        // If stat fails, invalidate cache and reload
        this.invalidate(path)
      }
    }

    // Cache miss or stale - load from disk
    const roadmap = await this.loadFromDisk(path)
    const stats = await stat(path)

    // Add to cache with LRU eviction
    this.addToCache(path, roadmap, stats.mtimeMs)

    // Set up file watcher if enabled
    if (this.config.watchFiles && !this.watchers.has(path)) {
      this.setupWatcher(path)
    }

    return roadmap
  }

  /**
   * Save a roadmap to the file system and update cache
   * @param path - Path to the roadmap file
   * @param roadmap - The roadmap to save
   */
  async save(path: string, roadmap: Roadmap): Promise<void> {
    await writeFile(path, JSON.stringify(roadmap, null, 2), 'utf8')

    // Update cache if caching is enabled
    if (this.config.cacheEnabled) {
      const stats = await stat(path)
      this.addToCache(path, roadmap, stats.mtimeMs)
    }
  }

  /**
   * Add entry to cache with LRU eviction
   */
  private addToCache(path: string, data: Roadmap, mtime: number): void {
    // Remove old entry if exists (for LRU reordering)
    if (this.cache.has(path)) {
      this.cache.delete(path)
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= (this.config.maxCacheSize ?? 10)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
        // Also stop watching evicted file
        const watcher = this.watchers.get(firstKey)
        if (watcher) {
          watcher.close().catch(() => {
            /* ignore close errors */
          })
          this.watchers.delete(firstKey)
        }
      }
    }

    // Add new entry
    this.cache.set(path, {data, mtime, path})
  }

  /**
   * Load roadmap from disk without caching
   */
  private async loadFromDisk(path: string): Promise<Roadmap> {
    const data = await readFile(path, 'utf8')
    return JSON.parse(data) as Roadmap
  }

  /**
   * Set up file watcher for a path
   */
  private setupWatcher(path: string): void {
    const watcher = watch(path, {
      awaitWriteFinish: {
        pollInterval: 100,
        stabilityThreshold: 250,
      },
      persistent: false,
    })

    watcher.on('change', () => {
      this.invalidate(path)
    })

    watcher.on('unlink', () => {
      this.invalidate(path)
      this.watchers
        .get(path)
        ?.close()
        .catch(() => {
          /* ignore close errors */
        })
      this.watchers.delete(path)
    })

    this.watchers.set(path, watcher)
  }
}

// Singleton instance with default configuration
let defaultInstance: null | RoadmapRepository = null

/**
 * Get the default repository instance
 */
export function getDefaultRepository(): RoadmapRepository {
  if (!defaultInstance) {
    defaultInstance = new RoadmapRepository()
  }

  return defaultInstance
}

/**
 * Reset the default repository instance (useful for testing)
 */
export function resetDefaultRepository(): void {
  if (defaultInstance) {
    defaultInstance.dispose().catch(() => {
      /* ignore disposal errors */
    })
    defaultInstance = null
  }
}

export default getDefaultRepository()
