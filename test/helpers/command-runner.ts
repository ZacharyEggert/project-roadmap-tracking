/* eslint-disable @typescript-eslint/no-unused-expressions */

import type {Command} from '@oclif/core'

import {expect} from 'chai'

import type {Config, Roadmap} from '../../src/util/types.js'

import {cleanupTempDir, createTempConfigFile, createTempDir, createTempRoadmapFile} from './fs-helpers.js'

/**
 * Result from running a command
 */
export interface CommandResult {
  /** Error thrown by command (if any) */
  error?: Error
  /** Exit code (0 for success, non-zero for failure) */
  exitCode: number
  /** Captured stderr output */
  stderr: string
  /** Captured stdout output */
  stdout: string
}

/**
 * Execute an oclif command with the given arguments and flags
 * @param CommandClass - The command class to execute
 * @param args - Array of arguments to pass to the command
 * @param flags - Object of flags to pass to the command
 * @param cwd - Optional working directory for the command
 * @returns Promise resolving to CommandResult
 */
export async function runCommand(
  CommandClass: new (argv: string[], config: any) => Command,
  args: string[] = [],
  flags: Record<string, unknown> = {},
  cwd?: string,
): Promise<CommandResult> {
  const result: CommandResult = {
    exitCode: 0,
    stderr: '',
    stdout: '',
  }

  // Capture stdout
  const originalStdoutWrite = process.stdout.write
  const originalStderrWrite = process.stderr.write

  process.stdout.write = (chunk: unknown): boolean => {
    result.stdout += String(chunk)
    return true
  }

  process.stderr.write = (chunk: unknown): boolean => {
    result.stderr += String(chunk)
    return true
  }

  // Save and optionally change working directory
  const originalCwd = process.cwd()
  if (cwd) {
    process.chdir(cwd)
  }

  try {
    // Build argv array from args and flags
    const argv: string[] = [...args]
    for (const [key, value] of Object.entries(flags)) {
      if (value === true) {
        argv.push(`--${key}`)
      } else if (value !== false && value !== undefined) {
        argv.push(`--${key}=${value}`)
      }
    }

    // Create a minimal mock Config object for oclif commands
    const mockConfig = {
      bin: 'prt',
      cacheDir: '/tmp/prt-cache',
      configDir: '/tmp/prt-config',
      dataDir: '/tmp/prt-data',
      dirname: 'prt',
      errlog: '/tmp/prt-error.log',
      home: '/tmp',
      name: 'project-roadmap-tracking',
      pjson: {
        name: 'project-roadmap-tracking',
        version: '1.0.0',
      },
      root: process.cwd(),
      runHook: async () => ({failures: [], successes: []}),
      userAgent: 'prt/1.0.0',
      version: '1.0.0',
      windows: false,
    }

    // Instantiate and run the command
    const command = new CommandClass(argv, mockConfig as any)
    await command.run()
    result.exitCode = 0
  } catch (error) {
    result.error = error as Error
    result.exitCode = (error as {exitCode?: number})?.exitCode ?? 1
  } finally {
    // Restore stdout/stderr
    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite

    // Restore working directory
    if (cwd) {
      process.chdir(originalCwd)
    }
  }

  return result
}

/**
 * Capture output from a function that writes to stdout/stderr
 * @param fn - Function to execute while capturing output
 * @returns Object with stdout and stderr strings
 */
export async function captureOutput(fn: () => Promise<void>): Promise<{stderr: string; stdout: string}> {
  let stdout = ''
  let stderr = ''

  const originalStdoutWrite = process.stdout.write
  const originalStderrWrite = process.stderr.write

  process.stdout.write = (chunk: unknown): boolean => {
    stdout += String(chunk)
    return true
  }

  process.stderr.write = (chunk: unknown): boolean => {
    stderr += String(chunk)
    return true
  }

  try {
    await fn()
  } finally {
    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite
  }

  return {stderr, stdout}
}

/**
 * Run a test with a temporary roadmap file
 * @param roadmap - Roadmap object to use for testing
 * @param callback - Test function to run with the temp environment
 * @param includeConfig - Whether to create a config file (default: true)
 * @returns Promise that resolves when the callback completes
 */
export async function withTempRoadmap(
  roadmap: Roadmap,
  callback: (context: {configPath?: string; roadmapPath: string; tempDir: string}) => Promise<void>,
  includeConfig = true,
): Promise<void> {
  const tempDir = await createTempDir()

  try {
    const roadmapPath = await createTempRoadmapFile(roadmap, tempDir)
    let configPath: string | undefined

    if (includeConfig) {
      const config: Config = {
        $schema:
          'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
        metadata: {
          description: roadmap.metadata.description,
          name: roadmap.metadata.name,
        },
        path: roadmapPath,
      }
      configPath = await createTempConfigFile(config, tempDir)
    }

    // Change to temp directory so commands can find .prtrc.json
    const originalCwd = process.cwd()
    process.chdir(tempDir)

    try {
      await callback({configPath, roadmapPath, tempDir})
    } finally {
      process.chdir(originalCwd)
    }
  } finally {
    await cleanupTempDir(tempDir)
  }
}

/**
 * Assert that a command succeeded (exitCode 0, no error)
 * @param result - CommandResult from runCommand
 * @param message - Optional custom assertion message
 */
export function assertCommandSuccess(result: CommandResult, message = 'Expected command to succeed'): void {
  expect(result.error, message).to.be.undefined
  expect(result.exitCode, message).to.equal(0)
}

/**
 * Assert that a command failed with an expected error
 * @param result - CommandResult from runCommand
 * @param expectedError - Expected error message (string or regex)
 * @param message - Optional custom assertion message
 */
export function assertCommandError(
  result: CommandResult,
  expectedError?: RegExp | string,
  message = 'Expected command to fail',
): void {
  expect(result.error, message).to.exist
  expect(result.exitCode, message).to.not.equal(0)

  if (expectedError) {
    const errorMessage = result.error?.message ?? ''
    if (typeof expectedError === 'string') {
      expect(errorMessage, `Expected error message to contain "${expectedError}"`).to.include(expectedError)
    } else {
      expect(errorMessage, `Expected error message to match ${expectedError}`).to.match(expectedError)
    }
  }
}

/**
 * Helper for Mocha beforeEach hook - sets up temp environment with roadmap
 * @param roadmap - Roadmap object to use
 * @param includeConfig - Whether to create config file (default: true)
 * @returns Object with paths and cleanup function
 */
export async function setupCommandTest(
  roadmap: Roadmap,
  includeConfig = true,
): Promise<{
  cleanup: () => Promise<void>
  configPath?: string
  roadmapPath: string
  tempDir: string
}> {
  const tempDir = await createTempDir()
  const roadmapPath = await createTempRoadmapFile(roadmap, tempDir)
  let configPath: string | undefined

  if (includeConfig) {
    const config: Config = {
      $schema:
        'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
      metadata: {
        description: roadmap.metadata.description,
        name: roadmap.metadata.name,
      },
      path: roadmapPath,
    }
    configPath = await createTempConfigFile(config, tempDir)
  }

  return {
    cleanup: async () => cleanupTempDir(tempDir),
    configPath,
    roadmapPath,
    tempDir,
  }
}
