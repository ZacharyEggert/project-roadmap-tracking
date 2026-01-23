import {Ajv, type ValidateFunction} from 'ajv'
import {readFile, stat} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {ConfigNotFoundError, ValidationError, type ValidationErrorDetail} from '../errors/index.js'
import {Config} from '../util/types.js'

/**
 * Cache entry for config with metadata
 */
interface ConfigCacheEntry {
  data: Config
  mtime: number
  path: string
}

/**
 * Configuration for ConfigRepository
 */
export interface ConfigRepositoryConfig {
  cacheEnabled?: boolean
  searchPaths?: string[]
}

/**
 * ConfigRepository provides caching, validation, and inheritance for config files.
 * Features:
 * - In-memory cache with mtime-based invalidation
 * - Multi-level config inheritance (project → user → global)
 * - JSON schema validation using schemas/config/v1.1.json
 * - Shallow merge strategy for inherited configs
 */
export class ConfigRepository {
  private static configSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    additionalProperties: false,
    properties: {
      $schema: {
        description: 'Reference to the JSON schema for validation',
        type: 'string',
      },
      cache: {
        additionalProperties: false,
        description: 'Caching configuration for the roadmap repository',
        properties: {
          enabled: {
            default: true,
            description: 'Enable in-memory caching of roadmap data',
            type: 'boolean',
          },
          maxSize: {
            default: 10,
            description: 'Maximum number of roadmaps to cache (LRU eviction)',
            minimum: 1,
            type: 'number',
          },
          watchFiles: {
            default: true,
            description: 'Watch roadmap files for external changes and auto-invalidate cache',
            type: 'boolean',
          },
        },
        type: 'object',
      },
      metadata: {
        additionalProperties: false,
        description: 'Metadata about the project roadmap',
        properties: {
          description: {
            description: 'Description of the project roadmap',
            type: 'string',
          },
          name: {
            description: 'Name of the project roadmap',
            type: 'string',
          },
        },
        type: 'object',
      },
      path: {
        default: './prt.json',
        description: 'Path to the prt.json roadmap file',
        type: 'string',
      },
    },
    required: ['path'],
    type: 'object',
  }
  private cache: ConfigCacheEntry | null = null
  private config: ConfigRepositoryConfig
  private validateSchema: ValidateFunction

  constructor(config?: ConfigRepositoryConfig) {
    this.config = {
      cacheEnabled: config?.cacheEnabled ?? true,
      searchPaths: config?.searchPaths ?? this.getDefaultSearchPaths(),
    }

    // Initialize JSON schema validator
    const ajv = new Ajv({allErrors: true})
    this.validateSchema = ajv.compile(ConfigRepository.configSchema)
  }

  /**
   * Get the currently cached config (if any)
   */
  getCachedConfig(): Config | null {
    return this.cache?.data ?? null
  }

  /**
   * Clear the in-memory cache
   */
  invalidateCache(): void {
    this.cache = null
  }

  /**
   * Load config with caching and inheritance
   * Searches for config files in order: project → user → global
   * Merges configs with shallow merge (project overrides user overrides global)
   */
  async load(): Promise<Config> {
    // Check cache if enabled
    if (this.config.cacheEnabled && this.cache) {
      const isValid = await this.isCacheValid()
      if (isValid) {
        return this.cache.data
      }
    }

    // Load and merge configs from all search paths
    const configs = await this.loadAllConfigs()

    if (configs.length === 0) {
      throw new ConfigNotFoundError('.prtrc.json')
    }

    // Shallow merge: project overrides user overrides global
    const merged = this.mergeConfigs(configs)

    // Validate merged config
    this.validateConfig(merged)

    // Cache the result
    if (this.config.cacheEnabled) {
      const stats = await stat(configs[0].path) // Use mtime of project-level config
      this.cache = {
        data: merged,
        mtime: stats.mtimeMs,
        path: configs[0].path,
      }
    }

    return merged
  }

  /**
   * Reload config from disk, bypassing cache
   */
  async reload(): Promise<Config> {
    this.invalidateCache()
    return this.load()
  }

  /**
   * Get default config file search paths
   * Order: project → user → global
   */
  private getDefaultSearchPaths(): string[] {
    const paths = [
      '.prtrc.json', // Project level (current directory)
      join(homedir(), '.prtrc.json'), // User level
    ]

    // Global level (Unix-like systems only)
    if (process.platform !== 'win32') {
      paths.push('/etc/prt/.prtrc.json')
    }

    return paths
  }

  /**
   * Check if cached config is still valid by comparing mtime
   */
  private async isCacheValid(): Promise<boolean> {
    if (!this.cache) {
      return false
    }

    try {
      const stats = await stat(this.cache.path)
      return stats.mtimeMs === this.cache.mtime
    } catch {
      // If stat fails, cache is invalid
      return false
    }
  }

  /**
   * Load all available configs from search paths
   * Returns array in order of precedence (project first, global last)
   */
  private async loadAllConfigs(): Promise<Array<{config: Config; path: string}>> {
    const paths = this.config.searchPaths ?? []
    const configPromises = paths.map(async (path) => {
      const config = await this.loadConfigFromPath(path)
      return config ? {config, path} : null
    })

    const results = await Promise.all(configPromises)
    return results.filter((result): result is {config: Config; path: string} => result !== null)
  }

  /**
   * Load config from a specific path
   */
  private async loadConfigFromPath(path: string): Promise<Config | null> {
    try {
      const data = await readFile(path, 'utf8')
      const config = JSON.parse(data) as Config
      return config
    } catch (error) {
      // Re-throw SyntaxError for JSON parsing issues
      if (error instanceof SyntaxError) {
        throw error
      }

      // Return null for file not found (not an error during inheritance search)
      return null
    }
  }

  /**
   * Merge configs using shallow merge strategy
   * Project-level config takes precedence over user-level over global-level
   */
  private mergeConfigs(configs: Array<{config: Config; path: string}>): Config {
    if (configs.length === 0) {
      throw new ConfigNotFoundError('.prtrc.json')
    }

    // Start with the lowest precedence config (last in array)
    const lastConfig = configs.at(-1)
    if (!lastConfig) {
      throw new ConfigNotFoundError('.prtrc.json')
    }

    let merged = {...lastConfig.config}

    // Apply each higher-precedence config (working backwards)
    for (let i = configs.length - 2; i >= 0; i--) {
      merged = {
        ...merged,
        ...configs[i].config,
        // Deep merge for nested objects
        cache: configs[i].config.cache ? {...merged.cache, ...configs[i].config.cache} : merged.cache,
        metadata: configs[i].config.metadata ? {...merged.metadata, ...configs[i].config.metadata} : merged.metadata,
      }
    }

    return merged
  }

  /**
   * Validate config against JSON schema
   */
  private validateConfig(config: Config): void {
    try {
      const valid = this.validateSchema(config)

      if (!valid) {
        // Handle case where validateSchema.errors might be null/undefined
        if (!this.validateSchema.errors || !Array.isArray(this.validateSchema.errors)) {
          throw new ValidationError([
            {
              field: 'config',
              message: 'Schema validation failed',
              type: 'structure',
            },
          ])
        }

        const errorDetails: ValidationErrorDetail[] = this.validateSchema.errors.map((err) => ({
          field: err.instancePath || 'config',
          message: err.message || 'Unknown error',
          type: 'structure',
        }))

        throw new ValidationError(errorDetails)
      }
    } catch (error) {
      // If it's already a ValidationError, re-throw it
      if (error instanceof ValidationError) {
        throw error
      }

      // Wrap any other error (like TypeError) in ValidationError
      throw new ValidationError([
        {
          field: 'config',
          message: error instanceof Error ? error.message : String(error),
          type: 'structure',
        },
      ])
    }
  }
}

// Singleton instance with default configuration
let defaultInstance: ConfigRepository | null = null

/**
 * Get the default config repository instance
 */
export function getDefaultConfigRepository(): ConfigRepository {
  if (!defaultInstance) {
    defaultInstance = new ConfigRepository()
  }

  return defaultInstance
}

/**
 * Reset the default config repository instance (useful for testing)
 */
export function resetDefaultConfigRepository(): void {
  if (defaultInstance) {
    defaultInstance.invalidateCache()
    defaultInstance = null
  }
}
