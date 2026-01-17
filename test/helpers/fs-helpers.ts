import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import * as os from 'node:os'
import { join } from 'node:path'

import type { Config, Roadmap } from '../../src/util/types.js'

/**
 * Create a temporary directory for testing
 * @param prefix - Optional prefix for the temp directory name
 * @returns Path to the created temporary directory
 */
export async function createTempDir(prefix = 'prt-test-'): Promise<string> {
  const tempDir = await fsPromises.mkdtemp(join(os.tmpdir(), prefix))
  return tempDir
}

/**
 * Clean up a temporary directory and all its contents
 * @param dirPath - Path to the directory to clean up
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fsPromises.rm(dirPath, { force: true, recursive: true })
  } catch (error) {
    // Ignore errors during cleanup (directory might not exist)
    console.warn(`Failed to cleanup temp directory ${dirPath}:`, error)
  }
}

/**
 * Write a roadmap object to a temporary file
 * @param roadmap - Roadmap object to write
 * @param dirPath - Optional directory path (creates temp dir if not provided)
 * @param fileName - Optional file name (defaults to 'prt.json')
 * @returns Path to the created file
 */
export async function createTempRoadmapFile(
  roadmap: Roadmap,
  dirPath?: string,
  fileName = 'prt.json',
): Promise<string> {
  const dir = dirPath ?? await createTempDir()
  const filePath = join(dir, fileName)
  await fsPromises.writeFile(filePath, JSON.stringify(roadmap, null, 2), 'utf8')
  return filePath
}

/**
 * Write a config object to a temporary file
 * @param config - Config object to write
 * @param dirPath - Optional directory path (creates temp dir if not provided)
 * @param fileName - Optional file name (defaults to '.prtrc.json')
 * @returns Path to the created file
 */
export async function createTempConfigFile(
  config: Config,
  dirPath?: string,
  fileName = '.prtrc.json',
): Promise<string> {
  const dir = dirPath ?? await createTempDir()
  const filePath = join(dir, fileName)
  await fsPromises.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8')
  return filePath
}

/**
 * Read contents of a temporary file
 * @param filePath - Path to the file to read
 * @returns File contents as string
 */
export async function readTempFile(filePath: string): Promise<string> {
  return fsPromises.readFile(filePath, 'utf8')
}

/**
 * Read and parse a JSON file
 * @param filePath - Path to the JSON file to read
 * @returns Parsed JSON object
 */
export async function readTempJsonFile<T>(filePath: string): Promise<T> {
  const contents = await readTempFile(filePath)
  return JSON.parse(contents) as T
}

/**
 * Check if a file exists
 * @param filePath - Path to check
 * @returns True if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Helper for Mocha beforeEach hook - creates a temp directory
 * @returns Object with tempDir path and cleanup function
 */
export async function setupTempDir(): Promise<{ cleanup: () => Promise<void>; tempDir: string }> {
  const tempDir = await createTempDir()
  return {
    cleanup: async () => cleanupTempDir(tempDir),
    tempDir,
  }
}

/**
 * Helper for Mocha beforeEach hook - creates temp dir with roadmap and config
 * @param roadmap - Roadmap object to create
 * @param config - Config object to create
 * @returns Object with paths and cleanup function
 */
export async function setupTestEnvironment(
  roadmap: Roadmap,
  config?: Config,
): Promise<{
  cleanup: () => Promise<void>
  configPath?: string
  roadmapPath: string
  tempDir: string
}> {
  const tempDir = await createTempDir()
  const roadmapPath = await createTempRoadmapFile(roadmap, tempDir)
  let configPath: string | undefined

  if (config) {
    configPath = await createTempConfigFile(config, tempDir)
  }

  return {
    cleanup: async () => cleanupTempDir(tempDir),
    configPath,
    roadmapPath,
    tempDir,
  }
}
